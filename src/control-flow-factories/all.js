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

/**
 * Takes an array of requestors and succeeds if every requestor succeeds.
 * On success, the value is a read-only array of every successful value. On
 * failure, the reason is an error object whose cause is an array of every
 * reason.
 * This is implemented as a wrapper around parseq.parallel.
 * @param {*} necessetiesOrSpec
 * @param {*} spec
 * @returns
 */
export const all = (necessetiesOrSpec, spec) => {
  return sequence([
    parallel(necessetiesOrSpec, spec),
    branch(
      allSuccessful,
      map((results) => {
        return Object.freeze(results.map(getSuccess));
      }),
      makeFailure((results) => {
        return new Error("at least one requestor in tuple failed", {
          cause: results.map(getFailure),
        });
      }),
    ),
  ]);
};
