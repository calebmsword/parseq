import {
  exists,
  isBoolean,
  isCallable,
} from "../../parseq-utilities/parseq-utilities-misc.ts";
import { makeReason } from "../../crockford-factories/crockford-factories-utils/cockford-factories-misc.ts";
import { isRequestor } from "../../parseq-utilities/requestor.js";
import { makeListenerIf } from "../../parseq-utilities/parseq-utilities-misc.ts";

export const looper = ({
  until,
  requestor,
  safeRecursion,
  scheduler,
  maxAttempts,
  propogateOnRepeat,
  tryAgainOnFail,
  factoryName,
}) => {
  if (
    exists(maxAttempts) &&
    (!Number.isSafeInteger(maxAttempts) || maxAttempts < 0)
  ) {
    throw makeReason(
      REPEAT,
      "Expects a nonnegative, safe integer for maxAttempts",
      maxAttempts,
    );
  }

  if (exists(until) && !isCallable(until)) {
    throw makeReason(
      REPEAT,
      "until must be callable",
      until,
    );
  } else if (!exists(until)) {
    until = () => {
      return true;
    };
  }

  if (exists(propogateOnRepeat) && !isBoolean(propogateOnRepeat)) {
    throw makeReason(
      REPEAT,
      "propogateOnRepeat must be a boolean",
      propogateOnRepeat,
    );
  }

  if (!isRequestor(requestor)) {
    throw makeReason(factoryName, "expected a requestor", requestor);
  }

  if (maxAttempts === 0) {
    return failure(makeReason(factoryName, "No attempts allowed", maxAttempts));
  }

  let totalAttempts = 0;

  return makeListenerIf(
    requestor.isListener,
    function attempt(pass, fail, message) {
      let cancellor;

      cancellor = requestor.run({
        message,
        receiver({ value, reason }) {
          cancellor = undefined;

          if (!exists(reason)) {
            const conditionResult = until(value);

            if (!isBoolean(conditionResult)) {
              fail(makeReason(
                factoryName,
                "condition did not return a boolean",
                conditionResult,
              ));
            }

            if (conditionResult) {
              pass(value);
              return;
            }
          } else if (!tryAgainOnFail) {
            fail(reason);
            return;
          }

          if (exists(maxAttempts)) {
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

          const tryAgain = () => {
            cancellor = attempt(
              pass,
              fail,
              propogateOnRepeat ? value : message,
            );
          };

          if (safeRecursion) {
            const id = scheduler.schedule(tryAgain, 0);
            cancellor = () => {
              scheduler.unschedule(id);
            };
            return;
          }

          tryAgain();
        },
      });

      return (reason) => {
        if (isCallable(cancellor)) {
          cancellor(reason);
        }
      };
    },
  );
};
