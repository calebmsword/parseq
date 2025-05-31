import { requestor } from "../parseq-utilities/requestor.ts";

/**
 * Propogates the given message.
 * This is mostly useful as one path in branch if you want a requestor that
 * conditionally alters a message.
 */
export const thru = <T>() => {
  return requestor<T, T>((pass, _fail, message) => {
    pass(message);
    return;
  });
};
