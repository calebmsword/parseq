import { Action, Requestor, requestor, Result } from "./requestor.ts";

export const exists = (value: any) => {
  return value !== undefined && value !== null;
};

export const isObject = (value: any) => {
  return value !== null && typeof value === "object";
};

export const asObject = <T>(value: T) => {
  return isObject(value) ? value : {};
};

export const not = <T>(func: Predicate<T>) => {
  return (x: T) => {
    return !func(x);
  };
};

type Predicate<T> = (x: T) => boolean;

export const allTrue = <T>(...funcs: Predicate<T>[]) => {
  return (x: T) => {
    return funcs.every((func) => {
      return func(x);
    });
  };
};

export const isPrimitive = not(isObject);

export const isBoolean = (value: any) => {
  return typeof value === "boolean";
};

export const isString = (value: any) => {
  return typeof value === "string";
};

export const isCallable = (value: any) => {
  return typeof value === "function";
};

type PropertyKey = string | symbol | number;

type HasProperty = { [key: PropertyKey]: any };

export const prop = <T>(name: PropertyKey) => {
  return (x: T): T extends HasProperty ? T[typeof name] : undefined => {
    return isObject(x) ? (x as HasProperty)[name] : undefined;
  };
};

// export const pipe = (...args: ((arg: any) => any)[]): any => {
//   (x: any) => {
//     return args.reduce((acc, next) => next(acc), x);
//   };
// };

// special thanks to https://stackoverflow.com/users/5770132/oblosys and their
// comment on https://stackoverflow.com/questions/53173203/typescript-recursive-function-composition/53175538#53175538


export const isThenable = (value: any) => {
  return isObject(value) && isCallable(value.then);
};

export const isScheduler = (value: any) => {
  return isObject(value) && isCallable(value.schedule) &&
    isCallable(value.unschedule);
};


export const safeCallback = <T extends any[]>(
  fail: (reason: any) => void,
  callback: (...args: T) => void,
) => {
  return (...args: T) => {
    try {
      callback(...args);
    } catch (reason) {
      fail(reason);
    }
  };
};

export const makeUnspecifiedReason = () => {
  return new Error(
    "Unspecified failure. (This occurs when nullish reason is used as a failed result.)",
  );
};

export const isSuccess = <V>(result: Result<V>) => {
  return isObject(result) && !exists(result.reason);
};

export const allSuccessful = <V>(results: Result<V>[]) => {
  return Array.isArray(results) && results.every(isSuccess);
};

export const isFailure = (result: Result<any>) => {
  return isObject(result) && exists(result.reason);
};

export const allFailed = (results: Result<any>[]) => {
  return Array.isArray(results) && results.every(isFailure);
};

export const getSuccess = <V>(result: Result<V>) => {
  return isObject(result) ? result.value : undefined;
};

export const getFailure = <V>(result: Result<V>) => {
  return isObject(result) ? result.reason : undefined;
};

export const makeListenerIf = <M, V>(
  listener: boolean,
  action: Action<M, V>,
): Requestor<M, V> => {
  return listener
    ? requestor((pass, fail, message) => {
      return action(pass, fail, message as M);
    }) as Requestor<M, V>
    : requestor((pass, fail) => {
      return action(pass, fail, undefined as M);
    }) as Requestor<unknown, V>;
};
