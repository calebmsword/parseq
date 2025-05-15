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
