import { getDefaultScheduler } from "../../parseq-utilities/config.js";
import { FactoryName, makeReason } from "./misc.js";
import { requestor } from "../../parseq-utilities/requestor.js";
import {
  exists,
  isBoolean,
  isCallable,
  isScheduler,
} from "../../parseq-utilities/misc.js";

export const crockfordInternal = ({
  factoryName,
  requestors,
  initialMessage,
  internalAction,
  timeout,
  timeLimit,
  scheduler,
  throttle,
  safeRecursionMode,
}) => {
  let cancellors = new Array(requestors.length);
  let nextIndex = 0;

  let timerId;

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
  if (exists(scheduler)) {
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

  const startRequestor = (message) => {
    if (cancellors === undefined || nextIndex >= requestors.length) {
      return;
    }

    let requestorIndex = nextIndex++;

    const requestor = requestors[requestorIndex];

    try {
      const cancellor = requestor.run({
        message,
        receiver({ value, reason }) {
          if (cancellors === undefined || requestorIndex === undefined) {
            return;
          }

          cancellors[requestorIndex] = undefined;

          internalAction(value, reason, requestorIndex);

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

  if (!exists(throttle)) {
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
