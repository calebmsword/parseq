import { checkRequestors } from "../crockford-factories/crockford-factories-utils/cockford-factories-misc.ts";
import {
  makeListenerIf,
  safeCallback,
} from "../parseq-utilities/parseq-utilities-misc.ts";
import { Requestor } from "../types.d.ts";

const TRY_CATCH = "trycatch";

export type TryCatchSpec<M, T, C> = {
  attempt: Requestor<M, T>;
  onFail: Requestor<any, C>;
};

export const trycatch = <M, T, C = T>(spec: TryCatchSpec<M, T, C>) => {
  const { attempt, onFail } = spec;

  checkRequestors([attempt, onFail], TRY_CATCH);

  return makeListenerIf<M, T | C>(attempt.isListener, (pass, fail, message) => {
    let cancellor = attempt.run({
      runOnFutureTick: false,
      message: message,
      success: pass,
      error: safeCallback(fail, (reason) => {
        cancellor = onFail.run({
          runOnFutureTick: false,
          message: reason,
          success: pass,
          error: fail,
        });
      }),
    });

    return (reason?: any) => {
      if (typeof cancellor === "function") {
        cancellor(reason);
      }
    };
  });
};
