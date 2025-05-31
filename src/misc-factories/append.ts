import { all } from "../control-flow-factories/all.ts";
import { Last } from "../crockford-factories/crockford-factories-utils/crockford-factories-types.ts";
import { sequence } from "../crockford-factories/sequence.ts";
import { map } from "./map.ts";
import { Pop } from "./misc-factories-utils/misc-factories-types.ts";
import { thru } from "./thru.ts";
import { Requestor } from "../types.d.ts";

/**
 * Appends the given tuple message with the value of the given requestor.
 */
export const append = <Values extends any[]>(
  requestor: Requestor<Pop<Values>, Last<Values>>,
) => {
  type M = Pop<Values>;
  type V = Last<Values>;
  return sequence([
    all([
      thru<M>(),
      requestor,
    ]),
    map<[M, V], [...(M extends any[] ? M : [M]), V]>((x) => {
      return x.flat() as [...(M extends any[] ? M : [M]), V];
    }),
  ]);
};
