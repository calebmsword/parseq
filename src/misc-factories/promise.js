import { makeReason } from "../crockford-factories/crockford-factories-utils/misc.js";
import {
  exists,
  isCallable,
  isThenable,
  makePotentialListener,
} from "../parseq-utilities/misc.js";

const PROMISE = "promise";

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
    takesSignal = false,
    getCancellor,
  } = spec;

  if (takesSignal !== true && exists(getCancellor)) {
    throw makeReason(
      PROMISE,
      "do not provide getCancellor when getsSignal is not true",
    );
  }
  if (exists(getCancellor) && !isCallable(getCancellor)) {
    throw makeReason(
      PROMISE,
      "getCancellor must be a cancellor factory",
      getCancellor,
    );
  }
  if (takesSignal === true && !exists(getCancellor)) {
    getCancellor = defaultGetCancellor;
  }

  if (!isCallable(getPromise)) {
    throw makeReason(PROMISE, "getPromise must be callable", getPromise);
  }

  return makePotentialListener(getPromise.length > 0, (pass, fail, message) => {
    let cancellor;
    let signal;

    new Promise((resolve, reject) => {
      if (takesSignal === true) {
        let abort;

        const controller = new AbortController();
        ({ signal, abort } = controller);

        cancellor = getCancellor(abort);
      }

      const newPromise = getPromise(message, signal);

      if (!isThenable(newPromise)) {
        throw makeReason(
          PROMISE,
          "getPromise did not return a thenable",
          newPromise,
        );
      }

      newPromise.then(resolve).catch(reject);
    }).then(pass).catch(fail);

    if (isCallable(cancellor)) {
      return cancellor;
    }
  });
};
