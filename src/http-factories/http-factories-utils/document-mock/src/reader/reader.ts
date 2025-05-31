import { isHTMLMimeType, isHTMLVoidElement } from "../conventions.ts";
import { Builder, Locator } from "../builder.ts";
import { ParseError } from "../errors.ts";
import {
  combine,
  QNAME_GROUP,
  S_OPT,
  UNICODE_REPLACEMENT_CHARACTER,
} from "../grammar.ts";
import {
  appendElement,
  appendText,
  copy,
  copyLocator,
  ElementAttributes,
  ElementAttributesLike,
  ErrorHandler,
  getEntityReplacer,
  position,
  tryPosition,
} from "./reader-utils.ts";
import { parseDoctypeCommentOrCData } from "./parse-doctype-comment-or-c-data.ts";
import { parseProcessingInstruction } from "./parse-processing-instructions.ts";
import { parseHtmlSpecialContent } from "./parse-html-special-content.ts";
import { parseElementStartPart } from "./parse-element-start-part.ts";

/**
 * @returns
 * [lineStart, lineEnd, end, tagStart, continueParsing]
 */
const parseStep = (
  source: string,
  start: number,
  end: number,
  isHTML: boolean,
  unclosedTags: string[],
  errorHandler: ErrorHandler,
  builder: Builder,
  entityReplacer: (reference: string) => string,
  locator: Locator,
  lineStart: number,
  lineEnd: number,
  parseStack: ElementAttributesLike[],
): [number, number, number, number, boolean] => {
  const tagStart = source.indexOf("<", start);
  if (tagStart < 0) {
    if (!isHTML && unclosedTags.length > 0) {
      errorHandler.fatalError(
        "unclosed xml tag(s): " + unclosedTags.join(", "),
      );
      return [-1, -1, -1, -1, false];
    }
    if (!source.substring(start).match(/^\s*$/)) {
      const doc: any = builder.doc;
      const text = doc.createTextNode(source.substring(start));
      if (doc.documentElement) {
        errorHandler.error("Extra content at the end of the document");
        return [-1, -1, -1, -1, false];
      }
      doc.appendChild(text);
      builder.currentElement = text;
    }
    return [-1, -1, -1, -1, false];
  }
  if (tagStart > start) {
    let fromSource = source.substring(start, tagStart);
    if (!isHTML && unclosedTags.length === 0) {
      fromSource = fromSource.replace(new RegExp(S_OPT.source, "g"), "");
      fromSource &&
        errorHandler.error(
          "Unexpected content outside root element: '" + fromSource + "'",
        );
    }
    [lineStart, lineEnd, end] = appendText(
      tagStart,
      start,
      source,
      entityReplacer,
      locator,
      lineStart,
      lineEnd,
      builder,
    );
  }

  const thing = source.charAt(tagStart + 1);

  if (thing === "/") {
    end = source.indexOf(">", tagStart + 2);
    const tagNameRaw = source.substring(
      tagStart + 2,
      end > 0 ? end : undefined,
    );
    if (!tagNameRaw) {
      errorHandler.fatalError("end tag name missing");
      return [-1, -1, -1, -1, false];
    }
    const tagNameMatch = end > 0 &&
      combine("^", QNAME_GROUP, S_OPT, "$").exec(tagNameRaw);
    if (!tagNameMatch) {
      errorHandler.fatalError(
        'end tag name contains invalid characters: "' + tagNameRaw + '"',
      );
      return [-1, -1, -1, -1, false];
    }
    if (!builder.currentElement && !builder?.doc?.documentElement) {
      // not enough information to provide a helpful error message,
      // but parsing will throw since there is no root element
      return [-1, -1, -1, -1, false];
    }
    const currentTagName = unclosedTags[unclosedTags.length - 1] ||
      builder.currentElement.tagName ||
      builder.doc?.documentElement?.tagName ||
      "";
    if (currentTagName !== tagNameMatch[1]) {
      const tagNameLower = tagNameMatch[1].toLowerCase();
      if (!isHTML || currentTagName.toLowerCase() !== tagNameLower) {
        errorHandler.fatalError(
          'Opening and ending tag mismatch: "' + currentTagName + '" != "' +
            tagNameRaw + '"',
        );
        return [-1, -1, -1, -1, false];
      }
    }
    const config = parseStack.pop();
    unclosedTags.pop();
    const localNSMap = config?.localNSMap;
    builder.endElement(
      config?.uri as string,
      config?.localName as string,
      currentTagName,
    );
    if (localNSMap) {
      for (const prefix in localNSMap) {
        if (Object.hasOwn(localNSMap, prefix)) {
          builder.endPrefixMapping(prefix);
        }
      }
    }

    end++;
  } else if (thing === "?") { // <?...?>
    [lineStart, lineEnd] = tryPosition(
      start,
      source,
      lineStart,
      lineEnd,
      locator,
    );
    end = parseProcessingInstruction(
      source,
      tagStart,
      builder,
      errorHandler,
    ) || 0;
  } else if (thing === "!") { // <!doctype,<![CDATA,<!--
    [lineStart, lineEnd] = tryPosition(
      start,
      source,
      lineStart,
      lineEnd,
      locator,
    );
    end = parseDoctypeCommentOrCData(
      source,
      tagStart,
      builder,
      errorHandler,
      isHTML,
    ) || 0;
  } else {
    [lineStart, lineEnd] = tryPosition(
      start,
      source,
      lineStart,
      lineEnd,
      locator,
    );
    const el = new ElementAttributes();
    const currentNSMap = parseStack[parseStack.length - 1].currentNSMap;
    //elStartEnd
    end = parseElementStartPart(
      source,
      tagStart,
      el,
      entityReplacer,
      errorHandler,
      isHTML,
    ) || 0;
    const len = el.attrs.length;

    if (!el.closed) {
      if (isHTML && isHTMLVoidElement(el.tagName || "")) {
        el.closed = true;
      } else {
        unclosedTags.push(el.tagName || "");
      }
    }
    if (locator && len) {
      const locatorCopy = copyLocator(locator, {
        columnNumber: -1,
        lineNumber: -1,
      });
      //try{//attribute position fixed
      for (let i = 0; i < len; i++) {
        const a = el.attrs[i];
        [lineStart, lineEnd] = position(
          a.offset,
          source,
          lineStart,
          lineEnd,
          locator,
        );
        a.locator = copyLocator(locator, {
          columnNumber: -1,
          lineNumber: -1,
        });
      }
      builder.locator = locatorCopy;
      if (appendElement(el, builder, currentNSMap || {})) {
        parseStack.push(el);
      }
      builder.locator = locator;
    } else {
      if (appendElement(el, builder, currentNSMap || {})) {
        parseStack.push(el);
      }
    }

    if (isHTML && !el.closed) {
      end = parseHtmlSpecialContent(
        source,
        end,
        el.tagName || "",
        entityReplacer,
        builder,
      );
    } else {
      end++;
    }
  }

  return [lineStart, lineEnd, end, tagStart, true];
};

