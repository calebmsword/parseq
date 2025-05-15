import { CrockfordRequestor } from "../types.d.ts";
import { Cancellor } from "../types.d.ts";
import {
  exists,
  isCallable,
  makeUnspecifiedReason,
} from "./parseq-utilities-misc.ts";

export type Result<V> = { value?: V; reason?: unknown };

export type Receiver<V> = (result: Result<V>) => void;

const store = new WeakSet();

export const CROCKFORD_REQUESTOR = Symbol("CROCKFORD_REQUESTOR");

export class Requestor<M, V> {
  private [CROCKFORD_REQUESTOR]: CrockfordRequestor<M, V>;

  #listener: boolean;

  constructor(crockfordRequestor: CrockfordRequestor<M, V>) {
    this[CROCKFORD_REQUESTOR] = crockfordRequestor;
    this.#listener = crockfordRequestor.length === 2;
    Object.freeze(this);
  }

  get isListener() {
    return this.#listener;
  }

  run(spec: {
    message?: M;
    receiver?: Receiver<V>;
    success?: (value: V) => void;
    error?: (reason: any) => void;
  }) {
    let { message, receiver, success, error } = typeof spec === "object"
      ? spec
      : { success() {} };

    if (typeof receiver === "function") {
      if (receiver.length !== 1) {
        throw new Error("Receiver must be a function of one argument");
      }

      if (exists(success) || exists(error)) {
        throw new Error(
          "If you provide a receiver, you cannot also provide a success or error callback!",
        );
      }
    } else if (typeof success !== "function") {
      success = () => {};
    } else {
      receiver = ({ value, reason }) => {
        if (exists(reason)) {
          isCallable(error) ? error?.call(this, reason) : undefined;
        } else {
          success?.call(this, value as V);
        }
      };
    }

    return this[CROCKFORD_REQUESTOR](
      receiver as (result: { value: V; reason: any }) => void,
      message as M,
    );
  }
}

Object.freeze(Requestor);
Object.freeze(Requestor.prototype);

const getTryReceiver = <V>(receiver: Receiver<V>): Receiver<V> => {
  let allowReceiver = true;

  return (result: Result<V>) => {
    if (!allowReceiver) {
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

const getFail = <V>(tryReceiver: Receiver<V>) => {
  return (reason: any) => {
    if (!exists(reason)) {
      reason = makeUnspecifiedReason();
    }
    tryReceiver({ reason });
  };
};

export type Action<M, V> = (
  pass: (value: V) => void,
  fail: (reason: any) => void,
  message: M,
) => Cancellor | void;

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
