import { checkRequestors } from "../crockford-factories/crockford-factories-utils/misc.js";
import {
  asObject,
  isCallable,
  makePotentialListener,
  safeCallback,
} from "../parseq-utilities/misc.js";

export const trycatch = (spec) => {
  const { attempt, onFail } = asObject(spec);

  checkRequestors([attempt, onFail], "trycatch");

  return makePotentialListener(attempt.isListener, (pass, fail, message) => {
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
