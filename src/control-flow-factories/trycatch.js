import { checkRequestors } from "../crockford-factories/crockford-factories-utils/cockford-factories-misc.ts";
import {
  asObject,
  isCallable,
  makeListenerIf,
  safeCallback,
} from "../parseq-utilities/parseq-utilities-misc.ts";

export const trycatch = (spec) => {
  const { attempt, onFail } = asObject(spec);

  checkRequestors([attempt, onFail], "trycatch");

  return makeListenerIf(attempt.isListener, (pass, fail, message) => {
    let cancellor = attempt.run({
      message: message,
      success: pass,
      error: safeCallback(fail, (reason) => {
        cancellor = onFail.run({
          message: reason,
          success: pass,
          error: fail,
        });
      }),
    });

    return (reason) => {
      if (isCallable(cancellor)) {
        cancellor(reason);
      }
    };
  });
};
