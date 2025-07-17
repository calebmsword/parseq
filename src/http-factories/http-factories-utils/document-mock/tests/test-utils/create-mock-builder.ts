import { Builder, Document } from "../../src/builder.ts";
import { ElementAttributes } from "../../src/reader/reader-utils.ts";
import { fn } from "@std/expect/fn";

const GET_MOCKS = Symbol("TestBuilder[GET_MOCKS]");

class TestBuilder extends Builder {
  private startDocumentMock = fn(() => {}) as () => void;

  private endDocumentMock = fn(() => {}) as () => void;

  private charactersMock = fn(
    (_xt: string, _start: number, _end: number) => {},
  ) as (
    xt: string,
    start: number,
    end: number,
  ) => void;

  private commentMock = fn(
    (_comment: string, _startLength: number, _contentLength: number) => {},
  ) as (comment: string, startLength: number, contentLength: number) => void;

  private startElementMock = fn((
    _ns: string,
    _localName: string,
    _tagName: string,
    _el: ElementAttributes,
  ) => {}) as (
    ns: string,
    localName: string,
    tagName: string,
    el: ElementAttributes,
  ) => void;

  private endElementMock = fn(
    (_uri: string, _localName: string, _currentTagName: string) => {},
  ) as (uri: string, localName: string, currentTagName: string) => void;

  private startCDATAMock = fn(() => {}) as () => void;

  private endCDATAMock = fn(() => {}) as () => void;

  private startDTDMock = fn((
    _name: string,
    _publicId: string | null | undefined,
    _systemId: string | null | undefined,
    _internalSubset: string | null | undefined,
  ) => {}) as (
    name: string,
    publicId: string | null | undefined,
    systemId: string | null | undefined,
    internalSubset: string | null | undefined,
  ) => void;

  private endDTDMock = fn(() => {}) as () => void;

  private startPrefixMappingMock = fn(
    (_prefix: string, _value: string) => {},
  ) as (
    prefix: string,
    value: string,
  ) => void;

  private endPrefixMappingMock = fn((_prefix: string) => {}) as (
    prefix: string,
  ) => void;

  private processingInstructionMock = fn(
    (_target: string, _data: string) => {},
  ) as (
    target: string,
    data: string,
  ) => void;

  constructor(haveDoc?: boolean) {
    super();

    if (haveDoc) {
      const doc = new Document();
      doc.documentElement = true;
      this.doc = doc;
    }
  }

  override startDocument() {
    this.startDocumentMock();
  }

  override endDocument() {
    this.endDocumentMock();
  }

  override characters(xt: string, start: number, end: number) {
    this.charactersMock(xt, start, end);
  }

  override comment(
    comment: string,
    commentStartLength: number,
    commentContentLength: number,
  ) {
    this.commentMock(comment, commentStartLength, commentContentLength);
  }

  override startElement(
    ns: string,
    localName: string,
    tagName: string,
    el: ElementAttributes,
  ) {
    this.startElementMock(ns, localName, tagName, el);
  }

  override endElement(uri: string, localName: string, currentTagName: string) {
    this.endElementMock(uri, localName, currentTagName);
  }

  override startCDATA() {
    this.startCDATAMock();
  }

  override endCDATA() {
    this.endCDATAMock();
  }

  override startDTD(
    name: string,
    publicId: string | null | undefined,
    systemId: string | null | undefined,
    internalSubset: string | null | undefined,
  ) {
    this.startDTDMock(name, publicId, systemId, internalSubset);
  }

  override endDTD() {
    this.endDTDMock();
  }

  override startPrefixMapping(prefix: string, value: string) {
    this.startPrefixMappingMock(prefix, value);
  }

  override endPrefixMapping(prefix: string) {
    this.endPrefixMappingMock(prefix);
  }

  override processingInstruction(target: string, data: string) {
    this.processingInstructionMock(target, data);
  }

  [GET_MOCKS]() {
    return {
      startDocumentMock: this.startDocumentMock,
      endDocumentMock: this.endDocumentMock,
      charactersMock: this.charactersMock,
      commentMock: this.commentMock,
      startElementMock: this.startElementMock,
      endElementMock: this.endElementMock,
      startCDATAMock: this.startCDATAMock,
      endCDATAMock: this.endCDATAMock,
      startDTDMock: this.startDTDMock,
      endDTDMock: this.endDTDMock,
      startPrefixMappingMock: this.startPrefixMappingMock,
      endPrefixMappingMock: this.endPrefixMappingMock,
      processingInstructionMock: this.processingInstructionMock,
    };
  }
}

/**
 * @example
 * ```
 * // just get the builder
 * const { builder } = getMockBuilder();
 * ```
 *
 * @example
 * ```
 * // get mock for any builder method by destructuring with `${methodName}Mock`
 * const { builder, startDocumentMock } = getMockBuilder();
 */
export const getMockBuilder = (haveDoc?: boolean) => {
  const builder = new TestBuilder(haveDoc);

  return {
    builder,
    ...builder[GET_MOCKS](),
  };
};
