import { makeReason } from "../crockford-factories/crockford-factories-utils/cockford-factories-misc.ts";
import {
  exists,
  isBoolean,
  isCallable,
  isString,
} from "../parseq-utilities/parseq-utilities-type-checking.ts";
import { requestor } from "../parseq-utilities/requestor.ts";

const ASSERT = "assert";

/**
 * Creates requestor that only succeed if given messages that pass an assertion.
 */
export const assert = <M>(
  condition: (message: M) => boolean,
  description?: string,
) => {
  if (!isCallable(condition)) {
    throw makeReason(ASSERT, "condition must be callable", condition);
  }

  if (exists(description) && !isString(description)) {
    throw makeReason(
      ASSERT,
      "description must be a string or nullish",
      description,
    );
  }

  return requestor<M, M>((pass, fail, message) => {
    const conditionResult = condition(message);

    if (!isBoolean(conditionResult)) {
      fail(
        makeReason(
          ASSERT,
          "condition did not return a boolean",
          conditionResult,
        ),
      );
      return;
    }

    conditionResult ? pass(message) : fail(
      makeReason(
        ASSERT,
        description ? description : "assertion failed",
        message,
      ),
    );
    return;
  });
};