const parseInternal = (
  source: string,
  defaultNSMapCopy: { [key: string]: string },
  entityMap: { [key: string]: string },
  builder: Builder,
  errorHandler: ErrorHandler,
) => {
  const isHtml = isHTMLMimeType(builder.mimeType || "");

  if (source.indexOf(UNICODE_REPLACEMENT_CHARACTER) >= 0) {
    errorHandler?.warning(
      "Unicode replacement character detected, source encoding issues?",
    );
  }

  const locator = builder.locator as Locator;
  const parseStack: ElementAttributesLike[] = [{
    currentNSMap: defaultNSMapCopy,
  }];
  const entityReplacer = getEntityReplacer(isHtml, errorHandler, entityMap);
  const unclosedTags: string[] = [];

  // -- stateful variables
  let start = 0;
  let lineStart = 0;
  let lineEnd = 0;
  let end = -1;
  let tagStart = -1;
  let continueParsing = true;

  while (continueParsing) {
    try {
      [lineStart, lineEnd, end, tagStart, continueParsing] = parseStep(
        source,
        start,
        end,
        isHtml,
        unclosedTags,
        errorHandler,
        builder,
        entityReplacer,
        locator,
        lineStart,
        lineEnd,
        parseStack,
      );
    } catch (error) {
      if (error instanceof ParseError) {
        throw error;
      } else if (error instanceof DOMException) {
        throw new ParseError(`${error.name}: ${error.message}`, locator);
      }

      errorHandler.error(`element parse error: ${error}`);
      end = -1;
    }

    if (continueParsing && end > start) {
      start = end;
    } else if (continueParsing) {
      [lineStart, lineEnd, end] = appendText(
        Math.max(tagStart, start) + 1,
        start,
        source,
        entityReplacer,
        locator,
        lineStart,
        lineEnd,
        builder,
      );
    }
  }
};

/**
 * Responsible for reading a string as an XML document.
 * To function as a parser it must be given a Builder which is reponsible for
 * converting what is read into some sort of storage.
 */
export class XMLReader {
  builder: Builder;

  errorHandler: ErrorHandler;

  constructor(builder: Builder, errorHandler: ErrorHandler) {
    this.builder = builder;
    this.errorHandler = errorHandler;
  }

  parse(
    source: string,
    defaultNSMap: { [key: string]: string },
    entityMap: { [key: string]: string },
  ) {
    const builder = this.builder;
    builder.startDocument();
    const defaultNSMapCopy = copy(defaultNSMap, Object.create(null));
    parseInternal(
      source,
      defaultNSMapCopy,
      entityMap,
      builder,
      this.errorHandler,
    );
    builder.endDocument();
  }
}
