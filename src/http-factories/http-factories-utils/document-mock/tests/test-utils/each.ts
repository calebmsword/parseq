import { it } from "@std/testing/bdd";
import { unicode } from "./unicode.ts";

type Lookup<ArrayLike, n> = n extends keyof ArrayLike ? ArrayLike[n]
  : undefined;

type ElementOf<Array> = Lookup<Array, number>;

type AsArray<T> = {
  [n in keyof T]: Lookup<T, n>;
};

export const each = <T extends any[]>(
  values: AsArray<T> & ElementOf<T>[],
  testDescription: string,
  getFn: (
    value: ElementOf<T>,
  ) => (this: null, t: Deno.TestContext) => void | Promise<void>,
) => {
  values.forEach((value) => {
    const desc = testDescription
      .replaceAll("%{}", String(value))
      .replaceAll("%u{}", unicode(String(value)));

    it(desc, getFn(value));
  });
};

export const eachTable = <T>(
  values: AsArray<T> & ElementOf<T>[] & AsArray<{ [key: string]: any }>,
  testDescription: string,
  getFn: (
    value: ElementOf<T>,
  ) => (this: null, t: Deno.TestContext) => void | Promise<void>,
) => {
  values.forEach((value) => {
    const props = Object.keys(value || {});

    const desc = props.reduce((description, prop) => {
      return description.replaceAll(`$${prop}`, String((value || {})[prop]));
    }, testDescription);

    it(desc, getFn(value));
  });
};
