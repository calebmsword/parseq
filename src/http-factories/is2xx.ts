import { makeFailure } from "../misc-factories/make-failure.ts";
import { branch } from "../control-flow-factories/branch.ts";
import { thru } from "../misc-factories/thru.ts";
import { HttpValue } from "./http-factories-utils/http-types.ts";
import { makeReason } from "../crockford-factories/crockford-factories-utils/cockford-factories-misc.ts";

const IS_2XX = "is2xx";

export const is2xx = <T>(factoryName = IS_2XX) => {
  return branch<HttpValue<T>, HttpValue<T>>(
    (response) => {
      return response !== null && typeof response === "object" &&
        Number.isSafeInteger(response.code) &&
        response.code !== null && response.code !== undefined &&
        response.code > 199 &&
        response.code < 300;
    },
    thru(),
    makeFailure((response) => {
      return makeReason(
        factoryName,
        `${response.code}: ${response.status}`,
        response,
      );
    }),
  );
};
