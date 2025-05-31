/**
 * Creates a representation of the given string as unicode code points.
 * Used strictly for logging purposes.
 *
 * @example
 * ```
 * const str = unicode("xmldom");
 * expect(str).toBe('"xmldom" (\\u0078\\u006D\\u006C\\u0064\\u006F\\u006D)');
 * ```
 */
export const unicode = (value: string) => {
  return `"${value}" (${
    value
      .split("")
      .map((char) => {
        return "\\u" +
          char.codePointAt(0)?.toString(16).toUpperCase().padStart(4, "0");
      })
      .join("")
  })`;
};
