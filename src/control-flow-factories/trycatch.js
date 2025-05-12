import { checkRequestors } from "../crockford-factories/crockford-factories-utils/misc.js";
import {
  isCallable,
  isObject,
  makePotentialListener,
} from "../parseq-utilities/misc.js";

export const trycatch = (spec) => {
  if (!isObject(spec)) {
    spec = {};
  }

  const { attempt, onFail } = spec;

  checkRequestors([attempt, onFail], "trycatch");

  return makePotentialListener(attempt.isListener, (pass, fail, message) => {
    let cancellor = attempt({
      message: message,
      success: pass,
      error(reason) {
        cancellor = onFail({
          message: reason,
          success: pass,
          error: fail,
        });
      },
    });

    return (reason) => {
      if (isCallable(cancellor)) {
        cancellor(reason);
      }
    };
  });
};
