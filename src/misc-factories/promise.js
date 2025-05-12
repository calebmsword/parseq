import {
  exists,
  isCallable,
  isThenable,
  makePotentialListener,
} from "../parseq-utilities/misc.js";

const defaultGetCancellor = (abort) => {
  return (reason) => {
    abort(reason);
  };
};

/**
 * @param {(message?: any, signal?: AbortSignal) => void} getPromise
 * @param {{
 *  getSignal?: boolean,
 *  cancellable?: boolean,
 *  getCancellor?: (abort: (reason?: any) => void) => (reason?: any) => void
 * }} [spec]
 * @returns {Requestor}
 */
export const promise = (getPromise, spec) => {
  if (!isObject(spec)) {
    spec = {};
  }

  let {
    getsSignal = false,
    cancellable = true || getsSignal,
    getCancellor,
  } = spec;

  if (cancellable !== true && exists(getCancellor)) {
    throw new Error("do not provide getCancellor when cancellable is not true");
  } else if (exists(getCancellor) && !isCallable(getCancellor)) {
    throw new Error("getCancellor must be a cancellor factory", {
      cause: getCancellor,
    });
  } else if (cancellable === true && !exists(getCancellor)) {
    getCancellor = defaultGetCancellor;
  }

  if (!isCallable(getPromise)) {
    throw new Error("getPromise must be callable", { cause: getPromise });
  }

  return makePotentialListener(getPromise.length > 0, (pass, fail, message) => {
    let cancellor;
    let signal;

    new Promise((resolve, reject) => {
      if (cancellable === true) {
        let abort;

        if (getsSignal === true) {
          const controller = new AbortController();
          ({ signal, abort } = controller);
        } else {
          abort = reject;
        }

        cancellor = getCancellor(abort);
      }
      const newPromise = getPromise(message, signal);

      if (!isThenable(newPromise)) {
        throw new Error("getPromise did not return a thenable", {
          cause: newPromise,
        });
      }

      newPromise.then(resolve).catch(reject);
    }).then(pass).catch(fail);

    if (isCallable(cancellor)) {
      return cancellor;
    }
  });
};
