import { raceInternal } from "../crockford-factories/crockford-factories-utils/race-internal.ts";
import { Scheduler } from "../parseq-utilities/config.ts";
import { looper } from "./control-flow-utils/looper.ts";
import { Requestor } from "../types.d.ts";

const LOOP = "loop";

export type LoopSpec<V> = {
  until: (result: V) => boolean;
  timeLimit?: number;
  safeRecursionMode?: boolean;
  scheduler?: Scheduler;
  maxAttempts?: number;
};

export const loop = <V>(requestor: Requestor<V, V>, spec: LoopSpec<V>) => {
  const {
    until,
    timeLimit,
    safeRecursionMode,
    scheduler,
    maxAttempts,
  } = spec;

  return raceInternal([
    looper({
      until,
      requestor,
      safeRecursionMode,
      scheduler,
      maxAttempts,
      tryAgainOnFail: false,
      propogateOnRepeat: true,
      factoryName: LOOP,
    }),
  ], {
    timeLimit,
    safeRecursionMode,
    scheduler,
    factoryName: LOOP,
  }) as Requestor<V, V>;
};
