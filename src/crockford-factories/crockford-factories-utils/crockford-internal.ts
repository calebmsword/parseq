import {
  getDefaultScheduler,
  Scheduler,
} from "../../parseq-utilities/config.ts";
import { FactoryName, makeReason } from "./cockford-factories-misc.ts";
import { Requestor, requestor } from "../../parseq-utilities/requestor.ts";
import {
  exists,
  isBoolean,
  isCallable,
  isScheduler,
} from "../../parseq-utilities/parseq-utilities-misc.ts";
import { Cancellor } from "../../types.d.ts";

/**
 * Launches requestors and manages timing, cancellation, and throttling.
 * All crockford factories run this function internally.
 * @returns {Cancellor}
 * A cancellor which runs all cancellors of pending requestors.
 */
export const crockfordInternal = <RequestorsValue, ResultValue = RequestorsValue>({
  factoryName,
  requestors,
  initialMessage,
  internalAction,
  timeout,
  timeLimit,
  scheduler,
  throttle,
  safeRecursionMode,
}: {
  factoryName: string;
  requestors: Requestor<any, RequestorsValue>[];
  initialMessage: any;
  internalAction: (
    value: ResultValue | undefined,
    reason: any,
    requestorIndex: number,
  ) => void;
  timeout?: () => void;
  timeLimit?: number;
  scheduler?: Scheduler;
  throttle?: number;
  safeRecursionMode?: boolean;
}): Cancellor => {
  let cancellors: (Cancellor | void)[] | undefined = new Array(
    requestors.length,
  );
  let nextIndex = 0;

  let timerId: number | undefined;

  if (!isCallable(internalAction)) {
    throw makeReason(
      factoryName,
      "internalAction must be callable",
      internalAction,
    );
  }

  if (exists(safeRecursionMode) && !isBoolean(safeRecursionMode)) {
    throw makeReason(
      factoryName,
      "expects safeRecursionMode to be a boolean",
      safeRecursionMode,
    );
  }

  let schedule;
  let unschedule;
  if (scheduler !== undefined) {
    if (!isScheduler(scheduler)) {
      throw makeReason(
        factoryName,
        "expects scheduler to have schedule and unschedule methods",
        scheduler,
      );
    }

    ({ schedule, unschedule } = scheduler);
  } else {
    ({ schedule, unschedule } = getDefaultScheduler());
  }

  const startRequestor = (message?: any) => {
    if (cancellors === undefined || nextIndex >= requestors.length) {
      return;
    }

    let requestorIndex: number | undefined = nextIndex++;

    const requestor = requestors[requestorIndex];

    try {
      const cancellor = requestor.run({
        message,
        receiver({ value, reason }) {
          if (cancellors === undefined || requestorIndex === undefined) {
            return;
          }

          cancellors[requestorIndex] = undefined;

          internalAction(value as ResultValue , reason, requestorIndex);

          requestorIndex = undefined;

          if (nextIndex < requestors.length) {
            const message = factoryName === FactoryName.SEQUENCE
              ? value
              : initialMessage;
            if (safeRecursionMode) {
              schedule(startRequestor, 0, message);
            } else {
              return startRequestor(message);
            }
          }
        },
      });

      if (requestorIndex !== undefined) {
        cancellors[requestorIndex] = cancellor;
      }
    } catch (reason) {
      internalAction(undefined, reason, requestorIndex);
      requestorIndex = undefined;
      startRequestor(message);
    }
  };

  if (timeLimit !== undefined) {
    if (typeof timeLimit !== "number" || timeLimit < 0) {
      throw makeReason(
        factoryName,
        "timeLimit must be a number greater than 0!",
        timeLimit,
      );
    } else if (typeof timeout !== "function") {
      throw makeReason(factoryName, "timeout must be a function!", timeout);
    } else {
      timerId = schedule(timeout, timeLimit);
    }
  }

  if (throttle === undefined) {
    throttle = 0;
  }

  if (!Number.isSafeInteger(throttle) || throttle < 0) {
    throw makeReason(
      factoryName,
      "Throttle must be anonnegative, safe integer!",
      throttle,
    );
  }

  let amountToParallelize = Math.min(throttle || Infinity, requestor.length);
  while (amountToParallelize-- > 0) {
    schedule(startRequestor, 0, initialMessage);
  }

  const DEFAULT_CANCEL_REASON = makeReason(factoryName, "Cancel!");

  return (reason = DEFAULT_CANCEL_REASON) => {
    if (timerId !== undefined) {
      unschedule(timerId);
      timerId = undefined;
    }

    if (cancellors !== undefined) {
      cancellors.forEach((cancellor) => {
        try {
          if (typeof cancellor === "function") {
            cancellor(reason);
          }
        } catch (_exception) { /* swallow exceptions */ }
      });
      cancellors = undefined;
    }
  };
};
