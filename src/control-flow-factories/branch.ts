import {
  checkRequestors,
  makeReason,
} from "../crockford-factories/crockford-factories-utils/cockford-factories-misc.ts";
import {
  isBoolean,
  isCallable,
} from "../parseq-utilities/parseq-utilities-type-checking.ts";
import { requestor } from "../parseq-utilities/requestor.ts";
import { Requestor } from "../types.d.ts";

const BRANCH = "branch";

export const branch = <M, T, F = T>(
  condition: (message: M) => boolean,
  ifTrue: Requestor<M, T>,
  ifFalse: Requestor<M, F>,
) => {
  if (!isCallable(condition)) {
    throw makeReason(BRANCH, "condition must be a function", condition);
  }

  checkRequestors([ifTrue, ifFalse], BRANCH);

  return requestor<M, T | F>((pass, fail, message) => {
    const boolean = condition(message);

    if (!isBoolean(boolean)) {
      fail(makeReason(BRANCH, "condition did not return a boolean", boolean));
    }

    const cancellor = boolean
      ? ifTrue.run({
        runOnFutureTick: false,
        message,
        success: pass,
        failure: fail,
      })
      : ifFalse.run({
        runOnFutureTick: false,
        message,
        success: pass,
        failure: fail,
      });

    return (reason?: any) => {
      if (typeof cancellor === "function") {
        cancellor(reason);
      }
    };
  });
};
