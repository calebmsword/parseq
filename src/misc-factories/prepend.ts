import { all } from "../control-flow-factories/all.ts";
import { First } from "../crockford-factories/crockford-factories-utils/crockford-factories-types.ts";
import { sequence } from "../crockford-factories/sequence.ts";
import { map } from "./map.ts";
import { Shift } from "./misc-factories-utils/misc-factories-types.ts";
import { thru } from "./thru.ts";
import { Requestor } from "../types.d.ts";

export const prepend = <Values extends any[]>(
  requestor: Requestor<Shift<Values>, First<Values>>,
) => {
  type M = Shift<Values>;
  type V = First<Values>;
  return sequence([
    all([
      requestor,
      thru<M>(),
    ]),
    map<[V, M], [V, ...(M extends any[] ? M : [M])]>((x) => {
      return x.flat() as [V, ...(M extends any[] ? M : [M])];
    }),
  ]);
};
