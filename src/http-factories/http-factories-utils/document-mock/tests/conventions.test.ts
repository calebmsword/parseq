import { describe, it } from "@std/testing/bdd";
import { expect } from "jsr:@std/expect";
import {
  assign,
  hasDefaultHTMLNamespace,
  HTML_BOOLEAN_ATTRIBUTES,
  HTML_RAW_TEXT_ELEMENTS,
  HTML_VOID_ELEMENTS,
  isHTMLBooleanAttribute,
  isHTMLEscapableRawTextElement,
  isHTMLMimeType,
  isHTMLRawTextElement,
  isHTMLVoidElement,
  isValidMimeType,
  MIME_TYPE,
  NAMESPACE,
} from "../src/conventions.ts";
import { each, eachTable } from "./test-utils/each.ts";
import {
  runReadOnlyObjectCheckerTests,
  runReadOnlyObjectTests,
} from "./test-utils/read-only-tests.ts";
import { assertSnapshot } from "@std/testing/snapshot";

describe("assign", () => {
  each(
    [null, undefined, true, false, 0, NaN],
    "should throw when `target` is `%{}`",
    (target) => () => {
      expect(() => assign(target as any, {})).toThrow(TypeError);
    },
  );

  it("should return target", () => {
    const target = {};
    expect(assign(target, undefined)).toBe(target);
  });

  it("should copy all enumerable fields from source to target", () => {
    // -- arrange
    const target = {};
    const source = { a: "A", 0: 0 };

    // -- act
    assign(target, source);

    // -- assert
    expect(target).toEqual(source);
  });

  it("should not copy prototype properties to its source", () => {
    // -- arrange
    const target = {};

    const sourcePrototype = { dont: 5, hasOwnProperty: () => true };
    const source = Object.create(sourcePrototype);

    // -- act
    assign(target, source);

    // -- assert
    expect(target).toEqual({});
  });

  each(
    [null, undefined],
    "should have no issue with `%{}` source",
    (source) => () => {
      // -- arrange
      const target = {};

      // -- act/assert
      assign(target, source);
    },
  );

  it("should override existing keys", () => {
    // -- arrange
    const target = { key: 4, same: "same" };
    const source = { key: undefined };

    // -- act
    assign(target, source);

    // -- assert
    expect(target).toEqual({ key: undefined, same: "same" });
  });
});

runReadOnlyObjectTests(HTML_BOOLEAN_ATTRIBUTES, "HTML_BOOLEAN_ATTRIBUTES");

runReadOnlyObjectCheckerTests(
  HTML_BOOLEAN_ATTRIBUTES,
  isHTMLBooleanAttribute,
  "isHTMLBooleanAttribute",
);

runReadOnlyObjectTests(HTML_VOID_ELEMENTS, "HTML_VOID_ELEMENTS");

runReadOnlyObjectCheckerTests(
  HTML_VOID_ELEMENTS,
  isHTMLVoidElement,
  "isHTMLVoidElement",
);

runReadOnlyObjectTests(HTML_RAW_TEXT_ELEMENTS, "HTML_RAW_TEXT_ELEMENTS");

describe("isHTMLRawTextElement", () => {
  const HTML_RAW_TEXT_ELEMENT_ARRAY = Object.keys(HTML_RAW_TEXT_ELEMENTS).map(
    (_key) => {
      const key = _key as keyof typeof HTML_RAW_TEXT_ELEMENTS;

      return {
        key: key,
        upperKey: key.toUpperCase(),
        mixedKey: key[0].toUpperCase() + key.substring(1),
        expected: HTML_RAW_TEXT_ELEMENTS[key] === false,
      };
    },
  );

  eachTable(
    HTML_RAW_TEXT_ELEMENT_ARRAY,
    'should detect attribute "$key" as $expected',
    ({ key, expected }) => () => {
      expect(isHTMLRawTextElement(key)).toBe(expected);
    },
  );

  eachTable(
    HTML_RAW_TEXT_ELEMENT_ARRAY,
    'should detect attribute "$upperKey" as $expected',
    ({ upperKey, expected }) => () => {
      expect(isHTMLRawTextElement(upperKey)).toBe(expected);
    },
  );

  eachTable(
    HTML_RAW_TEXT_ELEMENT_ARRAY,
    'should detect attribute "$mixedKey" as $expected',
    ({ mixedKey, expected }) => () => {
      expect(isHTMLRawTextElement(mixedKey)).toBe(expected);
    },
  );
});

