import { requestor } from "../parseq-utilities/requestor.js";
import {
  __factoryName__,
  allTimeOptions,
  checkRequestors,
  FactoryName,
  makeReason,
  TimeOption,
} from "./crockford-factories-utils/misc.js";
import { crockfordInternal } from "./crockford-factories-utils/crockford-internal.js";
import { makePotentialListener } from "../parseq-utilities/misc.js";

export const parallel = (necessetiesOrSpec, spec = {}) => {
  let necessities = [];

  if (
    !Array.isArray(necessetiesOrSpec) &&
    typeof necessetiesOrSpec === "object" && necessetiesOrSpec !== null
  ) {
    spec = necessetiesOrSpec;
  } else if (Array.isArray(necessetiesOrSpec)) {
    necessities = necessetiesOrSpec;
  } else {
    makeReason(
      FactoryName.PARALLEL,
      "necessitiesOrSpec must be an array of requestors or a ParallelSpec object",
      necessetiesOrSpec,
    );
  }

  const parallelSpec = spec;

  const {
    optionals,
    timeLimit,
    throttle,
    scheduler,
    safeRecursionMode,
  } = parallelSpec;

  const factoryName = parallelSpec[__factoryName__] || FactoryName.PARALLEL;

  let { timeOption = TimeOption.SKIP_OPTIONALS_IF_TIME_REMAINS } = spec;

  let requestors;

  if (necessities.length === 0) {
    if (
      optionals === undefined || optionals === null || optionals.length === 0
    ) {
      requestors = [];
    } else {
      requestors = optionals;
      timeOption = TimeOption.TRY_OPTIONALS_IF_TIME_REMAINS;
    }
  } else {
    if (
      optionals === undefined || optionals === null || optionals.length === 0
    ) {
      requestors = necessities;
      timeOption = allTimeOptions.SKIP_OPTIONALS_IF_TIME_REMAINS;
    } else {
      requestors = [...necessities, ...optionals];

      if (
        !allTimeOptions.some((option) => {
          return option === timeOption;
        })
      ) {
        throw makeReason(
          factoryName,
          "timeOption must be one of: ",
          allTimeOptions.join(", "),
          timeOption,
        );
      }
    }
  }

  let listener = checkRequestors(requestors, factoryName);

  if (factoryName === FactoryName.SEQUENCE) {
    listener = requestor.length > 0 && requestors[0].isListener;
  }

  const numberOfNecessities = necessities.length;

  return makePotentialListener(listener, (pass, fail, initialMessage) => {
    let numberPending = requestors.length;
    let numberPendingNecessities = numberOfNecessities;

    const results = [];

    if (numberPending === 0) {
      if (factoryName === FactoryName.SEQUENCE) {
        if (results.length === 0) {
          const { value, reason } = results.pop();

          (reason !== null && reason !== undefined)
            ? pass(value)
            : fail(reason);
        }
      } else {
        pass(results);
      }
      return;
    }

    const cancel = crockfordInternal({
      factoryName,
      requestors,
      initialMessage,
      internalAction(value, reason, requestorIndex) {
        results[requestorIndex] = { value, reason };

        numberPending--;

        if (requestorIndex < numberOfNecessities) {
          numberPendingNecessities--;

          if (reason !== undefined && reason !== null) {
            cancel(reason);
            fail(reason);
            return;
          }
        }

        if (
          numberPending < 1 ||
          (timeOption === TimeOption.SKIP_OPTIONALS_IF_TIME_REMAINS &&
            numberPendingNecessities < 1)
        ) {
          cancel(
            makeReason(
              factoryName,
              "All necessities are complete, optional requestors are being cancelled",
            ),
          );

          if (factoryName === FactoryName.SEQUENCE) {
            if (results.length === 0) {
              fail(makeReason(factoryName, "No requestors provided!"));
            } else {
              const result = results.pop();
              result.reason !== undefined && result.reason !== null
                ? fail(result.reason)
                : pass(result.value);
            }
          } else {
            reason !== undefined && reason !== null
              ? fail(reason)
              : pass(results);
          }
        }
      },
      timeout() {
        const reason = makeReason(
          factoryName,
          "Time limit reached!",
          timeLimit,
        );

        if (timeOption === TimeOption.REQUIRE_NECESSITIES) {
          timeOption = TimeOption.SKIP_OPTIONALS_IF_TIME_REMAINS;
          if (numberPendingNecessities < 1) {
            cancel(reason);
            pass(results);
          }
        } else if (timeOption === TimeOption.TRY_OPTIONALS_IF_TIME_REMAINS) {
          cancel(reason);
          numberPendingNecessities < 1 ? pass(results) : fail(reason);
        }
      },
      timeLimit,
      throttle,
      scheduler,
      safeRecursionMode,
    });

    return cancel;
  });
};
