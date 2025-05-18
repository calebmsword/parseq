import { sequence } from "../crockford-factories/sequence.ts";
import { Requestor } from "../types.d.ts";
import { first } from "../misc-factories/first.ts";
import { pair } from "../misc-factories/pair.ts";

export const waitFor = <M, T = any>(requestor: Requestor<any, T>) => {
  return sequence([
    pair<M, T>(requestor),
    first<M>()
  ]);
};