describe("isHTMLEscapableRawTextElement", () => {
  const HTML_ESCAPABLE_RAW_TEXT_ELEMENT_ARRAY = Object.keys(
    HTML_RAW_TEXT_ELEMENTS,
  ).map(
    (_key) => {
      const key = _key as keyof typeof HTML_RAW_TEXT_ELEMENTS;

      return {
        key: key,
        upperKey: key.toUpperCase(),
        mixedKey: key[0].toUpperCase() + key.substring(1),
        expected: HTML_RAW_TEXT_ELEMENTS[key],
      };
    },
  );

  eachTable(
    HTML_ESCAPABLE_RAW_TEXT_ELEMENT_ARRAY,
    'should detect attribute "$key" as $expected',
    ({ key, expected }) => () => {
      expect(isHTMLEscapableRawTextElement(key)).toBe(expected);
    },
  );

  eachTable(
    HTML_ESCAPABLE_RAW_TEXT_ELEMENT_ARRAY,
    'should detect attribute "$upperKey" as $expected',
    ({ upperKey, expected }) => () => {
      expect(isHTMLEscapableRawTextElement(upperKey)).toBe(expected);
    },
  );

  eachTable(
    HTML_ESCAPABLE_RAW_TEXT_ELEMENT_ARRAY,
    'should detect attribute "$mixedKey" as $expected',
    ({ mixedKey, expected }) => () => {
      expect(isHTMLEscapableRawTextElement(mixedKey)).toBe(expected);
    },
  );
});

describe("isHTMLMimeType", () => {
  it('should return true for "text/html"', () => {
    expect(isHTMLMimeType("text/html")).toBe(true);
  });

  it("should return true for MIME_TYPE.HTML", () => {
    expect(isHTMLMimeType(MIME_TYPE.HTML)).toBe(true);
  });

  each(
    [
      undefined,
      null,
      0,
      1,
      false,
      true,
      "",
      MIME_TYPE.XML_XHTML_APPLICATION,
      "prototype",
      "__proto__",
    ],
    'should return false for "%{}"',
    (value) => () => {
      expect(isHTMLMimeType(value as any)).toBe(false);
    },
  );
});

describe("hasDefaultHTMLNamespace", () => {
  it('should return true for "text/html"', () => {
    expect(hasDefaultHTMLNamespace("text/html")).toBe(true);
  });

  it("should return true for MIME_TYPE.HTML", () => {
    expect(hasDefaultHTMLNamespace(MIME_TYPE.HTML)).toBe(true);
  });

  it('should return true for "application/xhtml+xml"', () => {
    expect(hasDefaultHTMLNamespace("application/xhtml+xml")).toBe(true);
  });

  it("should return ture for MIME_TYPE.XML_XHTML_APPLICATION", () => {
    expect(hasDefaultHTMLNamespace(MIME_TYPE.XML_XHTML_APPLICATION)).toBe(true);
  });

  each(
    [
      undefined,
      null,
      0,
      1,
      false,
      true,
      "",
      "prototype",
      "__proto__",
    ],
    'should return false for "%{}"',
    (value) => () => {
      expect(hasDefaultHTMLNamespace(value as any)).toBe(false);
    },
  );
});

runReadOnlyObjectTests(MIME_TYPE, "MIME_TYPE");

describe("isValidMimeType", () => {
  each(
    [
      "text/html",
      "application/xml",
      "text/xml",
      "application/xhtml+xml",
      "image/svg+xml",
    ],
    '"%{}" should be a valid mimeType',
    (mimeType) => () => {
      expect(isValidMimeType(mimeType)).toBe(true);
    },
  );

  each(
    [
      undefined,
      null,
      0,
      1,
      false,
      true,
      "",
      "prototype",
      "__proto__",
    ],
    '"%{}" should be an invalid mimeType',
    (mimeType) => () => {
      expect(isValidMimeType(mimeType as any)).toBe(false);
    },
  );
});

describe("NAMESPACE", () => {
  each(
    Object.keys(NAMESPACE),
    'should contain "%{}" with correct value',
    (_key) => async (t) => {
      const key = _key as keyof typeof NAMESPACE;
      const value = NAMESPACE[key];

      await assertSnapshot(t, [key, value]);
    },
  );

  each(
    Object.keys(NAMESPACE),
    'value associated with key "%{}" should be immutable',
    (_key) => () => {
      const key = _key as keyof typeof NAMESPACE;
      const value = NAMESPACE[key];

      try {
        (NAMESPACE as any)[key] = "new value";
      } catch {/* swallow exceptions */}

      expect(NAMESPACE[key]).toBe(value);
    },
  );
});
