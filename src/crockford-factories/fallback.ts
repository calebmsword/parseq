import { Scheduler } from "../parseq-utilities/config.ts";
import { Requestor } from "../parseq-utilities/requestor.ts";
import { FactoryName } from "./crockford-factories-utils/cockford-factories-misc.ts";
import { race } from "./race.ts";
import { First } from "./crockford-factories-utils/sequenceable.ts";

type Message<R> = R extends Requestor<infer M, unknown> ? M : unknown;

export type FallbackSpec = {
  timeLimit: number;
  scheduler: Scheduler;
  safeRecursionMode: boolean;
};

export const fallback = <Requestors, M = Message<First<Requestors>>>(
  requestors: Requestors extends Requestor<M, any>[] ? [...Requestors] : [],
  spec?: FallbackSpec,
) => {
  const {
    timeLimit,
    scheduler,
    safeRecursionMode,
  } = spec !== null && typeof spec === "object" ? spec : {};

  return race(requestors, {
    timeLimit,
    throttle: 1,
    scheduler,
    safeRecursionMode,
    factoryName: FactoryName.FALLBACK,
  });
};
