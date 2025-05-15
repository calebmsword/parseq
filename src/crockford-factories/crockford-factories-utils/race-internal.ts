import { makeListenerIf } from "../../parseq-utilities/parseq-utilities-misc.ts";
import {
  checkRequestors,
  FactoryName,
  makeReason,
} from "./cockford-factories-misc.ts";
import {
  AsSameMessages,
  ElementOf,
  Lookup,
  ValuesOf,
} from "./crockford-factories-types.ts";
import { crockfordInternal } from "./crockford-internal.ts";
import { FirstMessage, RaceInternalSpec } from "../race.ts";

export const raceInternal = <Requestors>(
  requestors: AsSameMessages<Requestors, FirstMessage<Requestors>>,
  spec?: RaceInternalSpec,
) => {
  const {
    timeLimit,
    throttle,
    scheduler,
    safeRecursionMode,
  } = spec !== null && typeof spec === "object" ? spec : {};

  const factoryName = spec?.factoryName || FactoryName.RACE;

  if (!Array.isArray(requestors) || requestors.length === 0) {
    throw makeReason(factoryName, "No requestors provided!", requestors);
  }

  const listener = checkRequestors(requestors, factoryName);

  let numberPending = requestors.length;

  return makeListenerIf<
    FirstMessage<Requestors>,
    ElementOf<ValuesOf<Requestors>>
  >(
    listener,
    (pass, fail, initialMessage) => {
      const cancel = crockfordInternal({
        factoryName,
        requestors,
        initialMessage,
        internalAction(value, reason, requestorIndex) {
          numberPending--;

          if (reason === undefined || reason === null) {
            cancel(
              makeReason(factoryName, "Cancelling losers!", requestorIndex),
            );
            pass(value as Lookup<ValuesOf<Requestors>, number>);
          } else if (numberPending < 1) {
            cancel(reason);
            fail(reason);
          }
        },
        timeout() {
          const reason = makeReason(
            factoryName,
            "Timeout occurred!",
            timeLimit,
          );
          cancel(reason);
          fail(reason);
        },
        timeLimit,
        throttle,
        scheduler,
        safeRecursionMode,
      });
      return cancel;
    },
  );
};
