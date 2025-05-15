import { makeFailure } from "../misc-factories/make-failure.ts";
import { branch } from "../control-flow-factories/branch.ts";
import { thru } from "../misc-factories/thru.ts";
import { HttpValue } from "./http-factories-utils/http-types.ts";

export const is2xx = <T>() => {
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
      return new Error(`${response.code}: ${response.status}`, {
        cause: response,
      });
    }),
  );
};
