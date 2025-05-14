import { race } from "../crockford-factories/race.ts";
import { asObject } from "../parseq-utilities/parseq-utilities-misc.ts";
import { looper } from "./control-flow-utils/looper.js";

const REPEAT = "repeat";

export const repeat = (requestor, spec) => {
  const {
    timeLimit,
    safeRecursionMode,
    scheduler,
    maxAttempts,
  } = asObject(spec);

  return race([
    looper({
      requestor,
      safeRecursionMode,
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
  });
};
