import {
  FactoryName,
  ValidTimeOption,
} from "./crockford-factories-utils/cockford-factories-misc.ts";
import { Scheduler } from "../parseq-utilities/config.ts";
import { parallelInternal } from "./crockford-factories-utils/parallel-internal.ts";
import {
  AsRequestors,
  AsSameMessages,
  ElementOf,
  First,
  Message,
  ResultsOf,
  ValuesOf,
} from "./crockford-factories-utils/crockford-factories-types.ts";
import { ParallelInteralSpec } from "./crockford-factories-utils/parallel-internal.ts";
import { Requestor } from "../types.d.ts";

type FirstMessage<Requireds, Optionals> = Message<
  First<[...AsRequestors<Requireds, any>, ...AsRequestors<Optionals, any>]>
>;

type AllRequestors<Requireds, Optionals, M> = [
  ...AsRequestors<Requireds, M>,
  ...AsRequestors<Optionals, M>,
];

export type ParallelSpec<Requireds, Optionals> = {
  timeOption?: ValidTimeOption;
  optionals?: AsSameMessages<Optionals, FirstMessage<Requireds, Optionals>>;
  timeLimit?: number;
  throttle?: number;
  scheduler?: Scheduler;
  safeRecursionMode?: boolean;
};

/**
 * A very general tool for running requestors in "parallel".
 * Since JavaScript uses an event loop this is not true parallelism (this is
 * analagous to promise.all/promise.allSettled).
 * Unlike any or all, an array of required requestors and an array of optional
 * requestors can be provided. The requestor only succeeds if every required
 * requestor succeeds, and may succeed if some optionals fail. A timeOption can
 * be provided to determine how optional requestors are handled if when the
 * requestors complete (you may terminate the parallel early, for example).
 */
export const parallel = <Requireds, Optionals>(
  necessetiesOrSpec:
    | AsSameMessages<Requireds, FirstMessage<Requireds, Optionals>>
    | ParallelSpec<Requireds, Optionals>,
  spec?: ParallelSpec<Requireds, Optionals>,
): Requestor<
  FirstMessage<Requireds, Optionals>,
  ResultsOf<
    AllRequestors<Requireds, Optionals, FirstMessage<Requireds, Optionals>>
  >
> => {
  type M = FirstMessage<Requireds, Optionals>;

  type Requestors = AllRequestors<Requireds, Optionals, M>;

  let internalSpec: ParallelInteralSpec<M, ElementOf<ValuesOf<Requestors>>>;

  if (Array.isArray(necessetiesOrSpec)) {
    internalSpec = spec !== null && typeof spec === "object" ? spec : {};
  } else {
    internalSpec = necessetiesOrSpec;
  }

  internalSpec.factoryName = FactoryName.PARALLEL;

  return parallelInternal<M, ValuesOf<Requestors>>(
    necessetiesOrSpec,
    internalSpec,
  ) as Requestor<M, ResultsOf<Requestors>>;
};
