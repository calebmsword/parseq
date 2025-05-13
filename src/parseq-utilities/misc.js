import { requestor } from "./requestor.js";

export const exists = (value) => {
  return value !== undefined && value !== null;
};

export const isObject = (value) => {
  return value !== null && typeof value === "object";
};

export const asObject = (value) => {
  return isObject(value) ? value : {};
};

export const isPrimitive = (value) => {
  return value === null || typeof value !== "object";
};

export const isBoolean = (value) => {
  return typeof value === "boolean";
};

export const isString = (value) => {
  return typeof value === "string";
};

export const isCallable = (value) => {
  return typeof value === "function";
};

export const isThenable = (value) => {
  return isObject(value) && isCallable(value.then);
};

export const isScheduler = (value) => {
  return isObject(value) && isCallable(value.schedule) &&
    isCallable(value.unschedule);
};

export const safeCallback = (fail, callback) => {
  return (...args) => {
    try {
      callback(...args);
    } catch (reason) {
      fail(reason);
    }
  };
};

export const safeCallbackOneArg = (fail, callback) => {
  return (arg) => {
    try {
      callback(arg);
    } catch (reason) {
      fail(reason);
    }
  };
};

export const allTrue = (...funcs) => {
  return (x) => {
    return funcs.every((func) => {
      return func(x);
    });
  };
};

export const not = (func) => {
  return (x) => {
    return !func(x);
  };
};

export const makeUnspecifiedReason = () => {
  new Error(
    "Unspecified failure. (This occurs when nullish reason is used as a failed result.)",
  );
};

export const isSuccess = (result) => {
  return isObject(result) && !exists(result.reason);
};

export const allSuccessful = (results) => {
  return Array.isArray(results) && results.every(isSuccess);
};

export const isFailure = (result) => {
  return isObject(result) && exists(result.reason);
};

export const allFailed = (results) => {
  return Array.isArray(results) && results.every(isFailure);
};

export const getSuccess = (result) => {
  return isObject(result) ? result.value : undefined;
};

export const getFailure = (result) => {
  return isObject(result) ? result.reason : undefined;
};

export const makePotentialListener = (listener, action) => {
  return listener
    ? requestor((pass, fail, message) => {
      return action(pass, fail, message);
    })
    : requestor((pass, fail) => {
      return action(pass, fail);
    });
};
