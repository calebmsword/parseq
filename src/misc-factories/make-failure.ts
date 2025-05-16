import { makeReason } from "../crockford-factories/crockford-factories-utils/cockford-factories-misc.ts";
import { isCallable } from "../parseq-utilities/parseq-utilities-type-checking.ts";
import { requestor } from "../parseq-utilities/requestor.ts";

const MAKE_FAILURE = "makeFailure";

export const makeFailure = <M>(createReason: (message: M) => any) => {
  if (!isCallable(createReason)) {
    throw makeReason(
      MAKE_FAILURE,
      "Argument to fail must be a function that receives a message and returns a nonnullish value",
      createReason,
    );
  }

  return requestor<M, never>((_pass, fail, message) => {
    fail(createReason(message));
    return;
  });
};
