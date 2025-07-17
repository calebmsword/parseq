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
  abstractClassName: string,
  methodName: string,
) => {
  throw new Error(
    `${abstractClassName}.${methodName} is an abstract method. It must overridden to be called.`,
  );
};

/**
 * Converts XML elements into some sort of storage.
 * Even though this project only uses the {@link DOMBuilder} subclass, we still
 * create the abstract class so we can use a special `Builder` subclass for
 * testing.
 */
export class Builder {
  readonly mimeType: typeof MIME_TYPE[keyof typeof MIME_TYPE] =
    MIME_TYPE.XML_APPLICATION;

  private readonly defaultNamespace: string | null = null;

  private cdata = false;

  currentElement: Element | Node | undefined | any;

  doc: Document | undefined;

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
    abstractMethod(Builder.name, this.startDocument.name);
  }

  endDocument() {
    abstractMethod(Builder.name, this.endDocument.name);
  }

  // deno-lint-ignore no-unused-vars
  characters(xt: string, start: number, end: number) {
    abstractMethod(Builder.name, this.characters.name);
  }

  comment(
    // deno-lint-ignore no-unused-vars
    comment: string,
    // deno-lint-ignore no-unused-vars
    commentStartLength: number,
    // deno-lint-ignore no-unused-vars
    commentContentLength: number,
  ) {
    abstractMethod(Builder.name, this.comment.name);
  }

  startElement(
    // deno-lint-ignore no-unused-vars
    ns: string,
    // deno-lint-ignore no-unused-vars
    localName: string,
    // deno-lint-ignore no-unused-vars
    tagName: string,
    // deno-lint-ignore no-unused-vars
    el: ElementAttributes,
  ) {
    abstractMethod(Builder.name, this.startElement.name);
  }

  // deno-lint-ignore no-unused-vars
  endElement(uri: string, localName: string, currentTagName: string) {
    abstractMethod(Builder.name, this.endElement.name);
  }

  startCDATA() {
    abstractMethod(Builder.name, this.startCDATA.name);
  }

  endCDATA() {
    abstractMethod(Builder.name, this.endCDATA.name);
  }

  startDTD(
    // deno-lint-ignore no-unused-vars
    name: string,
    // deno-lint-ignore no-unused-vars
    publicId: string | null | undefined,
    // deno-lint-ignore no-unused-vars
    systemId: string | null | undefined,
    // deno-lint-ignore no-unused-vars
    internalSubset: string | null | undefined,
  ) {
    abstractMethod(Builder.name, this.startDTD.name);
  }

  endDTD() {
    abstractMethod(Builder.name, this.endDTD.name);
  }

  // deno-lint-ignore no-unused-vars
  startPrefixMapping(prefix: string, value: string) {
    abstractMethod(Builder.name, this.startPrefixMapping.name);
  }

  // deno-lint-ignore no-unused-vars
  endPrefixMapping(prefix: string) {
    abstractMethod(Builder.name, this.endPrefixMapping.name);
  }

  // deno-lint-ignore no-unused-vars
  processingInstruction(target: string, data: string) {
    abstractMethod(Builder.name, this.processingInstruction.name);
  }
}

/** A Builder which stores XML in a DOM representation. */
export class DOMBuilder extends Builder {}
