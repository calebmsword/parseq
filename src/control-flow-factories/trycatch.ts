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

/**
 * Emulates the many uses of the try-catch-finally block.
 * The `attempt` requestor is tried. If it fails and an `onFail` requestor is
 * present, onFail intercepts the failure and may return a success. If a 
 * `cleanup` requestor is present it is always executed lastly no matter if any
 * of the previous requestors succeed or failed and does whatever it likes with
 * the success/failure.
 * A `ifCancelled` cancellor can be provided which is executed whenever this
 * requestor is performed, as well as the requestor associated with whatever
 * requestor is currently executing.
 */
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
