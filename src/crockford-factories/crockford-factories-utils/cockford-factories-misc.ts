import { isRequestor } from "../../parseq-utilities/requestor.ts";
import { exists } from "../../parseq-utilities/parseq-utilities-type-checking.ts";
import { Requestor } from "../../types.d.ts";

export const makeReason = (
  factoryName: string,
  excuse?: string,
  cause?: any,
) => {
  const excuseText = !exists(excuse) ? "" : `: ${excuse}`;
  return cause !== undefined && cause !== null
    ? new Error(`parseq.${factoryName}${excuseText}`, { cause })
    : new Error(`parseq.${factoryName}${excuseText}`);
};

/**
 * Ensures a given value is an array of requestors.
 * Returns true if any requestor is a listener.
 * @param {string} factoryName
 * Used for logging purposes. The message in the thrown error object will
 * contain the factoryName, which should indicate which requestor factory threw.
 */
export const checkRequestors = (
  requestors: Requestor<any, any>[],
  factoryName: string,
) => {
  if (!Array.isArray(requestors)) {
    throw makeReason(
      factoryName,
      "Expected an array of requestors",
      requestors,
    );
  }

  let listener = false;

  for (const requestor of requestors) {
    if (!isRequestor(requestor)) {
      throw makeReason(
        factoryName,
        "Expected an array of requestors, yet the array contained a non-requestor",
        requestors,
      );
    }
    if (!listener) {
      listener = requestor.isListener;
    }
  }

  return listener;
};

export const FactoryName = Object.freeze({
  SEQUENCE: "sequence",
  PARALLEL: "parallel",
  FALLBACK: "fallback",
  RACE: "race",
});

/**
 * Determines how the optional requestors are handled in `parallel`.
 * There are three keys in TimeOption:
 *
 *  - `"SKIP_OPTIONALS_IF_TIME_REMAINS"`: Any optionals which have not yet
 * finished by the time the required requestors finish are discarded. The
 * required requestors must finish before the time limit, if there is one.
 *  - `"TRY_OPTIONALS_IF_TIME_REMAINS"`: The required requestors and the
 * optional requestors must all finish before the time limit.
 *  - `"REQUIRE_NECESSITIES"`: The required requestors have no time limit. The
 * optional requestors must finish before the required finish and the time
 * limit, whichever is later.
 */
export const TimeOption = Object.freeze({
  SKIP_OPTIONALS_IF_TIME_REMAINS: "SKIP_OPTIONALS_IF_TIME_REMAINS",
  TRY_OPTIONALS_IF_TIME_REMAINS: "TRY_OPTIONALS_IF_TIME_REMAINS",
  REQUIRE_NECESSITIES: "REQUIRE_NECESSITIES",
});

export const allTimeOptions = Object.freeze(Object.values(TimeOption));

export type ValidTimeOption = typeof TimeOption[keyof typeof TimeOption];
