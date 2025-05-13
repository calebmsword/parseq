import { parallel } from "../crockford-factories/parallel.js";
import { sequence } from "../crockford-factories/sequence.js";
import {
  allSuccessful,
  getFailure,
  getSuccess,
} from "../parseq-utilities/misc.js";
import { branch } from "./branch.js";
import { makeFailure } from "../misc-factories/make-failure.js";
import { map } from "../misc-factories/map.js";
import { makeReason } from "../crockford-factories/crockford-factories-utils/misc.js";

const ALL = "ALL";

/**
 * Takes an array of requestors and succeeds if every requestor succeeds.
 * On success, the value is a read-only array of every successful value. On
 * failure, the reason is an error object whose cause is an array of every
 * reason.
 * This is implemented as a wrapper around parseq.parallel.
 * @param {*} necesseties
 * @param {*} spec
 * @returns
 */
export const all = (necesseties, spec) => {
  return sequence([
    parallel(necesseties, spec),
    branch(
      allSuccessful,
      map((results) => {
        return Object.freeze(results.map(getSuccess));
      }),
      makeFailure((results) => {
        return makeReason(
          ALL,
          "at least one requestor failed",
          results.map(getFailure),
        );
      }),
    ),
  ]);
};
