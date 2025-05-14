import { Result } from "../parseq-utilities/requestor.ts";
import { ValidTimeOption } from "./crockford-factories-utils/cockford-factories-misc.ts";
import { Requestor } from "../parseq-utilities/requestor.ts";
import { Scheduler } from "../parseq-utilities/config.ts";
import { parallelInternal } from "./crockford-factories-utils/parallel-internal.ts";
import { First, Value } from "./crockford-factories-utils/sequenceable.ts";

type Lookup<Array, n> = n extends keyof Array ? Array[n] : never;
type Message<R> = R extends Requestor<infer M, unknown> ? M : unknown;

type ResultsOf<Values extends any[]> = {
  [n in keyof Values]: Result<Value<Lookup<Values, n>>>;
};

type ValuesOf<Requestors> = {
  [n in keyof Requestors]: Value<Lookup<Requestors, n>>;
};

export const parallel = <
  Requireds,
  Optionals,
  M = Message<First<Requireds>>,
>(
  necessetiesOrSpec: Requireds extends Requestor<M, any>[] ? [...Requireds]
    :
      | []
      | {
        timeOption?: ValidTimeOption;
        optionals?: Optionals extends Requestor<M, any>[] ? [...Optionals]
          : [];
        timeLimit?: number;
        throttle?: number;
        scheduler?: Scheduler;
        safeRecursionMode?: boolean;
        factoryName?: string;
      },
  spec?: {
    timeOption?: ValidTimeOption;
    optionals?: Optionals extends Requestor<M, any>[] ? [...Optionals]
      : [];
    timeLimit?: number;
    throttle?: number;
    scheduler?: Scheduler;
    safeRecursionMode?: boolean;
    factoryName?: string;
  },
): Requestor<
  M,
  ResultsOf<
    [
      ...(Requireds extends Requestor<M, any>[] ? [...Requireds]
        : []),
      ...(Optionals extends Requestor<M, any>[] ? [...Optionals]
        : []),
    ]
  >
> => {
  return parallelInternal<
    M,
    ValuesOf<[
      ...(Requireds extends Requestor<M, any>[] ? [...Requireds]
        : []),
      ...(Optionals extends Requestor<M, any>[] ? [...Optionals]
        : []),
    ]>
  >(necessetiesOrSpec, spec) as Requestor<
    M,
    ResultsOf<
      [
        ...(Requireds extends Requestor<M, any>[] ? [...Requireds]
          : []),
        ...(Optionals extends Requestor<M, any>[] ? [...Optionals]
          : []),
      ]
    >
  >;
};
