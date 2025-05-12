import { isRequestor } from "../../parseq-utilities/requestor.js";
import { exists } from "../../parseq-utilities/misc.js";

export const makeReason = (factoryName, excuse, cause) => {
  const excuseText = !exists(excuse)
    ? ""
    : `: ${excuse}`;
  return cause !== undefined && cause !== null
    ? new Error(`parsec.${factoryName}${excuseText}`, { cause })
    : new Error(`parsec.${factoryName}${excuseText}`);
};

export const checkAction = (action, factoryName) => {
  if (
    typeof action !== "function" || action.length > 3
  ) {
    throw makeReason(
      factoryName,
      "A receiver must be a function of one argument!",
      action,
    );
  }
};

export const checkRequestors = (requestors, factoryName) => {
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

export const __factoryName__ = Symbol("factoryName");
