import { makeReason } from "../crockford-factories/crockford-factories-utils/cockford-factories-misc.ts";
import { isCallable } from "../parseq-utilities/parseq-utilities-type-checking.ts";
import { requestor } from "../parseq-utilities/requestor.ts";

const EFFECT = "effect";

/**
 * Propogates the given message and performs the given side effect.
 * The implementation of effect this is completely identical to observer. This
 * requestor exists for stylistic/semantic purposes. In general, observer should
 * be used for logging while effect should be used for all other side effects.
 * Use judiciously as frequent usage of side effects can lead to unpredictable
 * application state. Furthermore, many situations where `effect` can be used
 * can be implemented with a container instead.
 */
export const effect = <M>(sideEffect: (message: M) => void) => {
  if (!isCallable(sideEffect)) {
    throw makeReason(EFFECT, "observer must be callable", sideEffect);
  }

  return requestor<M, M>((pass, _fail, message) => {
    sideEffect(message);
    pass(message);
  });
};
