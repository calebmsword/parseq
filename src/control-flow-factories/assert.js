import { makeReason } from "../crockford-factories/crockford-factories-utils/misc.js";
import {
  exists,
  isBoolean,
  isCallable,
  isString,
} from "../parseq-utilities/misc.js";
import { requestor } from "../parseq-utilities/requestor.js";

const ASSERT = "assert";

export const assert = (condition, description) => {
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

  return requestor((pass, fail, message) => {
    const conditionResult = condition(message);

    if (!isBoolean(conditionResult)) {
      fail(
        makeReason(
          ASSERT,
          "condition did not return a boolean",
          conditionResult,
        ),
      );
    }

    conditionResult ? pass(message) : fail(
      makeReason(
        ASSERT,
        description ? description : "assertion failed",
        message,
      ),
    );
  });
};
