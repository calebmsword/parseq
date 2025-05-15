import { makeReason } from "../crockford-factories/crockford-factories-utils/cockford-factories-misc.ts";
import { makeListenerIf } from "../parseq-utilities/parseq-utilities-misc.ts";
import { exists, isCallable, isThenable } from "../parseq-utilities/parseq-utilities-type-checking.ts";

const PROMISE = "promise";

const defaultGetCancellor = (abort: (reason?: unknown) => void) => {
  return (reason: any) => {
    abort(reason);
  };
};

export const promise = <M, T>(
  getPromise: (message?: M, signal?: AbortSignal) => Promise<T>,
  spec?: {
    takesSignal?: boolean;
    getCancellor?: (
      abort: (reason?: unknown) => void,
    ) => (reason?: unknown) => void;
  },
) => {
  let {
    takesSignal = false,
    getCancellor,
  } = spec !== null && typeof spec === "object" ? spec : {};

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

  return makeListenerIf<M, T>(getPromise.length > 0, (pass, fail, message) => {
    let cancellor;
    let signal: AbortSignal;

    new Promise<T>((resolve, reject) => {
      if (takesSignal === true && typeof getCancellor === "function") {
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
