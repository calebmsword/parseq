import { Scheduler } from "../parseq-utilities/config.ts";
import { Requestor } from "../parseq-utilities/requestor.ts";
import {
  FactoryName,
  TimeOption,
} from "./crockford-factories-utils/cockford-factories-misc.ts";
import { parallelInternal } from "./crockford-factories-utils/parallel-internal.ts";
import {
  First,
  Last,
  Message,
  Sequenceable,
  Value,
} from "./crockford-factories-utils/sequenceable.ts";

export type SequenceSpec = {
  timeLimit?: number;
  scheduler?: Scheduler;
  safeRecursionMode?: boolean;
};

export const sequence = <Requestors extends Requestor<any, any>[]>(
  requestors: Sequenceable<Requestors>,
  spec?: SequenceSpec,
): Requestor<
  Message<First<Requestors>>,
  Value<Last<Requestors>>
> => {
  const { timeLimit, scheduler, safeRecursionMode } =
    spec !== null && typeof spec === "object" ? spec : {};

  return parallelInternal(requestors, {
    timeLimit,
    timeOption: TimeOption.SKIP_OPTIONALS_IF_TIME_REMAINS,
    throttle: 1,
    scheduler,
    safeRecursionMode,
    factoryName: FactoryName.SEQUENCE,
  }) as Requestor<
    Message<First<Requestors>>,
    Value<Last<Requestors>>
  >;
};
