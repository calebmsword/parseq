import { makeListenerIf } from "../parseq-utilities/parseq-utilities-misc.ts";
import { crockfordInternal } from "./crockford-factories-utils/crockford-internal.ts";
import {
  checkRequestors,
  FactoryName,
  makeReason,
} from "./crockford-factories-utils/cockford-factories-misc.ts";
import { Scheduler } from "../parseq-utilities/config.ts";
import { Requestor } from "../parseq-utilities/requestor.ts";
import { First } from "./crockford-factories-utils/sequenceable.ts";
import { Value } from "./crockford-factories-utils/crockford-test.ts";

type Lookup<Array, n> = n extends keyof Array ? Array[n] : never;
type Message<R> = R extends Requestor<infer M, unknown> ? M : unknown;

type ValuesOf<Requestors> = {
  [n in keyof Requestors]: Value<Lookup<Requestors, n>>;
};

type RaceSpec = {
  timeLimit?: number;
  throttle?: number;
  scheduler?: Scheduler;
  safeRecursionMode?: boolean;
  factoryName?: string;
};

export const race = <Requestors, M = Message<First<Requestors>>>(
  requestors: Requestors extends Requestor<M, any>[] ? [...Requestors] : [],
  spec?: RaceSpec,
) => {
  const {
    timeLimit,
    throttle,
    scheduler,
    safeRecursionMode,
  } = spec !== null && typeof spec === "object" ? spec : {};

  const factoryName = FactoryName.RACE;

  if (!Array.isArray(requestors) || requestors.length === 0) {
    throw makeReason(factoryName, "No requestors provided!", requestors);
  }

  const listener = checkRequestors(requestors, factoryName);

  let numberPending = requestors.length;

  return makeListenerIf<M, Lookup<ValuesOf<Requestors>, number>>(listener, (pass, fail, initialMessage) => {
    const cancel = crockfordInternal({
      factoryName,
      requestors,
      initialMessage,
      internalAction(value, reason, requestorIndex) {
        numberPending--;

        if (reason === undefined || reason === null) {
          cancel(makeReason(factoryName, "Cancelling losers!", requestorIndex));
          pass(value as Lookup<ValuesOf<Requestors>, number>);
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
