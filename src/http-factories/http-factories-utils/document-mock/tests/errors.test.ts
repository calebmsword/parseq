import { describe, it } from "@std/testing/bdd";
import { expect } from "@std/expect/expect";
import { ParseError } from "../src/errors.ts";
import * as path from "@std/path";

describe("ParseError", () => {
  it("should have name ParseError", () => {
    expect(new ParseError("").name).toBe("ParseError");
  });

  it("should be an instance of Error", () => {
    expect(new ParseError("")).toBeInstanceOf(Error);
  });

  it("should be an instance of ParseError", () => {
    expect(new ParseError("")).toBeInstanceOf(Error);
  });

  it("should store first argument as message", () => {
    const error = new ParseError("FROM TEST");
    expect(error.message).toBe("FROM TEST");
  });

  it("should store second argument as locator", () => {
    const locator = {};
    const error = new ParseError("", locator);

    expect(error.locator).toBe(locator);
  });

  it("should have correct StackTrace", () => {
    const error = new ParseError("MESSAGE");
    const stack = error.stack && error.stack.split(/[\n\r]+/);
    expect(stack && stack.length).toBeGreaterThan(1);
    expect((stack || [])[0]).toBe("ParseError: MESSAGE");
    expect(path.basename((stack || [])[1])).toContain(
      path.basename(import.meta.filename || ""),
    );
  });

  it("Error should ot be an instanceof ParseError", () => {
    expect(new Error()).not.toBeInstanceOf(ParseError);
  });
});
