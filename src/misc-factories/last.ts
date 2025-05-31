import { requestor } from "../parseq-utilities/requestor.ts";

/**
 * Propogates the last element of the given tuple.
 * If the given message is not a tuple, then that message is simply propogated.
 */
export const last = <M>() => {
  return requestor<[...any[], M] | M, M>((pass, _fail, message) => {
    pass([message].flat().at(-1));
    return;
  });
};
