/**
 * Creates a string of characters between a range of code points.
 *
 * @example
 * ```
 * const r = range("\x7F", "\x84");
 * expect(r).toBe("\x7F\x80\x81\x82\x83\x84");
 * ```
 *
 * @param from
 * The inclusive start of the range. Only the first character is used.
 * @param to
 * The inclusive end of the range. Only the first character is used.
 * @returns
 */
export const range = (from: string, to: string) => {
  let result = "";
  const start = from.codePointAt(0) || 0;
  const end = to.codePointAt(0) || 0;

  for (let i = start; i <= end; i++) {
    result += String.fromCodePoint(i);
  }

  return result;
};
