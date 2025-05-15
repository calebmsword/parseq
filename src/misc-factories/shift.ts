import { First } from "../crockford-factories/crockford-factories-utils/crockford-factories-types.ts";
import { requestor } from "../parseq-utilities/requestor.ts";
import { Flatten, Shift } from "./misc-factories-utils/misc-factories-types.ts";

export const shift = <M>(
  observer?: (popped: First<M, unknown>) => void,
) => {
  return requestor<M, Flatten<Shift<M>>>((pass, _fail, message) => {
    if (!Array.isArray(message)) {
      pass(undefined as Flatten<Shift<M>>);
      return;
    }
    const clone = message.slice();
    const popped = clone.shift();
    if (typeof observer === "function") {
      observer(popped);
    }
    pass(clone.length < 2 ? clone[0] : clone);
  });
};
