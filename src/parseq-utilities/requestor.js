import { exists, isCallable, isObject, makeUnspecifiedReason } from "./misc.js";

const store = new WeakSet();

export const CROCKFORD_REQUESTOR = Symbol("CROCKFORD_REQUESTOR");

class Requestor {
  [CROCKFORD_REQUESTOR];

  #listener;

  constructor(crockfordRequestor) {
    this[CROCKFORD_REQUESTOR] = crockfordRequestor;
    this.#listener = crockfordRequestor.length === 2;
    Object.freeze(this);
  }

  get isListener() {
    return this.#listener;
  }

  run(spec) {
    let { message, receiver, success, error } = isObject(spec)
      ? spec
      : { success() {} };

    if (isCallable(receiver)) {
      if (receiver.length !== 1) {
        throw new Error("Receiver must be a function of one argument");
      }

      if (exists(success) || exists(error)) {
        throw new Error(
          "If you provide a receiver, you cannot also provide a success or error callback!",
        );
      }
    } else if (!isCallable(success)) {
      success = () => {};
    } else {
      receiver = ({ value, reason }) => {
        if (exists(reason)) {
          isCallable(error) ? error.call(this, reason) : undefined;
        } else {
          success.call(this, value);
        }
      };
    }

    return this[CROCKFORD_REQUESTOR](receiver, message);
  }
}

Object.freeze(Requestor);
Object.freeze(Requestor.prototype);

const getTryReceiver = (receiver) => {
  let allowReceiver = true;

  return (result) => {
    if (!allowReceiver) {
      return;
    }
    allowReceiver = false;
    receiver(result);
  };
};

const getPass = (tryReceiver) => {
  return (value) => {
    tryReceiver({ value });
  };
};

const getFail = (tryReceiver) => {
  return (reason) => {
    if (!exists(reason)) {
      reason = makeUnspecifiedReason();
    }
    tryReceiver({ reason });
  };
};

export const requestor = (action) => {
  if (!isCallable(action) || action.length > 3) {
    throw new Error("Action must be a function of up to three arguments");
  }

  const newRequestor = action.length === 3
    ? new Requestor((receiver, message) => {
      const tryReceiver = getTryReceiver(receiver);
      const fail = getFail(tryReceiver);

      try {
        const cancellor = action(getPass(tryReceiver), fail, message);
        if (isCallable(cancellor)) {
          return cancellor;
        }
      } catch (reason) {
        fail(reason);
      }
    })
    : new Requestor((receiver) => {
      const tryReceiver = getTryReceiver(receiver);
      const fail = getFail(tryReceiver);

      try {
        const cancellor = action(getPass(tryReceiver), fail);
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

export const isRequestor = (value) => {
  return store.has(value);
};
