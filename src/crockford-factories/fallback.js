import { __factoryName__, FactoryName } from "./crockford-factories-utils/misc.js";
import { race } from "./race.js";

export const fallback = (requestors, spec = {}) => {
  const {
    timeLimit,
    scheduler,
    safeRecursionMode
  } = spec;

  return race(requestors, {
    timeLimit,
    throttle: 1,
    scheduler,
    safeRecursionMode,
    [__factoryName__]: FactoryName.FALLBACK
  });
};
