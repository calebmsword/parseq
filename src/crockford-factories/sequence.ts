import { Scheduler } from "../parseq-utilities/config.ts";
import {
  FactoryName,
  TimeOption,
} from "./crockford-factories-utils/cockford-factories-misc.ts";
import { parallelInternal } from "./crockford-factories-utils/parallel-internal.ts";
import {
  AsSequenceable,
  First,
  Last,
  Message,
  Value,
} from "./crockford-factories-utils/crockford-factories-types.ts";
import { Requestor } from "../types.d.ts";

export type SequenceSpec = {
  timeLimit?: number;
  scheduler?: Scheduler;
  safeRecursionMode?: boolean;
};

/**
 * Performs the given requestors one after another.
 * The value of a successful requestor is given as the message to the next.
 * Failure occurs if any requestor fails.
 */
export const sequence = <Requestors extends Requestor<any, any>[]>(
  requestors: AsSequenceable<Requestors>,
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
