import {
  exists,
  isCallable,
  makeUnspecifiedReason,
} from "../parseq-utilities/misc.js";
import { requestor } from "../parseq-utilities/requestor.js";

export const makeFailure = (createReason) => {
  if (!isCallable(createReason)) {
    throw new Error(
      "Argument to fail must be a function that receives a message and returns a nonnullish value",
      { cause: createReason },
    );
  }

  return requestor((_pass, fail, message) => {
    const reason = createReason(message);

    fail(exists(reason) ? reason : makeUnspecifiedReason());
  });
};
