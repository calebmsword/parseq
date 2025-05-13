import { __factoryName__ } from "../crockford-factories/crockford-factories-utils/misc.js";
import { race } from "../crockford-factories/race.js";
import { asObject } from "../parseq-utilities/misc.js";
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
