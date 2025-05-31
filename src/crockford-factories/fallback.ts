import { Scheduler } from "../parseq-utilities/config.ts";
import { FactoryName } from "./crockford-factories-utils/cockford-factories-misc.ts";
import { raceInternal } from "./crockford-factories-utils/race-internal.ts";
import {
  AsRequestors,
  AsSameMessages,
  First,
  Message,
} from "./crockford-factories-utils/crockford-factories-types.ts";

export type FallbackSpec = {
  timeLimit: number;
  scheduler: Scheduler;
  safeRecursionMode: boolean;
};

/**
 * Executes the given requestors in order until one succeeds.
 * Failure occurs only if all requestors fail.
 */
export const fallback = <Requestors>(
  requestors: AsSameMessages<
    Requestors,
    Message<First<AsRequestors<Requestors, any>>>
  >,
  spec?: FallbackSpec,
) => {
  const {
    timeLimit,
    scheduler,
    safeRecursionMode,
  } = spec !== null && typeof spec === "object" ? spec : {};

  return raceInternal(requestors, {
    timeLimit,
    throttle: 1,
    scheduler,
    safeRecursionMode,
    factoryName: FactoryName.FALLBACK,
  });
};
