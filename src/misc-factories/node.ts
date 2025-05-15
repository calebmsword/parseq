import {
  makeListenerIf,
  safeCallback,
} from "../parseq-utilities/parseq-utilities-misc.ts";
import { exists, isCallable } from "../parseq-utilities/parseq-utilities-type-checking.ts";
import { Cancellor } from "../types.d.ts";

export const node = <M, T>(
  takesNodeStyleCallback: (
    nodeStyleCallback: (error: unknown, data: any) => void,
    message?: M,
  ) => Cancellor | void,
) => {
  if (!isCallable) {
    throw new Error("parseq.node expects to receive callable", {
      cause: takesNodeStyleCallback,
    });
  }

  return makeListenerIf<M, T>(
    takesNodeStyleCallback.length > 1,
    (pass, fail, message) => {
      return takesNodeStyleCallback(
        safeCallback(fail, (error, data) => {
          exists(error) ? fail(error) : pass(data);
        }),
        message,
      );
    },
  );
};
