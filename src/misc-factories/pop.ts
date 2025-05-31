import { Last } from "../crockford-factories/crockford-factories-utils/crockford-factories-types.ts";
import { requestor } from "../parseq-utilities/requestor.ts";
import { Pop } from "./misc-factories-utils/misc-factories-types.ts";

/**
 * Removes the first element of the given message and propogates the result.
 * A side effect may be provided which operates on the popped element.
 */
export const pop = <M>(sideEffect?: (popped: Last<M, undefined>) => void) => {
  return requestor<M, Pop<M>>((pass, _fail, message) => {
    if (!Array.isArray(message)) {
      pass(undefined as Pop<M>);
      return;
    }

    const clone = message.slice();
    const popped = clone.pop();
    if (typeof sideEffect === "function") {
      sideEffect(popped);
    }

    pass(clone as Pop<M>);
    return;
  });
};
