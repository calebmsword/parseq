import { Action, Receiver, Result } from "../types.d.ts";
import { getLogger } from "./config.ts";
import { exists, isCallable } from "./parseq-utilities-type-checking.ts";
import { Requestor } from "./requestor-class.ts";

const getTryReceiver = <V>(receiver: Receiver<V>): Receiver<V> => {
  let allowReceiver = true;

  return (result: Result<V>) => {
    if (!allowReceiver) {
      if (exists(result.reason) && result.reason instanceof Error) {
        const logger = getLogger();
        logger.warn(
          "\nWARNING: A reciever that was already called was called in a " +
            "failure state. This likely occurred from an uncaught error thrown " +
            'in the "success", "error", or "receiver" callback given to a run ' +
            "method.\n",
          result.reason,
        );
      }
      return;
    }
    allowReceiver = false;
    receiver(result);
  };
};

const getPass = <V>(tryReceiver: Receiver<V>) => {
  return (value: V) => {
    tryReceiver({ value });
  };
};

export const makeUnspecifiedReason = () => {
  return new Error(
    "Unspecified failure. (This occurs when nullish reason is used as a failed result.)",
  );
};

const getFail = <V>(tryReceiver: Receiver<V>) => {
  return (reason: any) => {
    if (!exists(reason)) {
      reason = makeUnspecifiedReason();
    }
    tryReceiver({ reason });
  };
};

const store = new WeakSet();

export const requestor = <M, V>(action: Action<M, V>) => {
  if (!isCallable(action) || action.length > 3) {
    throw new Error("Action must be a function of up to three arguments");
  }

  const newRequestor = action.length === 3
    ? new Requestor<M, V>((receiver, message) => {
      const tryReceiver = getTryReceiver(receiver as Receiver<V>);
      const fail = getFail(tryReceiver);

      try {
        const cancellor = action(
          getPass(tryReceiver as Receiver<V>),
          fail,
          message,
        );
        if (isCallable(cancellor)) {
          return cancellor;
        }
      } catch (reason) {
        fail(reason);
      }
    })
    : new Requestor<M, V>((receiver) => {
      const tryReceiver = getTryReceiver(receiver as Receiver<V>);
      const fail = getFail(tryReceiver);

      try {
        const cancellor = action(getPass(tryReceiver), fail, undefined as M);
        if (isCallable(cancellor)) {
          return cancellor;
        }
      } catch (reason) {
        fail(reason);
      }
    });

  store.add(newRequestor);

  return newRequestor;
};

export const isRequestor = (value: any) => {
  return store.has(value);
};
