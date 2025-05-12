import {
  __factoryName__,
  makeReason,
} from "../crockford-factories/crockford-factories-utils/misc.js";
import { race } from "../crockford-factories/race.js";
import {
  exists,
  isBoolean,
  isCallable,
  isObject,
  makePotentialListener,
} from "../parseq-utilities/misc.js";
import { failure } from "../misc-factories/failure.js";

const REPEAT = "REPEAT";

const repeatInternal = (
  condition,
  requestor,
  safeRecursion,
  scheduler,
  maxAttempts,
) => {
  if (maxAttempts === 0) {
    return failure(makeReason(REPEAT, "No attempts allowed", maxAttempts));
  }

  let currentAttempts = 0;

  return makePotentialListener(
    requestor.isListener,
    function attempt(pass, fail, message) {
      let cancellor;

      const handleValue = (value, shouldPass) => {
        cancellor = undefined;

        if (exists(maxAttempts)) {
          currentAttempts++;

          if (currentAttempts >= maxAttempts) {
            fail(
              makeReason(
                REPEAT,
                "maximum allowed attempts reached",
                currentAttempts,
              ),
            );
            return;
          }
        }

        if (shouldPass) {
          pass(value);
        } else {
          const tryAgain = () => {
            cancellor = attempt(pass, fail, message);
          };

          if (safeRecursion) {
            scheduler(tryAgain, 0);
          }
          tryAgain();
        }
      };

      cancellor = requestor.run({
        message,
        success(value) {
          const conditionResult = condition(value);

          if (!isBoolean(conditionResult)) {
            fail(makeReason(
              REPEAT,
              "condition did not return a boolean",
              conditionResult,
            ));
          }

          handleValue(value, conditionResult);
        },
        error: (reason) => {
          handleValue(reason, false);
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

export const repeat = (requestor, spec) => {
  if (!isObject(spec)) {
    spec = {};
  }

  let {
    condition,
    timeLimit,
    safeRecursionMode,
    scheduler,
    maxAttempts,
  } = spec;

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

  if (exists(condition) && !isCallable(condition)) {
    throw makeReason(
      REPEAT,
      "Condition must be callable",
      condition,
    );
  } else if (!exists(condition)) {
    condition = () => {
      return true;
    };
  }

  return race([
    repeatInternal(
      condition,
      requestor,
      safeRecursionMode,
      scheduler,
      maxAttempts,
    ),
  ], {
    timeLimit,
    safeRecursionMode,
    scheduler,
    [__factoryName__]: REPEAT,
  });
};
