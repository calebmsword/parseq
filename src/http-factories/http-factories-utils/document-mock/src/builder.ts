import { MIME_TYPE } from "./conventions.ts";
import { ElementAttributes } from "./reader/reader-utils.ts";

export class Element {}

export class Node {}

export class Document {
  documentElement: any;
}

export type Locator = {
  columnNumber: number;
  lineNumber: number;
};

export class ErrorLevel {}

/** Converts XML elements into some sort of storage. */
export class Builder {
  readonly mimeType: typeof MIME_TYPE[keyof typeof MIME_TYPE] =
    MIME_TYPE.XML_APPLICATION;

  private readonly defaultNamespace: string | null = null;

  private cdata = false;

  currentElement: Element | Node | undefined | any;

  readonly doc: Document | undefined;

  locator: Locator | undefined;

  readonly onError:
    | ((
      level: ErrorLevel,
      message: string,
      context: Builder,
    ) => void)
    | undefined;

  constructor() {
    if (this.constructor === Builder) {
      throw new Error(
        "Handler is an abstract class. It must be subclassed to be instantiated.",
      );
    }
  }

  startDocument() {}

  endDocument() {}

  characters(xt: string, start: number, end: number) {}

  comment(
    comment: string,
    commentStartLength: number,
    commentContentLength: number,
  ) {}

  startElement(
    ns: string,
    localName: string,
    tagName: string,
    el: ElementAttributes,
  ) {}

  endElement(uri: string, localName: string, currentTagName: string) {}

  startCDATA() {}

  endCDATA() {}

  startDTD(
    name: string,
    publicId: string | null | undefined,
    systemId: string | null | undefined,
    internalSubset: string | null | undefined,
  ) {}

  endDTD() {}

  startPrefixMapping(prefix: string, value: string) {}

  endPrefixMapping(prefix: string) {}

  processingInstruction(target: string, data: string) {}
}

/** A Builder which stores XML in a DOM representation. */
export class DOMBuilder extends Builder {}
