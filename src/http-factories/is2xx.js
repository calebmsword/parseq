import { makeFailure } from "../misc-factories/make-failure.js";
import { branch } from "../control-flow-factories/branch.js";
import { thru } from "../misc-factories/thru.js";
import { isObject } from "../parseq-utilities/misc.js";

export const is2xx = () => {
  return branch(
    (response) => {
      return isObject(response) &&
        Number.isSafeInteger(response.code) &&
        response.code > 199 &&
        response.code < 300;
    },
    thru(),
    makeFailure((response) => {
      return new Error(`${response.code}: ${response.message}`, {
        cause: response,
      });
    }),
  );
};
