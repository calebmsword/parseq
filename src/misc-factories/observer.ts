import { makeReason } from "../crockford-factories/crockford-factories-utils/cockford-factories-misc.ts";
import { isCallable } from "../parseq-utilities/parseq-utilities-misc.ts";
import { requestor } from "../parseq-utilities/requestor.ts";

const OBSERVE = "observe";

export const observe = <M>(observer: (message: M) => void) => {
  if (!isCallable(observer)) {
    throw makeReason(OBSERVE, "observer must be callable", observer);
  }

  return requestor<M, M>((pass, _fail, message) => {
    observer(message);
    pass(message);
  });
};
