import { requestor, Result } from "../../parseq-utilities/requestor.ts";
import {
  allTimeOptions,
  checkRequestors,
  FactoryName,
  makeReason,
  TimeOption,
  ValidTimeOption,
} from "../crockford-factories-utils/cockford-factories-misc.ts";
import { crockfordInternal } from "../crockford-factories-utils/crockford-internal.ts";
import {
  exists,
  makeListenerIf,
} from "../../parseq-utilities/parseq-utilities-misc.ts";
import { Requestor } from "../../parseq-utilities/requestor.ts";
import { Scheduler } from "../../parseq-utilities/config.ts";
import { Value } from "./crockford-test.ts";

type Last<T> = T extends [...unknown[], infer T] ? T : unknown;

export type ParallelInteralSpec<Message, Value> = {
  timeOption?: ValidTimeOption;
  optionals?: Requestor<Message, Value>[];
  timeLimit?: number;
  throttle?: number;
  scheduler?: Scheduler;
  safeRecursionMode?: boolean;
  factoryName?: string;
};

type Lookup<Array, n> = n extends keyof Array ? Array[n] : never;
type Messag<R> = R extends Requestor<infer M, unknown> ? M : unknown;

type ResultOf<Values extends any[]> = {
  [n in keyof Values]: Result<Value<Lookup<Values, n>>>;
};

export const parallelInternal = <
  Message,
  Values extends any[],
  Value = Values[keyof Values],
>(
  necessetiesOrSpec:
    | Requestor<Message, Value>[]
    | ParallelInteralSpec<Message, Value>,
  spec?: ParallelInteralSpec<Message, Value>,
): Requestor<Message, Result<Values>> | Requestor<Message, Last<Values>> => {
  let necessities: Requestor<Message, Value>[] = [];

  if (
    !Array.isArray(necessetiesOrSpec) &&
    typeof necessetiesOrSpec === "object" && necessetiesOrSpec !== null
  ) {
    spec = necessetiesOrSpec;
  } else if (Array.isArray(necessetiesOrSpec)) {
    necessities = necessetiesOrSpec;
  } else {
    throw makeReason(
      FactoryName.PARALLEL,
      "necessitiesOrSpec must be an array of requestors or a ParallelSpec object",
      necessetiesOrSpec,
    );
  }

  const parallelSpec = spec || {};

  let {
    factoryName = FactoryName.PARALLEL,
    timeOption = TimeOption.SKIP_OPTIONALS_IF_TIME_REMAINS,
    optionals,
    timeLimit,
    throttle,
    scheduler,
    safeRecursionMode,
  } = parallelSpec;

  let requestors: Requestor<Message, Value>[];

  if (necessities.length === 0) {
    if (
      optionals === undefined || optionals === null || optionals.length === 0
    ) {
      requestors = [];
    } else {
      requestors = optionals;
      timeOption = TimeOption.TRY_OPTIONALS_IF_TIME_REMAINS;
    }
  } else {
    if (
      optionals === undefined || optionals === null || optionals.length === 0
    ) {
      requestors = necessities;
      timeOption = TimeOption.SKIP_OPTIONALS_IF_TIME_REMAINS;
    } else {
      requestors = [...necessities, ...optionals];

      if (
        !allTimeOptions.some((option) => {
          return option === timeOption;
        })
      ) {
        throw makeReason(
          factoryName,
          "timeOption must be one of: " + allTimeOptions.join(", "),
          timeOption,
        );
      }
    }
  }

  let listener = checkRequestors(requestors, factoryName);

  if (factoryName === FactoryName.SEQUENCE) {
    listener = requestor.length > 0 && requestors[0].isListener;
  }

  const numberOfNecessities = necessities.length;

  return makeListenerIf<Message, Result<Values> | Last<Values>>(
    listener,
    (pass, fail, initialMessage) => {
      let numberPending = requestors.length;
      let numberPendingNecessities = numberOfNecessities;

      const results: Result<Value>[] = [];

      if (numberPending === 0) {
        if (factoryName === FactoryName.SEQUENCE) {
          const result = results.pop();

          if (result === undefined) {
            fail(makeReason(factoryName, "No requestors provided!"));
            return;
          }

          const { value, reason } = result;

          exists(reason) ? fail(reason) : pass(value as Last<Values>);
        } else {
          pass(results as Result<Values>);
        }
        return;
      }

      const cancel = crockfordInternal<Value, Values | Last<Values>>({
        factoryName,
        requestors,
        initialMessage,
        internalAction(value, reason, requestorIndex) {
          results[requestorIndex] = { value: value as Value, reason };

          numberPending--;

          if (requestorIndex < numberOfNecessities) {
            numberPendingNecessities--;

            if (reason !== undefined && reason !== null) {
              cancel(reason);
              fail(reason);
              return;
            }
          }

          if (
            numberPending < 1 ||
            (timeOption === TimeOption.SKIP_OPTIONALS_IF_TIME_REMAINS &&
              numberPendingNecessities < 1)
          ) {
            cancel(
              makeReason(
                factoryName,
                "All necessities are complete, optional requestors are being cancelled",
              ),
            );

            if (factoryName === FactoryName.SEQUENCE) {
              const result = results.pop();
              if (result === undefined) {
                fail(makeReason(factoryName, "No requestors provided!"));
              } else {
                exists(reason)
                  ? fail(result.reason)
                  : pass(result.value as Last<Values>);
              }
            } else {
              exists(reason) ? fail(reason) : pass(results as Result<Values>);
            }
          }
        },
        timeout() {
          const reason = makeReason(
            factoryName,
            "Time limit reached!",
            timeLimit,
          );

          if (timeOption === TimeOption.REQUIRE_NECESSITIES) {
            timeOption = TimeOption.SKIP_OPTIONALS_IF_TIME_REMAINS;
            if (numberPendingNecessities < 1) {
              cancel(reason);
              pass(results as Result<Values>);
            }
          } else if (timeOption === TimeOption.TRY_OPTIONALS_IF_TIME_REMAINS) {
            cancel(reason);
            numberPendingNecessities < 1
              ? pass(results as Result<Values>)
              : fail(reason);
          }
        },
        timeLimit,
        throttle,
        scheduler,
        safeRecursionMode,
      });

      return cancel;
    },
  );
};
