import { expect } from "@std/expect/expect";

/**
 * An unit test assertion.
 * Shorthand for searching on a regular expression and ensuring that the entire
 * string matches that regular expression.
 */
export const expectMatch = (regexp: RegExp, str: string) => {
  expect((regexp.exec(str) || {})[0]).toBe(str);
};
