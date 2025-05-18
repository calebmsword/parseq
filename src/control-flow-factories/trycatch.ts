import { checkRequestors } from "../crockford-factories/crockford-factories-utils/cockford-factories-misc.ts";
import { makeFailure } from "../misc-factories/make-failure.ts";
import { thru } from "../misc-factories/thru.ts";
import { withCancellor } from "../misc-factories/with-cancellor.ts";
import {
  arbiter,
  makeListenerIf,
} from "../parseq-utilities/parseq-utilities-misc.ts";
import { Cancellor, Requestor } from "../types.d.ts";
import {
  Absent,
  TryCatchValue,
} from "./control-flow-utils/control-flow-types.ts";

const TRY_CATCH = "trycatch";

export type TryCatchSpec<M, T, C, F> = {
  attempt: Requestor<M, T>;
  onFail?: Requestor<any, C>;
  cleanup?: Requestor<any, F>;
  ifCancelled?: Cancellor;
};

export const trycatch = <M, Try, Catch = Absent, Finally = Absent>(
  spec: TryCatchSpec<M, Try, Catch, Finally>,
) => {
  const {
    attempt,
    onFail = makeFailure<any>((reason) => {
      return reason;
    }),
    cleanup = thru<any>(),
    ifCancelled = () => {},
  } = spec;

  checkRequestors([attempt, onFail], TRY_CATCH);

  return withCancellor(
    makeListenerIf<M, TryCatchValue<Try, Catch, Finally>>(
      attempt.isListener,
      (pass, fail, message) => {
        let cancellor = attempt.run({
          runOnFutureTick: false,
          message: message,
          success: arbiter(fail, (value) => {
            cancellor = cleanup.run({
              runOnFutureTick: false,
              message: value,
              success: pass,
              failure: fail,
            });
          }),
          failure: arbiter(fail, (reason) => {
            cancellor = onFail.run({
              runOnFutureTick: false,
              message: reason,
              success: arbiter(fail, (value) => {
                cancellor = cleanup.run({
                  runOnFutureTick: false,
                  message: value,
                  success: pass,
                  failure: fail,
                });
              }),
              failure: arbiter(fail, (reason) => {
                cancellor = cleanup.run({
                  runOnFutureTick: false,
                  message: reason,
                  success: arbiter<[any]>(fail, (_value) => {
                    fail(reason);
                    return;
                  }),
                  failure: fail,
                });
              }),
            });
          }),
        });

        return (reason?: any) => {
          if (typeof cancellor === "function") {
            cancellor(reason);
          }
        };
      },
    ),
    ifCancelled,
  );
};
