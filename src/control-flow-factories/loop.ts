import { raceInternal } from "../crockford-factories/crockford-factories-utils/race-internal.ts";
import { Scheduler } from "../parseq-utilities/config.ts";
import { looper } from "./control-flow-utils/looper.ts";
import { Requestor } from "../types.d.ts";
import { isCallable } from "../parseq-utilities/parseq-utilities-type-checking.ts";
import { makeReason } from "../crockford-factories/crockford-factories-utils/cockford-factories-misc.ts";

const LOOP = "loop";

export type LoopSpec<V> = {
  until: (result: V) => boolean;
  timeLimit?: number;
  eachTryOnNewTick?: boolean;
  safeRecursionMode?: boolean;
  scheduler?: Scheduler;
  maxAttempts?: number;
};

/**
 * Repeatedly run the given requestor until its result satisfies a condition.
 * This requestor differs from repeat in two signficant ways. 1) if any
 * iteration fails, the loop fails 2) on repeated iterations, the result of the
 * given requestor is then used as its message.
 * In other words, this requestor repeatedly performs an operation on the given
 * message until that message satisfies a particular constraint.
 */
export const loop = <V>(requestor: Requestor<V, V>, spec: LoopSpec<V>) => {
  const {
    until,
    eachTryOnNewTick,
    timeLimit,
    safeRecursionMode,
    scheduler,
    maxAttempts,
  } = spec;

  if (!isCallable(until)) {
    throw makeReason(
      LOOP,
      "until must be a function that takes a message and returns a boolean",
      until,
    );
  }

  return raceInternal([
    looper({
      until,
      requestor,
      eachTryOnNewTick,
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
