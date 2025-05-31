import { all } from "../control-flow-factories/all.ts";
import { Requestor } from "../types.d.ts";
import { thru } from "./thru.ts";

/**
 * Propogates a tuple value with two elements, containing the given message and
 * the result of the given requestor.
 * @param requestor 
 * @returns 
 */
export const pair = <Left, Right>(
  requestor: Requestor<Left, Right>,
) => {
  return all([
    thru<Left>(),
    requestor,
  ]);
};
