import {
  __factoryName__,
  FactoryName,
  TimeOption,
} from "./crockford-factories-utils/misc.js";
import { parallel } from "./parallel.js";

export const sequence = (requestors, spec = {}) => {
  const { timeLimit, scheduler, safeRecursionMode } = spec;

  return parallel(requestors, {
    timeLimit,
    timeOption: TimeOption.SKIP_OPTIONALS_IF_TIME_REMAINS,
    throttle: 1,
    scheduler,
    safeRecursionMode,
    [__factoryName__]: FactoryName.SEQUENCE,
  });
};
