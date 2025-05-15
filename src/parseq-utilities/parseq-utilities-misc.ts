import { requestor } from "./requestor.ts";
import { Action } from "../types.d.ts";
import { Requestor } from "../types.d.ts";

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
