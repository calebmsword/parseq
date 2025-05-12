import { isBoolean, isCallable } from "../parseq-utilities/misc.js";
import { isRequestor, requestor } from "../parseq-utilities/requestor.js";

export const branch = (condition, ifTrue, ifFalse) => {
  if (!isCallable(condition)) {
    throw new Error("condition must be a function", { cause: condition });
  }

  [ifTrue, ifFalse].forEach((arg) => {
    if (!isRequestor(arg)) {
      throw new Error("ifTrue and ifFalse must be requestors", { cause: arg });
    }
  });

  return requestor((pass, fail, message) => {
    const boolean = condition(message);

    if (!isBoolean(boolean)) {
      fail(new Error("condition did not return a boolean", { cause: boolean }));
    }

    const cancellor = boolean
      ? ifTrue.run({ message, success: pass, error: fail })
      : ifFalse.run({ message, success: pass, error: fail });

    if (isCallable(cancellor)) {
      return cancellor;
    }
  });
};
