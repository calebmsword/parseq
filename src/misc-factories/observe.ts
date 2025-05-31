import { makeReason } from "../crockford-factories/crockford-factories-utils/cockford-factories-misc.ts";
import { isCallable } from "../parseq-utilities/parseq-utilities-type-checking.ts";
import { requestor } from "../parseq-utilities/requestor.ts";

const OBSERVE = "observe";

/**
 * Propogates the given message and performs the observation on the message.
 * The implementation of observe this is completely identical to effect. This
 * requestor exists for stylistic/semantic purposes. In general, observer should
 * be used for logging while effect should be used to manipulate variables in
 * your code.
 */
export const observe = <M>(observer: (message: M) => void) => {
  if (!isCallable(observer)) {
    throw makeReason(OBSERVE, "observer must be callable", observer);
  }

  return requestor<M, M>((pass, _fail, message) => {
    observer(message);
    pass(message);
  });
};
