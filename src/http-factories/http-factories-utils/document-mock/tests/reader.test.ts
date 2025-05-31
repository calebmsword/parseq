import { describe, it } from "@std/testing/bdd";
import {
  getParseUtils,
  parseDoctypeCommentOrCData,
} from "../src/reader/parse-doctype-comment-or-c-data.ts";
import { expect } from "@std/expect/expect";
import { eachTable } from "./test-utils/each.ts";
import { getMockErrorHandler } from "./test-utils/create-mock-error-handler.ts";
import { TestBuilder } from "./test-utils/create-mock-builder.ts";

describe("getParseUtils", () => {
  it("should provide access to the values passed as arguments", () => {
    // -- arrange
    const start = 2;
    const source = "source";

    // -- act
    const p = getParseUtils(source, start);

    // -- assert
    expect(p.index).toBe(start);
    expect(p.source).toBe(source);
  });

  describe("char", () => {
    it("should return char at current position when given no parameter", () => {
      // -- arrange
      const start = 2;
      const source = "source";

      // -- act
      const p = getParseUtils(source, start);

      // -- assert
      expect(p.char()).toBe(source[start]);
    });

    it("should return char relative to current position with first parameter", () => {
      // -- arrange
      const start = 2;
      const source = "source";

      // -- act
      const p = getParseUtils(source, start);

      // -- assert
      expect(p.char(-2)).toBe(source[start - 2]);
    });

    eachTable(
      [{
        index: -2,
        expected: "s",
      }, {
        index: -1,
        expected: "o",
      }, {
        index: 0,
        expected: "u",
      }, {
        index: 1,
        expected: "r",
      }, {
        index: 2,
        expected: "c",
      }, {
        index: 3,
        expected: "e",
      }],
      "with source of `source` and start of `2`, `char($index)` should be `$expected`",
      ({ index, expected }) => () => {
        // -- arrange
        const start = 2;
        const source = "source";

        // -- act
        const p = getParseUtils(source, start);

        // -- assert
        expect(p.char(index)).toBe(expected);
      },
    );

    it("should return empty strings for relative indexes outside of source", () => {
      // -- arrange
      const start = 2;
      const source = "source";

      // -- act
      const p = getParseUtils(source, start);

      // -- assert
      expect(p.char(-3)).toBe("");
      expect(p.char(4)).toBe("");
    });
  });

  describe("skip", () => {
    it("should move current by one position without any parameter", () => {
      // -- arrange
      const start = 2;
      const source = "source";

      // -- act
      const p = getParseUtils(source, start);
      p.skip();

      // -- assert
      expect(p.index).toBe(start + 1);
    });

    it("should move relative to current position with first paramter", () => {
      // -- arrange
      const start = 2;
      const source = "source";

      // -- act
      const p = getParseUtils(source, start);
      p.skip(2);

      // -- assert
      expect(p.index).toBe(start + 2);
    });
  });

  describe("skipBlanks", () => {
    it("should move current index nothing if no whitespace exists", () => {
      // -- arrange
      const start = 2;
      const source = "source";

      // -- act
      const p = getParseUtils(source, start);
      p.skipBlanks();

      // -- assert
      expect(p.index).toBe(start);
    });

    it("should skip all kind of whitespace relative to current position", () => {
      // -- arrange
      const start = 2;
      const whitespace = " \n\t\r ";
      const source = `so${whitespace}urce`;

      // -- act
      const p = getParseUtils(source, start);
      const positions = p.skipBlanks();

      // -- assert
      expect(positions).toBe(whitespace.length);
      expect(p.char()).toBe("u");
    });

    it("should skip all kind of whitespace until end of source", () => {
      // -- arrange
      const start = 0;
      const whitespace = " \n\t\r ";

      // -- act
      const p = getParseUtils(whitespace, start);
      const positions = p.skipBlanks();

      // -- assert
      expect(positions).toBe(-1);
      expect(p.index).toBe(whitespace.length);
    });
  });

  describe("substringStartsWith", () => {
    it("should return true if it matches", () => {
      // -- arrange
      const start = 2;
      const source = "source";

      // -- act
      const p = getParseUtils(source, start);
      const matches = p.substringStartsWith("urce");

      // -- assert
      expect(matches).toBe(true);
      expect(p.index).toBe(start);
    });

    it("should return false if it matches", () => {
      // -- arrange
      const start = 2;
      const source = "source";

      // -- act
      const p = getParseUtils(source, start);
      const matches = p.substringStartsWith("no");

      // -- assert
      expect(matches).toBe(false);
      expect(p.index).toBe(start);
    });

    eachTable(
      [{
        caseSensitive: false,
        expected: true,
      }, {
        caseSensitive: true,
        expected: false,
      }],
      'with source `source` and start `2`, `substringStartsWith("UrCe", $caseSensitive)` should be $expected',
      ({ expected, caseSensitive }) => () => {
        // -- arrange
        const start = 2;
        const source = "source";

        // -- act
        const p = getParseUtils(source, start);
        const matches = p.substringStartsWith("UrCe", caseSensitive);

        // -- assert
        expect(matches).toBe(expected);
      },
    );
  });

  describe("getMatch", () => {
    it("should return the match and move the current index", () => {
      // -- arrange
      const start = 2;
      const source = "source";

      // -- act
      const p = getParseUtils(source, start);
      const match = p.getMatch(/urc/);

      // -- assert
      expect(match).toBe("urc");
      expect(p.index).toBe(start + (match as string).length);
    });

    it("should not match things starting after current index, and instead return null", () => {
      // -- arrange
      const start = 2;
      const source = "source";

      // -- act
      const p = getParseUtils(source, start);
      const match = p.getMatch(/rce/);

      // -- assert
      expect(match).toBe(null);
      expect(p.index).toBe(start);
    });
  });
});

describe("parseDoctypeCommentOrCData", () => {
  it('should report fatal error and return when it ends after "<!"', () => {
    // -- arrange
    const start = 0;
    const source = "<!";
    const { errorHandler, fatalErrorSpy } = getMockErrorHandler();
    const builder = new TestBuilder();

    // -- act
    const returned = parseDoctypeCommentOrCData(
      source,
      start,
      builder,
      errorHandler,
      false,
    );

    // -- assert
    expect(returned).toBeUndefined();
    expect(fatalErrorSpy).toHaveBeenLastCalledWith(
      expect.stringContaining("Not well-formed"),
    );
  });
});
