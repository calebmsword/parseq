import { makeReason } from "../crockford-factories/crockford-factories-utils/misc.js";
import {
  exists,
  isCallable,
  makeUnspecifiedReason,
} from "../parseq-utilities/misc.js";
import { requestor } from "../parseq-utilities/requestor.js";

const MAKE_FAILURE = "makeFailure";

export const makeFailure = (createReason) => {
  if (!isCallable(createReason)) {
    throw makeReason(
      MAKE_FAILURE,
      "Argument to fail must be a function that receives a message and returns a nonnullish value",
      createReason,
    );
  }

  return requestor((_pass, fail, message) => {
    const reason = createReason(message);

    fail(exists(reason) ? reason : makeUnspecifiedReason());
  });
};
