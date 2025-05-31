import {
  FactoryName,
} from "./crockford-factories-utils/cockford-factories-misc.ts";
import { Scheduler } from "../parseq-utilities/config.ts";
import {
  AsRequestors,
  AsSameMessages,
  First,
  Message,
} from "./crockford-factories-utils/crockford-factories-types.ts";
import { raceInternal } from "./crockford-factories-utils/race-internal.ts";

export type RaceInternalSpec = {
  timeLimit?: number;
  throttle?: number;
  scheduler?: Scheduler;
  safeRecursionMode?: boolean;
  factoryName?: string;
};

export type FirstMessage<Requestors> = Message<
  First<AsRequestors<Requestors, any>>
>;

/**
 * Succeeds with the value of the first successful requestor.
 * Failure only occurs if every requestor given fails.
 */
export type RaceSpec = {
  timeLimit?: number;
  throttle?: number;
  scheduler?: Scheduler;
  safeRecursionMode?: boolean;
};

export const race = <Requestors>(
  requestors: AsSameMessages<Requestors, FirstMessage<Requestors>>,
  spec?: RaceSpec,
) => {
  const raceSpec: RaceInternalSpec = spec !== null && typeof spec === "object"
    ? spec
    : {};
  raceSpec.factoryName = FactoryName.RACE;

  return raceInternal(requestors, raceSpec);
};
