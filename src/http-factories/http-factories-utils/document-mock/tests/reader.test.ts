import { describe, it } from "@std/testing/bdd";
import {
  getParseUtils,
  parseDoctypeCommentOrCData,
} from "../src/reader/parse-doctype-comment-or-c-data.ts";
import { expect } from "@std/expect/expect";
import { eachTable } from "./test-utils/each.ts";
import { getMockErrorHandler } from "./test-utils/create-mock-error-handler.ts";
import { getMockBuilder } from "./test-utils/create-mock-builder.ts";
import {
  ABOUT_LEGACY_COMPAT,
  DOCTYPE_DECL_START,
  SYSTEM,
} from "../src/grammar.ts";

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
    const { errorHandler, fatalErrorMock } = getMockErrorHandler();
    const { builder } = getMockBuilder();

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
    expect(fatalErrorMock).toHaveBeenLastCalledWith(
      expect.stringContaining("Not well-formed"),
    );
  });

  it("should report fatal error and return with incomplete DOCTYPE decl", () => {
    // -- arrange
    const start = 0;
    const source = "<!D";
    const { errorHandler, fatalErrorMock } = getMockErrorHandler();
    const { builder } = getMockBuilder();

    // -- act
    const returned = parseDoctypeCommentOrCData(
      source,
      start,
      builder,
      errorHandler,
      false,
    );

    // -- assert
    expect(returned).toBe(undefined);
    expect(fatalErrorMock).toHaveBeenCalledWith(
      expect.stringContaining(DOCTYPE_DECL_START),
    );
  });

  it("should report fatal error and return with missing whitespace after DOCTYPE decl", () => {
    // -- arrange
    const start = 0;
    const source = `${DOCTYPE_DECL_START}Name`;
    const { errorHandler, fatalErrorMock } = getMockErrorHandler();
    const { builder } = getMockBuilder();

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
    expect(fatalErrorMock).toHaveBeenCalledWith(
      expect.stringContaining("whitespace after " + DOCTYPE_DECL_START),
    );
  });

  it("should report fatal error and return with document ending after DOCTYPE decl", () => {
    // -- arrange
    const start = 0;
    const source = DOCTYPE_DECL_START;
    const { errorHandler, fatalErrorMock } = getMockErrorHandler();
    const { builder } = getMockBuilder();

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
    expect(fatalErrorMock).toHaveBeenCalledWith(
      expect.stringContaining("whitespace after " + DOCTYPE_DECL_START),
    );
  });

  it("should report fatal error and return with invalid Name after DOCTYPE decl", () => {
    // -- arrange
    const start = 0;
    const source = `${DOCTYPE_DECL_START} .`;
    const { errorHandler, fatalErrorMock } = getMockErrorHandler();
    const { builder } = getMockBuilder();

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
    expect(fatalErrorMock).toHaveBeenCalledWith(
      expect.stringContaining("doctype name missing"),
    );
  });

  it("should report fatal error and return with document ending after DOCTYPE decl and whitespace", () => {
    // -- arrange
    const start = 0;
    const source = `${DOCTYPE_DECL_START} `;
    const { errorHandler, fatalErrorMock } = getMockErrorHandler();
    const { builder } = getMockBuilder();

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
    expect(fatalErrorMock).toHaveBeenCalledWith(
      expect.stringContaining("whitespace after " + DOCTYPE_DECL_START),
    );
  });

  it("should report fatal error and return with document ending after DOCTYPE internal subset starts", () => {
    // -- arrange
    const start = 0;
    const source = `${DOCTYPE_DECL_START} Name [`;
    const { errorHandler, fatalErrorMock } = getMockErrorHandler();
    const { builder } = getMockBuilder();

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
    expect(fatalErrorMock).toHaveBeenCalledWith(
      expect.stringContaining("doctype internal subset is not well-formed"),
    );
  });

  it("should report fatal error and return with DOCTYPE internal subset PI not well formed", () => {
    // -- arrange
    const start = 0;
    const source = `${DOCTYPE_DECL_START} Name [ <?Name`;
    const { errorHandler, fatalErrorMock } = getMockErrorHandler();
    const { builder } = getMockBuilder();

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
    expect(fatalErrorMock).toHaveBeenCalledWith(
      expect.stringContaining("processing instruction is not well-formed"),
    );
  });

  it("should report fatal error and return with DOCTYPE internal subset PI being an xml decl", () => {
    // -- arrange
    const start = 0;
    const source = `${DOCTYPE_DECL_START} Name [ <?Xml version="1.0"?>`;
    const { errorHandler, fatalErrorMock } = getMockErrorHandler();
    const { builder } = getMockBuilder();

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
    expect(fatalErrorMock).toHaveBeenCalledWith(
      expect.stringContaining("xml declaration is only allowed"),
    );
  });

  it("should report fatal error and return with DOCTYPE inside documentElement", () => {
    // -- arrange
    const start = 0;
    const source = DOCTYPE_DECL_START + "";
    const { errorHandler, fatalErrorMock } = getMockErrorHandler();
    const { builder } = getMockBuilder(true);

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
    expect(fatalErrorMock).toHaveBeenCalledWith(
      expect.stringContaining("Doctype not allowed"),
    );
  });

  it("should report fatal error and return with DOCTYPE inside documentElement", () => {
    // -- arrange
    const start = 0;
    const source = DOCTYPE_DECL_START + "";
    const { errorHandler, fatalErrorMock } = getMockErrorHandler();
    const { builder } = getMockBuilder(true);

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
    expect(fatalErrorMock).toHaveBeenCalledWith(
      expect.stringContaining("Doctype not allowed"),
    );
  });

  it("should call expected builder methods with correct values when source is well-formed", () => {
    // -- arrange
    const start = 0;
    const pi = "<?pi simple ?> ";
    const name = "Name";
    const source =
      `${DOCTYPE_DECL_START} ${name} PUBLIC "pubId" "sysId" [${pi}]>`;
    const { errorHandler, fatalErrorMock } = getMockErrorHandler();
    const { builder, startDTDMock, endDTDMock } = getMockBuilder();

    // -- act
    const returned = parseDoctypeCommentOrCData(
      source,
      start,
      builder,
      errorHandler,
      false,
    );

    // -- assert
    expect(fatalErrorMock).not.toHaveBeenCalled();
    expect(returned).toBe(source.length);
    expect(startDTDMock).toHaveBeenCalledWith(name, '"pubId"', '"sysId"', pi);
    expect(endDTDMock).toHaveBeenCalled();
  });

  it("should call expected builder methods with correct values when source is well-formed and PI is empty", () => {
    // -- arrange
    const start = 0;
    const name = "Name";
    const source = `${DOCTYPE_DECL_START} ${name} PUBLIC "pubId" "sysId" [ ]>`;
    const { errorHandler, fatalErrorMock } = getMockErrorHandler();
    const { builder, startDTDMock, endDTDMock } = getMockBuilder();

    // -- act
    const returned = parseDoctypeCommentOrCData(
      source,
      start,
      builder,
      errorHandler,
      false,
    );

    // -- assert
    expect(fatalErrorMock).not.toHaveBeenCalled();
    expect(returned).toBe(source.length);
    expect(startDTDMock).toHaveBeenCalledWith(name, '"pubId"', '"sysId"', " ");
    expect(endDTDMock).toHaveBeenCalled();
  });

  describe("when isHtml is true", () => {
    const html = "html";
    const HTML = "HTML";
    const isHtml = true;

    it("should report fatal error and return with incomplete DOCTYPE decl", () => {
      // -- arrange
      const start = 0;
      const source = "<!d";
      const { errorHandler, fatalErrorMock } = getMockErrorHandler();
      const { builder } = getMockBuilder();

      // -- act
      const returned = parseDoctypeCommentOrCData(
        source,
        start,
        builder,
        errorHandler,
        isHtml,
      );

      // -- assert
      expect(returned).toBeUndefined();
      expect(fatalErrorMock).toHaveBeenCalledWith(
        expect.stringContaining(DOCTYPE_DECL_START),
      );
    });

    it("should report warning when doctype name is not html", () => {
      // -- arrange
      const start = 0;
      const source = `<!doctype fantasy>`;
      const { errorHandler, warningMock } = getMockErrorHandler();
      const { builder } = getMockBuilder();

      // -- act
      const returned = parseDoctypeCommentOrCData(
        source,
        start,
        builder,
        errorHandler,
        isHtml,
      );

      // -- assert
      expect(returned).toBe(source.length);
      expect(warningMock).toHaveBeenCalledWith(
        expect.stringContaining("Unexpected DOCTYPE in HTML document"),
      );
    });

    it("should accept upper case doctype and name", () => {
      // -- arrange
      const source = `${DOCTYPE_DECL_START} ${HTML}>`;
      const { errorHandler } = getMockErrorHandler();
      const { builder, startDTDMock, endDTDMock } = getMockBuilder();

      // -- act
      const returned = parseDoctypeCommentOrCData(
        source,
        0,
        builder,
        errorHandler,
        isHtml,
      );

      // -- assert
      expect(returned).toBe(source.length);
      expect(startDTDMock).toHaveBeenCalledWith(
        HTML,
        undefined,
        undefined,
        undefined,
      );
      expect(endDTDMock).toHaveBeenCalled();
    });

    it("should accept lower case doctype and name", () => {
      // -- arrange
      const source = `${DOCTYPE_DECL_START.toLowerCase()} ${html}>`;
      const { errorHandler } = getMockErrorHandler();
      const { builder, startDTDMock, endDTDMock } = getMockBuilder();

      // -- act
      const returned = parseDoctypeCommentOrCData(
        source,
        0,
        builder,
        errorHandler,
        isHtml,
      );

      // -- assert
      expect(returned).toBe(source.length);
      expect(startDTDMock).toHaveBeenCalledWith(
        html,
        undefined,
        undefined,
        undefined,
      );
      expect(endDTDMock).toHaveBeenCalled();
    });

    it("should accept mixed case doctype and name", () => {
      // -- arrange
      const source = `<!DocType Html>`;
      const { errorHandler } = getMockErrorHandler();
      const { builder, startDTDMock, endDTDMock } = getMockBuilder();

      // -- act
      const returned = parseDoctypeCommentOrCData(
        source,
        0,
        builder,
        errorHandler,
        isHtml,
      );

      // -- assert
      expect(returned).toBe(source.length);
      expect(startDTDMock).toHaveBeenCalledWith(
        "Html",
        undefined,
        undefined,
        undefined,
      );
      expect(endDTDMock).toHaveBeenCalled();
    });

    it(`should accept and preserve doctype with lower case system and '${ABOUT_LEGACY_COMPAT}'`, () => {
      // -- arrange
      const source =
        `${DOCTYPE_DECL_START} ${HTML} system '${ABOUT_LEGACY_COMPAT}'>`;
      const { errorHandler } = getMockErrorHandler();
      const { builder, startDTDMock, endDTDMock } = getMockBuilder();

      // -- act
      const returned = parseDoctypeCommentOrCData(
        source,
        0,
        builder,
        errorHandler,
        isHtml,
      );

      // -- assert
      expect(returned).toBe(source.length);
      expect(startDTDMock).toHaveBeenCalledWith(
        HTML,
        undefined,
        `'${ABOUT_LEGACY_COMPAT}'`,
        undefined,
      );
      expect(endDTDMock).toHaveBeenCalled();
    });

    it(`should accept and preserve doctype with upper case system and "${ABOUT_LEGACY_COMPAT}"`, () => {
      // -- arrange
      const source =
        `${DOCTYPE_DECL_START} ${HTML} ${SYSTEM} '${ABOUT_LEGACY_COMPAT}'>`;
      const { errorHandler } = getMockErrorHandler();
      const { builder, startDTDMock, endDTDMock } = getMockBuilder();

      // -- act
      const returned = parseDoctypeCommentOrCData(
        source,
        0,
        builder,
        errorHandler,
        isHtml,
      );

      // -- assert
      expect(returned).toBe(source.length);
      expect(startDTDMock).toHaveBeenCalledWith(
        HTML,
        undefined,
        `'${ABOUT_LEGACY_COMPAT}'`,
        undefined,
      );
      expect(endDTDMock).toHaveBeenCalled();
    });

    it(`should report fatal error if system is lower case and systemId is not ${ABOUT_LEGACY_COMPAT}`, () => {
      const source =
        `${DOCTYPE_DECL_START} ${HTML} ${SYSTEM.toLowerCase()} "whatever">`;
      const { builder, startDTDMock, endDTDMock } = getMockBuilder();
      const { errorHandler, fatalErrorMock } = getMockErrorHandler();

      const returned = parseDoctypeCommentOrCData(
        source,
        0,
        builder,
        errorHandler,
        isHtml,
      );

      expect(fatalErrorMock).toHaveBeenCalledWith(
        expect.stringContaining(
          `Expected ${ABOUT_LEGACY_COMPAT} in single or double quotes after ${SYSTEM}`,
        ),
      );
      expect(returned).toBeUndefined();
      expect(startDTDMock).not.toHaveBeenCalled();
      expect(endDTDMock).not.toHaveBeenCalled();
    });

    it(`should report fatal error and return if system is lower case and is not followed by whitespace`, () => {
      const source =
        `${DOCTYPE_DECL_START} ${HTML} ${SYSTEM.toLowerCase()}${ABOUT_LEGACY_COMPAT}>`;
      const { builder, startDTDMock, endDTDMock } = getMockBuilder();
      const { errorHandler, fatalErrorMock } = getMockErrorHandler();

      const returned = parseDoctypeCommentOrCData(
        source,
        0,
        builder,
        errorHandler,
        isHtml,
      );

      expect(fatalErrorMock).toHaveBeenCalledWith(expect.stringContaining(""));
      expect(returned).toBeUndefined();
      expect(startDTDMock).not.toHaveBeenCalled();
      expect(endDTDMock).not.toHaveBeenCalled();
    });

    it("should accept and preserve XHTML doctype", () => {
      const source =
        `<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">`;
      const { builder, startDTDMock, endDTDMock } = getMockBuilder();
      const { errorHandler } = getMockErrorHandler();

      const returned = parseDoctypeCommentOrCData(
        source,
        0,
        builder,
        errorHandler,
        isHtml,
      );

      expect(returned).toBe(source.length);
      expect(errorHandler.warning).toHaveBeenCalledWith(
        expect.stringContaining("Unexpected doctype.systemId in HTML document"),
      );
      expect(startDTDMock).toHaveBeenCalledWith(
        html,
        '"-//W3C//DTD XHTML 1.0 Transitional//EN"',
        '"http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd"',
        undefined,
      );
      expect(endDTDMock).toHaveBeenCalled();
    });

    it("should fail on doctype with DTD", () => {
      const source =
        `${DOCTYPE_DECL_START} ${HTML} ${SYSTEM} "${ABOUT_LEGACY_COMPAT}" [<!ENTITY foo "foo">]>`;
      const { builder, startDTDMock, endDTDMock } = getMockBuilder();
      const { errorHandler, fatalErrorMock } = getMockErrorHandler();

      const returned = parseDoctypeCommentOrCData(
        source,
        0,
        builder,
        errorHandler,
        isHtml,
      );

      expect(returned).toBeUndefined();
      expect(fatalErrorMock).toHaveBeenCalledWith(
        expect.stringContaining("doctype not terminated with > at position"),
      );
      expect(startDTDMock).not.toHaveBeenCalled();
      expect(endDTDMock).not.toHaveBeenCalled();
    });
  });
});
