// deno-lint-ignore-file
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

const abstractMethod = (
  abstractClass: new (...args: any[]) => any,
  methodName: string,
) => {
  throw new Error(
    `${abstractClass.name}.${methodName} is an abstract method. It must overridden to be called.`,
  );
};

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

  startDocument() {
    abstractMethod(Builder, this.startDocument.name);
  }

  endDocument() {
    abstractMethod(Builder, this.endDocument.name);
  }

  characters(xt: string, start: number, end: number) {
    abstractMethod(Builder, this.characters.name);
  }

  comment(
    comment: string,
    commentStartLength: number,
    commentContentLength: number,
  ) {
    abstractMethod(Builder, this.comment.name);
  }

  startElement(
    ns: string,
    localName: string,
    tagName: string,
    el: ElementAttributes,
  ) {
    abstractMethod(Builder, this.startElement.name);
  }

  endElement(uri: string, localName: string, currentTagName: string) {
    abstractMethod(Builder, this.endElement.name);
  }

  startCDATA() {
    abstractMethod(Builder, this.startCDATA.name);
  }

  endCDATA() {
    abstractMethod(Builder, this.endCDATA.name);
  }

  startDTD(
    name: string,
    publicId: string | null | undefined,
    systemId: string | null | undefined,
    internalSubset: string | null | undefined,
  ) {
    abstractMethod(Builder, this.startDTD.name);
  }

  endDTD() {
    abstractMethod(Builder, this.endDTD.name);
  }

  startPrefixMapping(prefix: string, value: string) {
    abstractMethod(Builder, this.startPrefixMapping.name);
  }

  endPrefixMapping(prefix: string) {
    abstractMethod(Builder, this.endPrefixMapping.name);
  }

  processingInstruction(target: string, data: string) {
    abstractMethod(Builder, this.processingInstruction.name);
  }
}

/** A Builder which stores XML in a DOM representation. */
export class DOMBuilder extends Builder {}
