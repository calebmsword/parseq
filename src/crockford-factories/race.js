import { makePotentialListener } from "../parseq-utilities/misc.js";
import { crockfordInternal } from "./crockford-factories-utils/crockford-internal.js";
import {
  __factoryName__,
  checkRequestors,
  FactoryName,
  makeReason,
} from "./crockford-factories-utils/misc.js";

export const race = (requestors, spec = {}) => {
  const {
    timeLimit,
    throttle,
    scheduler,
    safeRecursionMode,
  } = spec;

  const factoryName = spec.factoryName || FactoryName.RACE;

  if (!Array.isArray(requestors) || requestors.length === 0) {
    throw makeReason(factoryName, "No requestors provided!", requestors);
  }

  const listener = checkRequestors(requestors, factoryName);

  let numberPending = requestors.length;

  return makePotentialListener(listener, (pass, fail, initialMessage) => {
    const cancel = crockfordInternal({
      factoryName,
      requestors,
      initialMessage,
      internalAction(value, reason, requestorIndex) {
        numberPending--;

        if (reason === undefined || reason === null) {
          cancel(makeReason(factoryName, "Cancelling losers!", requestorIndex));
          pass(value);
        } else if (numberPending < 1) {
          cancel(reason);
          fail(reason);
        }
      },
      timeout() {
        const reason = makeReason(factoryName, "Timeout occurred!", timeLimit);
        cancel(reason);
        fail(reason);
      },
      timeLimit,
      throttle,
      scheduler,
      safeRecursionMode,
    });
    return cancel;
  });
};
