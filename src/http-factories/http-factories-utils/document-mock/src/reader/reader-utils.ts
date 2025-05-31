import { NAMESPACE } from "../conventions.ts";
import { Builder, Locator } from "../builder.ts";
import { QNAME_EXACT, REFERENCE } from "../grammar.ts";

// -----------------------------------------------------------------------------
//  constants
// -----------------------------------------------------------------------------
const NEWLINE = /\r\n?|\n|$/g;

/**
 * Detects everything that might be a reference including those without ending
 * `;` since those are allowed in HTML. The entityReplacer takes care of
 * verifying and transforming each occurrence and reports to the errorHandler on
 * those that are not OK, depending on the context.
 */
export const ENTITY_REG = /&#?\w+;?/g;

// -----------------------------------------------------------------------------
//  types/classes
// -----------------------------------------------------------------------------
export type ErrorHandler = {
  warning: (...messages: string[]) => void;
  error: (...messages: string[]) => void;
  fatalError: (...messages: string[]) => void;
};

type Lookup<ArrayLike, n> = n extends keyof ArrayLike ? ArrayLike[n]
  : undefined;

type ElementOf<Array> = Lookup<Array, number>;

export class ElementAttributes {
  attributeNames?: Map<string, number> = new Map<string, number>();

  closed?: boolean = false;

  currentNSMap?: { [key: string]: string } | null;

  localName?: string;

  localNSMap?: { [key: string]: string } | null;

  locator?: Locator;

  prefix?: string;

  tagName?: string;

  uri?: string;

  #arr: {
    qName: string;
    value: string;
    offset: number;
    prefix?: string;
    localName?: string;
    locator?: Locator;
    uri?: string;
  }[] = [];

  get attrs() {
    return this.#arr;
  }

  setTagName(tagName: string) {
    if (!QNAME_EXACT.test(tagName)) {
      throw new Error(`invalid attribute: ${tagName}`);
    }
    this.tagName = tagName;
  }

  add(qName: string, value: string, offset: number) {
    this.attributeNames?.set(qName, this.#arr.length);
    this.#arr.push({ qName, value, offset });
  }
}

export type ElementAttributesLike = {
  attributeNames?: Map<string, number>;
  closed?: boolean;
  currentNSMap?: { [key: string]: string } | null;
  localName?: string;
  localNSMap?: { [key: string]: string } | null;
  locator?: Locator;
  prefix?: string;
  tagName?: string;
  uri?: string;
};

// -----------------------------------------------------------------------------
//  functions
// -----------------------------------------------------------------------------
/** Shallow copies enumerable string properties from source to target. */
export const copy = (
  source: { [key: string]: any },
  target: { [key: string]: any },
) => {
  Object.keys(source).forEach((key) => {
    if (Object.hasOwn(source, key)) {
      target[key] = source[key];
    }
  });

  return target;
};

/**
 * Converts the code into the corresponding unicode character.
 * If code is larger than 16 bits, it will be automatically converted into its
 * surrogate pair representation.
 */
export const fixedFromCharCode = (code: number) => {
  // String.prototype.fromCharCode only supports 16-bit encodings.
  // But there are more than 16^2 unicode characters so there is a "surrogate
  // pair" representation for additional code points which encodes these extra
  // code points as pairs of 16-bit numbers.
  // see https://en.wikipedia.org/wiki/UTF-16#Code_points_from_U+010000_to_U+10FFFF
  // see https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String/fromCharCode
  if (code > 0xffff) {
    code -= 0x10000;
    const surrogateHigh = 0xd800 + (code >> 10);
    const surrogateLow = 0xdc00 + (code & 0x3ff);

    return String.fromCharCode(surrogateHigh, surrogateLow);
  }

  return String.fromCharCode(code);
};

/**
 * Increment lineStart and lineEnd so they surround the first text block
 * containing the target character and make sure the locator stores the
 * lineNumber and columnNumber associated with the target character.
 * I am using the term "text block" to refer to characters surrounded by
 * newline(s) or the beginning/end of the document.
 * @param targetIndex -
 * An index representing the target character (the nth character in the source
 * string)
 * @param source -
 * The XML source to parse.
 * @param lineStart -
 * The pointer representing the start of a text block. A new lineStart value
 * will be returned by this function.
 * @param lineEnd -
 * The pointer representing the end of a text block. A new lineEnd value will be
 * returned by this function.
 * @param locator -
 * The Locator object used by the Builder to keep track of line and column
 * numbers.
 * @returns {[number, number]}
 * the new lineStart, lineEnd as a tuple
 */
export const position = (
  targetIndex: number,
  source: string,
  lineStart: number,
  lineEnd: number,
  locator: Locator,
): [number, number] => {
  for (
    // exec is stateful when the regex has the 'g' flag
    let textBlock = NEWLINE.exec(source);
    textBlock !== null && lineEnd < targetIndex;
    textBlock = NEWLINE.exec(source)
  ) {
    lineStart = lineEnd;
    lineEnd = textBlock.index + textBlock[0].length;
    locator.lineNumber += 1;
  }
  locator.columnNumber = targetIndex - lineStart + 1;

  return [lineStart, lineEnd];
};

/**
 * Only run {@link position} if the locator is not falsy.
 * @returns
 * lineStart, lineEnd
 */
