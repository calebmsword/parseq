import { First } from "../crockford-factories/crockford-factories-utils/crockford-factories-types.ts";
import { requestor } from "../parseq-utilities/requestor.ts";
import { Shift } from "./misc-factories-utils/misc-factories-types.ts";

/**
 * Removes the last element of the tuple message and returns the result.
 * Optionally may be given a side effect to run on the popped value.
 */
export const shift = <M>(sideEffeect?: (popped: First<M, unknown>) => void) => {
  return requestor<M, Shift<M>>((pass, _fail, message) => {
    if (!Array.isArray(message)) {
      pass(undefined as Shift<M>);
      return;
    }

    const clone = message.slice();
    const popped = clone.shift();
    if (typeof sideEffeect === "function") {
      sideEffeect(popped);
    }

    pass(clone as Shift<M>);
    return;
  });
};
