import { Builder } from "../builder.ts";
import {
  ABOUT_LEGACY_COMPAT,
  ABOUT_LEGACY_COMPAT_SystemLiteral,
  ATTLIST_DECL,
  CD_SECT,
  CDATA_END,
  CDATA_START,
  combine,
  COMMENT,
  COMMENT_END,
  COMMENT_START,
  DOCTYPE_DECL_START,
  ELEMENT_DECL,
  ENTITY_DECL,
  EXTERNAL_ID_match,
  NAME,
  NOTATION_DECL,
  PE_REFERENCE,
  PI,
  PUBLIC,
  SYSTEM,
} from "../grammar.ts";
import { ErrorHandler } from "./reader-utils.ts";

const UPDATE_STATE = Symbol("ParseUtils[UPDATE_STATE]");

class ParseUtils {
  #source: string;

  #index: number;

  get index() {
    return this.#index;
  }

  get source() {
    return this.#source;
  }

  constructor(source: string, start: number) {
    this.#source = source;
    this.#index = start;
  }

  char(n?: number) {
    return this.#source.charAt(this.#index + (n || 0));
  }

  skip(n?: number) {
    this.#index += n || 1;
  }

  skipBlanks() {
    let blanks = 0;

    while (this.#index < this.#source.length) {
      const c = this.char();

      if (c !== " " && c !== "\n" && c !== "\t" && c !== "\r") {
        return blanks;
      }

      blanks++;
      this.skip();
    }

    return -1;
  }

  substringFromIndex() {
    return this.#source.substring(this.#index);
  }

  substringStartsWith(text: string, caseSensitive = true) {
    let substring = this.#source.substring(
      this.#index,
      this.#index + text.length,
    );

    if (!caseSensitive) {
      text = text.toLowerCase();
      substring = substring.toLowerCase();
    }

    return substring === text;
  }

  getMatch(args: string | RegExp) {
    const match = combine("^", args).exec(this.substringFromIndex());

    if (match === null) {
      return null;
    }

    this.skip(match[0].length);
    return match[0];
  }

  [UPDATE_STATE](source: string, index: number) {
    this.#source = source;
    this.#index = index;
  }
}

/**
 * An extremely simple container for a ParseUtils singleton.
 * Every time this function is called the singleton state is set according to
 * the given parameters.
 * @param source
 * Source string to parse.
 * @param start
 * Index within the source string to start parsing from.
 * @returns
 */
export const getParseUtils = (source: string, start: number) => {
  let parseUtils: ParseUtils | undefined;

  if (parseUtils === undefined) {
    parseUtils = new ParseUtils(source, start);
  } else {
    parseUtils[UPDATE_STATE](source, start);
  }

  return parseUtils;
};

/**
 * Parse XML processing instructions.
 * Returns `null` if ParseUtils is not located at properly-formatted PI.
 */
const parsePI = (parseUtils: ParseUtils, errorHandler: ErrorHandler) => {
  const match = PI.exec(parseUtils.substringFromIndex());

  if (match === null) {
    errorHandler.fatalError(
      `processing instruction is not well-formed at position ${parseUtils.index}`,
    );
    return null;
  }

  if (match[1].toLowerCase() === "xml") {
    errorHandler.fatalError(
      `xml declaration is only allowed at the start of the document, but found at position ${parseUtils.index}`,
    );
    return null;
  }

  parseUtils.skip(match[0].length);
  return match[0];
};

const parseDoctypeInternalSubset = (
  parseUtils: ParseUtils,
  errorHandler: ErrorHandler,
) => {
  if (parseUtils.char() !== "[") {
    return;
  }

  const source = parseUtils.source;

  parseUtils.skip(1);

  const inSubsetStart = parseUtils.index;

  while (parseUtils.index < source.length) {
    parseUtils.skipBlanks();
    if (parseUtils.char() === "]") {
      const internalSubset = source.substring(
        inSubsetStart,
        parseUtils.index,
      );
      parseUtils.skip(1);
      return internalSubset;
    }

    let current: string | null = null;
    const chars0 = parseUtils.char();
    const chars1 = parseUtils.char(1);
    const chars2 = parseUtils.char(2);
    const chars3 = parseUtils.char(3);

    if (chars0 === "<" && chars1 === "!") {
      if (chars2 === "E" && chars3 === "L") {
        current = parseUtils.getMatch(ELEMENT_DECL);
      } else if (chars2 === "E" && chars3 === "N") {
        current = parseUtils.getMatch(ENTITY_DECL);
      } else if (chars2 === "A") {
        current = parseUtils.getMatch(ATTLIST_DECL);
      } else if (chars2 === "N") {
        current = parseUtils.getMatch(NOTATION_DECL);
      } else if (chars2 === "-") {
        current = parseUtils.getMatch(COMMENT);
      }
    } else if (chars0 === "<" && chars1 === "?") {
      current = parsePI(parseUtils, errorHandler);
    } else if (chars0 === "%") {
      current = parseUtils.getMatch(PE_REFERENCE);
    } else {
      errorHandler.fatalError("Error detected in Markup declaration");
      return;
    }

    if (current === null) {
      errorHandler.fatalError("Error detected in Markup declaration");
      return;
    }
  }

  errorHandler.fatalError(
    'doctype internal subset is not well-formed, missing "]"',
  );
  return;
};

