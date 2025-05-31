import {
  AllHaveSameMessages,
  AsRequestors,
  ElementOf,
  First,
  Message,
  ResultsOf,
  ValuesOf,
} from "../crockford-factories/crockford-factories-utils/crockford-factories-types.ts";
import {
  ParallelInteralSpec,
  parallelInternal,
} from "../crockford-factories/crockford-factories-utils/parallel-internal.ts";
import { Scheduler } from "../parseq-utilities/config.ts";
import { Requestor } from "../types.d.ts";

const ANY = "ANY";

export type AnySpec = {
  timeLimit?: number;
  throttle?: number;
  scheduler?: Scheduler;
  safeRecursionMode?: boolean;
  factoryName?: string;
};

/**
 * Takes an array of requestors and returns an array of results.
 * Individually failing requestors do not cause the any to fail. The resultant
 * array will contain Result objects representing a success or failure.
 */
export const any = <Requestors>(
  requestors: AllHaveSameMessages<Requestors>,
  spec?: AnySpec,
) => {
  type M = Message<First<Requestors>>;

  type TypedRequestors = AsRequestors<Requestors, M>;

  const internalSpec: ParallelInteralSpec<
    M,
    ElementOf<ValuesOf<TypedRequestors>>
  > = spec !== null && typeof spec === "object" ? spec : {};

  internalSpec.optionals = requestors;
  internalSpec.factoryName = ANY;

  return parallelInternal<M, ValuesOf<TypedRequestors>>(
    internalSpec,
  ) as Requestor<M, ResultsOf<TypedRequestors>>;
};