export const tryPosition = (
  start: number,
  source: string,
  lineStart: number,
  lineEnd: number,
  locator: Locator,
) => {
  if (locator) {
    return position(start, source, lineStart, lineEnd, locator);
  }

  return [lineStart, lineEnd];
};

/**
 * Returns a function using that can be used use as a replacer callback for
 * String.prototype.replace.
 */
export const getEntityReplacer = (
  isHtml: boolean,
  errorHandler: ErrorHandler,
  entityMap: { [key: string]: string },
) => {
  return (reference: string) => {
    const completeReference = reference.at(-1) === ";"
      ? reference
      : reference + ";";

    if (!isHtml && completeReference !== reference) {
      errorHandler?.error("EntityRef: expecting ;");
      return reference;
    }

    const match = REFERENCE.exec(completeReference);

    if (match === null || match[0].length !== completeReference.length) {
      errorHandler?.error(
        "entity not matching Reference production: ",
        reference,
      );
      return reference;
    }

    // strip the leading `&` and trailing `;`
    const key = completeReference.slice(1, -1);

    if (Object.hasOwn(entityMap, key)) {
      return entityMap[key];
    } else if (key.charAt(0) === "#") {
      return fixedFromCharCode(
        parseInt(key.substring(1).replace("x", "0x")),
      );
    } else {
      errorHandler?.error("entity not found:", reference);
      return reference;
    }
  };
};

/**
 * @returns {[number, number, number]}
 * lineStart, lineEnd, end
 */
export const appendText = (
  end: number,
  start: number,
  source: string,
  entityReplacer: (substring: string, ...args: any[]) => string,
  locator: Locator,
  lineStart: number,
  lineEnd: number,
  builder: Builder,
): [number, number, number] => {
  if (end > start) {
    const chars = source.substring(start, end).replace(
      ENTITY_REG,
      entityReplacer,
    );

    [lineStart, lineEnd] = tryPosition(
      start,
      source,
      lineStart,
      lineEnd,
      locator,
    );

    builder.characters(chars, 0, end - start);
    return [lineStart, lineEnd, start];
  }

  return [lineStart, lineEnd, start];
};

/** Copies source Locator to target and returns the target Locator. */
export const copyLocator = (source: Locator, target: Locator) => {
  target.lineNumber = source.lineNumber;
  target.columnNumber = source.columnNumber;
  return target;
};

/** Run the callback on each array element starting from the last element. */
export const forEachReverse = <T extends any[]>(
  arr: T,
  callback: (
    value: ElementOf<T>,
    index: number,
    arr: T,
  ) => void,
) => {
  for (let i = arr.length; i > 0; --i) {
    callback(arr[i - 1], i - 1, arr);
  }
};

/**
 * @returns
 * `true` if a new namespace has been defined.
 */
export const appendElement = (
  el: ElementAttributes,
  builder: Builder,
  currentNSMap: { [key: string]: string },
) => {
  const tagName = el.tagName || "";
  let localNSMap: { [key: string]: string } | null = null;

  let prefix: string | null;
  let localName: string;
  let nsPrefix: string | false;

  forEachReverse(el.attrs, (attr) => {
    const { qName, value } = attr;
    const colonIndex = qName.indexOf(":");

    if (colonIndex > 0) {
      prefix = attr.prefix = qName.slice(0, colonIndex);
      localName = qName.slice(colonIndex + 1);
      nsPrefix = prefix === "xmlns" && localName;
    } else {
      localName = qName;
      prefix = null;
      nsPrefix = qName === "xmlns" && "";
    }
    // can not set prefix because prefix !== ''
    attr.localName = localName;
    // prefix == null for no ns prefix attribute
    if (nsPrefix !== false) {
      // hack!!
      if (localNSMap === null) {
        localNSMap = Object.create(null) as { [key: string]: string };
        currentNSMap = copy(currentNSMap, Object.create(null));
      }
      currentNSMap[nsPrefix] = localNSMap[nsPrefix] = value;
      attr.uri = NAMESPACE.XMLNS;
      builder.startPrefixMapping(nsPrefix, value);
    }
  });

  forEachReverse(el.attrs, (attr) => {
    if (attr.prefix) {
      //no prefix attribute has no namespace
      if (attr.prefix === "xml") {
        attr.uri = NAMESPACE.XML;
      }
      if (attr.prefix !== "xmlns") {
        attr.uri = currentNSMap[attr.prefix];
      }
    }
  });
  const nsp = tagName.indexOf(":");
  if (nsp > 0) {
    prefix = el.prefix = tagName.slice(0, nsp);
    localName = el.localName = tagName.slice(nsp + 1);
  } else {
    prefix = null; //important!!
    localName = el.localName = tagName;
  }
  //no prefix element has default namespace
  const ns = (el.uri = currentNSMap[prefix || ""]);
  builder.startElement(ns, localName, tagName, el);
  //endPrefixMapping and startPrefixMapping have not any help for dom builder
  //localNSMap = null
  if (el.closed) {
    builder.endElement(ns, localName, tagName);
    if (localNSMap) {
      Object.keys(localNSMap).forEach((prefix) => {
        if (Object.hasOwn(localNSMap as { [key: string]: string }, prefix)) {
          builder.endPrefixMapping(prefix);
        }
      });
    }
  } else {
    el.currentNSMap = currentNSMap;
    el.localNSMap = localNSMap;
    return true;
  }
};