export const parseDoctypeCommentOrCData = (
  source: string,
  start: number,
  builder: Builder,
  errorHandler: ErrorHandler,
  isHTML: boolean,
) => {
  const parseUtils = getParseUtils(source, start);

  const char = isHTML ? parseUtils.char(2).toUpperCase() : parseUtils.char(2);

  if (char === "-") {
    const comment = parseUtils.getMatch(COMMENT);
    if (comment !== null) {
      builder.comment(
        comment,
        COMMENT_START.length,
        comment.length - COMMENT_START.length - COMMENT_END.length,
      );
      return parseUtils.index;
    } else {
      errorHandler.fatalError(
        `comment is not well-formed at position ${parseUtils.index}`,
      );
      return;
    }
  } else if (char === "[") {
    const cdata = parseUtils.getMatch(CD_SECT);

    if (cdata !== null) {
      if (!isHTML && !builder.currentElement) {
        errorHandler.fatalError("CDATA outside of element");
        return;
      }
      builder.startCDATA();
      builder.characters(
        cdata,
        CDATA_START.length,
        cdata.length - CDATA_START.length - CDATA_END.length,
      );
      builder.endCDATA();
    } else {
      errorHandler.fatalError(`Invalid CDATA starting at position ${start}`);
      return;
    }
  } else if (char === "D") {
    if (builder.doc && builder.doc.documentElement) {
      errorHandler.fatalError(
        `Doctype not allowed inside or after documentElement at position ${parseUtils.index}`,
      );
      return;
    }

    if (
      isHTML
        ? !parseUtils.substringStartsWith(DOCTYPE_DECL_START, false)
        : !parseUtils.substringStartsWith(DOCTYPE_DECL_START)
    )
    if (
      isHTML
        ? !parseUtils.substringStartsWith(DOCTYPE_DECL_START, false)
        : !parseUtils.substringStartsWith(DOCTYPE_DECL_START)
    ) {
      errorHandler.fatalError(
        `Expected ${DOCTYPE_DECL_START} at position ${parseUtils.index}`,
      );
      return;
    }

    parseUtils.skip(DOCTYPE_DECL_START.length);

    if (parseUtils.skipBlanks() < 1) {
      errorHandler.fatalError(
        `Expected whitespace after ${DOCTYPE_DECL_START} at position ${parseUtils.index}`,
      );
      return;
    }

    const doctype: {
      name?: string | null;
      publicId?: string;
      systemId?: string | null;
      internalSubset?: string;
    } = {
      name: undefined,
      publicId: undefined,
      systemId: undefined,
      internalSubset: undefined,
    };

    doctype.name = parseUtils.getMatch(NAME);

    if (doctype.name === null) {
      errorHandler.fatalError(
        `doctype name missing or contains unexpected characters ar position ${parseUtils.index}`,
      );
      return;
    }

    if (isHTML && doctype.name.toLowerCase() !== "html") {
      errorHandler.warning(
        `Unexpected DOCTYPE in HTML document at position ${parseUtils.index}`,
      );
    }
    parseUtils.skipBlanks();

    if (
      parseUtils.substringStartsWith(PUBLIC) ||
      parseUtils.substringStartsWith(SYSTEM)
    ) {
      const match = EXTERNAL_ID_match.exec(parseUtils.substringFromIndex());
      if (match === null) {
        errorHandler.fatalError(
          `doctype external id is not well-formed at position ${parseUtils.index}`,
        );
        return;
      }
      if (match.groups?.SystemLiteralOnly !== undefined) {
        doctype.systemId = match.groups.SystemLiteralOnly;
      } else {
        doctype.systemId = match.groups?.SystemLiteral;
        doctype.publicId = match.groups?.PubidLiteral;
      }

      parseUtils.skip(match[0].length);
    } else if (isHTML && parseUtils.substringStartsWith(SYSTEM, false)) {
      parseUtils.skip(SYSTEM.length);
      if (parseUtils.skipBlanks() < 1) {
        errorHandler.fatalError(
          `Expected whitespace after ${SYSTEM} at position ${parseUtils.index}`,
        );
        return;
      }

      doctype.systemId = parseUtils.getMatch(ABOUT_LEGACY_COMPAT_SystemLiteral);

      if (doctype.systemId === null) {
        errorHandler.fatalError(
          `Expected ${ABOUT_LEGACY_COMPAT} in single or double quotes after ${SYSTEM} at position ${parseUtils.index}`,
        );
        return;
      }
    }

    if (
      isHTML && doctype.systemId !== null && doctype.systemId !== undefined &&
      !ABOUT_LEGACY_COMPAT_SystemLiteral.test(doctype.systemId)
    ) {
      errorHandler.warning(
        `Unexpected doctype.systemId in HTML document at position ${parseUtils.index}`,
      );
    }

    if (!isHTML) {
      parseUtils.skipBlanks();
      doctype.internalSubset = parseDoctypeInternalSubset(
        parseUtils,
        errorHandler,
      );
    }

    parseUtils.skipBlanks();

    if (parseUtils.char() !== ">") {
      errorHandler.fatalError(
        `doctype not terminated with > at position ${parseUtils.index}`,
      );
      return;
    }

    parseUtils.skip(1);

    builder.startDTD(
      doctype.name,
      doctype.publicId,
      doctype.systemId,
      doctype.internalSubset,
    );
    builder.endDTD();

    return parseUtils.index;
  } else {
    errorHandler.fatalError(
      `Not well-formed XML starting with "<!" at position ${start}`,
    );
    return;
  }
};
