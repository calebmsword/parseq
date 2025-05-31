import { describe, it } from "@std/testing/bdd";
import { assertSnapshot } from "@std/testing/snapshot";
import { expect } from "@std/expect/expect";
import { each } from "./each.ts";

export const runReadOnlyObjectTests = (
  readonlyObject: Readonly<{ [key: string]: any }>,
  readonlyObjectName: string,
) => {
  describe(readonlyObjectName, () => {
    each(
      Object.keys(readonlyObject),
      "should contain key %{} with value `true`",
      (_key) => async (t) => {
        // -- arrange
        const key = _key as keyof typeof readonlyObject;
        const value = readonlyObject[key];

        // -- act/assert
        await assertSnapshot(t, [key, value]);
      },
    );

    each(
      Object.keys(readonlyObject),
      "key %{} should be immutable",
      (_key) => () => {
        // -- arrange
        const key = _key as keyof typeof readonlyObject;
        const value = readonlyObject[key];

        // -- act/assert
        try {
          (readonlyObject as any)[key] = "changed value";
        } catch {
          expect(readonlyObject[key]).toBe(value);
        }
      },
    );

    it("should not have a prototype", () => {
      expect(readonlyObject).not.toHaveProperty("prototype");
      expect(readonlyObject).not.toHaveProperty("__proto__");
    });
  });
};

export const runReadOnlyObjectCheckerTests = (
  readonlyObject: Readonly<{ [key: string]: any }>,
  checker: (name: string) => boolean,
  checkerName: string,
) => {
  describe(checkerName, () => {
    each(
      Object.keys(readonlyObject),
      'should detect attribute "%{}"',
      (key) => () => {
        expect(checker(key)).toBe(true);
      },
    );

    each(
      Object.keys(readonlyObject).map((key) => key.toUpperCase()),
      'should detect attribute "%{}" even though it is all caps',
      (capitalized) => () => {
        expect(checker(capitalized)).toBe(true);
      },
    );

    each(
      Object.keys(readonlyObject).map((key) => {
        return key[0].toUpperCase() + key.substring(1);
      }),
      'should detect attribute "%{}" even though it is has mixed case',
      (mixedCase) => () => {
        expect(checker(mixedCase)).toBe(true);
      },
    );

    it("should not detect prototype properties", () => {
      expect(checker("hasOwnProperty")).toBe(false);
      expect(checker("constructor")).toBe(false);
      expect(checker("prototype")).toBe(false);
      expect(checker("__proto__")).toBe(false);
    });
  });
};
