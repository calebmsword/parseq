import { race } from "../crockford-factories/race.ts";
import { asObject } from "../parseq-utilities/parseq-utilities-misc.ts";
import { looper } from "./control-flow-utils/looper.js";

const LOOP = "loop";

export const loop = (requestor, spec) => {
  const {
    until,
    timeLimit,
    safeRecursionMode,
    scheduler,
    maxAttempts,
  } = asObject(spec);

  return race([
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
  });
};
