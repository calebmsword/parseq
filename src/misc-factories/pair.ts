import { all } from "../control-flow-factories/all.ts";
import { Requestor } from "../types.d.ts";
import { thru } from "./thru.ts";

export const pair = <Left, Right>(
  requestor: Requestor<Left, Right>,
) => {
  return all([
    thru<Left>(),
    requestor,
  ]);
};
