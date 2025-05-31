import { makeListenerIf } from "../parseq-utilities/parseq-utilities-misc.ts";
import { Cancellor, Requestor } from "../types.d.ts";

/**
 * Returns a new requestor that is identical to the one given except that the
 * given cancellor is "appended" to that returned by the original requestor, if
 * it had one at all. The new cancellor runs the given cancellor first, and then
 * runs the cancellor associated with the original requestor, if it has one. 
 */
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
