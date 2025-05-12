import { makeReason } from "../crockford-factories/crockford-factories-utils/misc.js";
import {
  exists,
  isBoolean,
  isCallable,
  isString,
} from "../parseq-utilities/misc.js";
import { requestor } from "../parseq-utilities/requestor.js";

export const assert = (condition, description) => {
  if (!isCallable(condition)) {
    throw makeReason("assert", "condition must be callable", condition);
  }

  if (exists(description) && !isString(description)) {
    throw makeReason(
      "assert",
      "description must be a string or undefined",
      description,
    );
  }

  return requestor((pass, fail, message) => {
    const conditionResult = condition(message);

    if (!isBoolean(conditionResult)) {
      fail(
        makeReason(
          "assert",
          "condition did not return a boolean",
          conditionResult,
        ),
      );
    }

    conditionResult ? pass(message) : fail(
      makeReason("assert", description ? description : "assertion failed", {
        cause: message,
      }),
    );
  });
};
