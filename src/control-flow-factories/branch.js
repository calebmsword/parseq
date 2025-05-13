import {
  checkRequestors,
  makeReason,
} from "../crockford-factories/crockford-factories-utils/misc.js";
import { isBoolean, isCallable } from "../parseq-utilities/misc.js";
import { requestor } from "../parseq-utilities/requestor.js";

const BRANCH = "branch";

export const branch = (condition, ifTrue, ifFalse) => {
  if (!isCallable(condition)) {
    throw makeReason(BRANCH, "condition must be a function", condition);
  }

  checkRequestors([ifTrue, ifFalse], BRANCH);

  return requestor((pass, fail, message) => {
    const boolean = condition(message);

    if (!isBoolean(boolean)) {
      fail(makeReason(BRANCH, "condition did not return a boolean", boolean));
    }

    const cancellor = boolean
      ? ifTrue.run({ message, success: pass, error: fail })
      : ifFalse.run({ message, success: pass, error: fail });

    if (isCallable(cancellor)) {
      return cancellor;
    }
  });
};
