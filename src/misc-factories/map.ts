import { requestor } from "../parseq-utilities/requestor.ts";

/**
 * Maps the given message into a value in accordance to the given callback.
 * This is mostly useful for patchworking two requestors in a sequence whose
 * value and message do not align.
 */
export const map = <M, V>(mapper: (value: M) => V) => {
  return requestor<M, V>((pass, _fail, message) => {
    pass(mapper(message));
    return;
  });
};
