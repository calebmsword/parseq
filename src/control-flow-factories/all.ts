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
import { sequence } from "../crockford-factories/sequence.ts";
import { map } from "../misc-factories/map.ts";
import { Scheduler } from "../parseq-utilities/config.ts";
import { Requestor } from "../types.d.ts";

const ALL = "ALL";

type AllSpec = {
  timeLimit?: number;
  throttle?: number;
  scheduler?: Scheduler;
  safeRecursionMode?: boolean;
  factoryName?: string;
};

/**
 * Takes an array of requestors and succeeds if every requestor succeeds.
 * On success, the value is a read-only array of every successful value. On
 * failure, the reason is an error object whose cause is an array of every
 * reason.
 * This is implemented as a wrapper around parseq.parallel.
 * @param {*} necesseties
 * @param {*} [spec]
 * @returns
 */
export const all = <Requestors>(
  necesseties: AllHaveSameMessages<Requestors>,
  spec?: AllSpec,
) => {
  type M = Message<First<Requestors>>;

  type TypedRequestors = AsRequestors<Requestors, M>;

  const newSpec: ParallelInteralSpec<M, ElementOf<ValuesOf<TypedRequestors>>> =
    spec !== null && typeof spec === "object" ? spec : {};
  newSpec.optionals = undefined;
  newSpec.factoryName = ALL;

  return sequence([
    parallelInternal(necesseties, newSpec) as Requestor<
      M,
      ResultsOf<TypedRequestors>
    >,
    map((results: ResultsOf<TypedRequestors>) => {
      return results.map(({ value }) => {
        return value;
      }) as [...ValuesOf<TypedRequestors>];
    }),
  ]);
};

