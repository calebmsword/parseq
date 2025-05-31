import {
  exists,
  isBoolean,
  isScheduler,
} from "../../parseq-utilities/parseq-utilities-type-checking.ts";
import { makeReason } from "../../crockford-factories/crockford-factories-utils/cockford-factories-misc.ts";
import { isRequestor } from "../../parseq-utilities/requestor.ts";
import { makeListenerIf } from "../../parseq-utilities/parseq-utilities-misc.ts";
import {
  getDefaultScheduler,
  Scheduler,
} from "../../parseq-utilities/config.ts";
import { failure } from "../../misc-factories/failure.ts";
import { Cancellor } from "../../types.d.ts";
import { Requestor } from "../../types.d.ts";

export type LooperSpec<M, V> = {
  requestor: Requestor<M | V, V>;
  propogateOnRepeat: boolean;
  tryAgainOnFail: boolean;
  factoryName: string;
  maxAttempts?: number;
  until?: (value: V) => boolean;
  eachTryOnNewTick?: boolean;
  scheduler?: Scheduler;
};

export const looper = <M, V>(spec: LooperSpec<M, V>) => {
  let {
    until,
    requestor,
    eachTryOnNewTick,
    scheduler,
    maxAttempts,
    propogateOnRepeat,
    tryAgainOnFail,
    factoryName,
  } = spec;

  if (
    maxAttempts !== null && maxAttempts !== undefined &&
    (!Number.isSafeInteger(maxAttempts) || maxAttempts < 0)
  ) {
    throw makeReason(
      factoryName,
      "Expects a nonnegative, safe integer for maxAttempts",
      maxAttempts,
    );
  }

  if (until !== null && until !== undefined && typeof until !== "function") {
    throw makeReason(
      factoryName,
      "until must be callable",
      until,
    );
  }

  if (exists(propogateOnRepeat) && !isBoolean(propogateOnRepeat)) {
    throw makeReason(
      factoryName,
      "propogateOnRepeat must be a boolean",
      propogateOnRepeat,
    );
  }

  if (!isRequestor(requestor)) {
    throw makeReason(factoryName, "no given a proper requestor", requestor);
  }

  if (exists(scheduler) && !isScheduler(scheduler)) {
    throw makeReason(factoryName, "not given a proper scheduler", scheduler);
  }

  if (scheduler === null || scheduler === undefined) {
    scheduler = getDefaultScheduler();
  }

  // If no attempts allowed, simply return a failure.
  if (maxAttempts === 0) {
    return failure(makeReason(factoryName, "No attempts allowed", maxAttempts));
  }

  let totalAttempts = 0;

  return makeListenerIf<M | V, V>(
    requestor.isListener,
    function attempt(pass, fail, message) {
      let cancellor: Cancellor | void;

      cancellor = requestor.run({
        runOnFutureTick: eachTryOnNewTick,
        message,
        receiver({ value, reason }) {
          cancellor = undefined;

          if (!exists(reason)) {
            const conditionResult = typeof until === "function"
              ? until(value as V)
              : true;

            if (!isBoolean(conditionResult)) {
              fail(makeReason(
                factoryName,
                "condition did not return a boolean",
                conditionResult,
              ));
              return;
            }

            if (conditionResult) {
              pass(value as V);
              return;
            }
          } else if (!tryAgainOnFail) {
            fail(reason);
            return;
          }

          if (maxAttempts !== null && maxAttempts !== undefined) {
            totalAttempts++;

            if (totalAttempts >= maxAttempts) {
              fail(
                makeReason(
                  factoryName,
                  "maximum allowed attempts reached",
                  {
                    totalAttempts,
                    requestorPassedWithValue: value,
                    requestorFailedWithReason: reason,
                  },
                ),
              );
              return;
            }
          }

          cancellor = attempt(
            pass,
            fail,
            propogateOnRepeat ? value as V : message,
          );
          return;
        },
      });

      return (reason?: any) => {
        if (typeof cancellor === "function") {
          cancellor(reason);
        }
      };
    },
  );
};
