import { makeListenerIf } from "../parseq-utilities/parseq-utilities-misc.ts";
import { Cancellor, Requestor } from "../types.d.ts";

export const withCancellor = <M, V>(
  requestor: Requestor<M, V>,
  cancellor: Cancellor,
) => {
  return makeListenerIf<M, V>(requestor.isListener, (pass, fail, message) => {
    const cancellors = [
      cancellor,
      requestor.run({
        runOnFutureTick: false,
        message,
        success: pass,
        failure: fail,
      }),
    ];

    return (reason?: any) => {
      cancellors.forEach((cancellor) => {
        if (typeof cancellor === "function") {
          cancellor(reason);
        }
      });
    };
  });
};
