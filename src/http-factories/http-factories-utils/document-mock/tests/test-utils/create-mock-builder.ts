import { Builder } from "../../src/builder.ts";
import { ElementAttributes } from "../../src/reader/reader-utils.ts";
import { fn } from "@std/expect/fn";

export class TestBuilder extends Builder {
  startDocumentMock = fn(() => {}) as () => void;

  endDocumentMock = fn(() => {}) as () => void;

  charactersMock = fn((_xt: string, _start: number, _end: number) => {});

  commentMock = fn(
    (_comment: string, _startLength: number, _contentLength: number) => {},
  ) as (_comment: string, _startLength: number, _contentLength: number) => void;

  startElementMock = fn((
    _ns: string,
    _localName: string,
    _tagName: string,
    _el: ElementAttributes,
  ) => {}) as (
    _ns: string,
    _localName: string,
    _tagName: string,
    _el: ElementAttributes,
  ) => void;

  endElementMock = fn(
    (_uri: string, _localName: string, _currentTagName: string) => {},
  ) as (_uri: string, _localName: string, _currentTagName: string) => void;

  startCDATAMock = fn(() => {}) as () => void;

  endCDATAMock = fn(() => {}) as () => void;

  startDTDMock = fn((
    _name: string,
    _publicId: string | null | undefined,
    _systemId: string | null | undefined,
    _internalSubset: string | null | undefined,
  ) => {}) as (
    _name: string,
    _publicId: string | null | undefined,
    _systemId: string | null | undefined,
    _internalSubset: string | null | undefined,
  ) => void;

  endDTDMock = fn(() => {}) as () => void;

  startPrefixMappingMock = fn((_prefix: string, _value: string) => {}) as (
    _prefix: string,
    _value: string,
  ) => void;

  endPrefixMappingMock = fn((_prefix: string) => {}) as (
    _prefix: string,
  ) => void;
  
  processingInstructionMock = fn((_target: string, _data: string) => {}) as (
    _target: string,
    _data: string,
  ) => void;

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

  getMocks() {
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
