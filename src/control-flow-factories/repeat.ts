import { raceInternal } from "../crockford-factories/crockford-factories-utils/race-internal.ts";
import { Scheduler } from "../parseq-utilities/config.ts";
import { looper } from "./control-flow-utils/looper.ts";
import { Requestor } from "../types.d.ts";

const REPEAT = "repeat";

export type RepeatSpec = {
  timeLimit?: number;
  eachTryOnNewTick?: boolean,
  safeRecursionMode?: boolean;
  scheduler?: Scheduler;
  maxAttempts?: number;
};

/**
 * Repeatedly run the given requestor until it succeeds.
 * The message given to this requestor on the first try is the message used for
 * each try. 
 */
export const repeat = <M, V>(
  requestor: Requestor<M, V>,
  spec?: RepeatSpec,
): Requestor<M, V> => {
  const {
    timeLimit,
    eachTryOnNewTick,
    safeRecursionMode,
    scheduler,
    maxAttempts,
  } = spec !== null && typeof spec === "object" ? spec : {};

  return raceInternal([
    looper({
      requestor: requestor as Requestor<M | V, V>,
      eachTryOnNewTick,
      scheduler,
      maxAttempts,
      tryAgainOnFail: true,
      propogateOnRepeat: false,
      factoryName: REPEAT,
    }),
  ], {
    timeLimit,
    safeRecursionMode,
    scheduler,
    factoryName: REPEAT,
  }) as Requestor<M, V>;
};
