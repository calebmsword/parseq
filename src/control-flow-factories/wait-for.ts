import { sequence } from "../crockford-factories/sequence.ts";
import { Requestor } from "../types.d.ts";
import { first } from "../misc-factories/first.ts";
import { pair } from "../misc-factories/pair.ts";

/** Pushes through the given message after the given requestor completes. */
export const waitFor = <M, T = any>(requestor: Requestor<any, T>) => {
  return sequence([
    pair<M, T>(requestor),
    first<M>(),
  ]);
};
