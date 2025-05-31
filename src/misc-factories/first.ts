import { requestor } from "../parseq-utilities/requestor.ts";

/**
 * Propogates the first element of the given tuple.
 * If the given message is not a tuple, then that message is simply propogated.
 */
export const first = <M>() => {
  return requestor<[M, ...any[]] | M, M>((pass, _fail, message) => {
    pass([message].flat().at(0));
    return;
  });
};
