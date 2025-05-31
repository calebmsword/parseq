import { requestor } from "../parseq-utilities/requestor.ts";

/**
 * Propogates the given message as a failure.
 */
export const failure = (reason: any) => {
  return requestor<any, never>((_pass, fail) => {
    fail(reason);
    return;
  });
};
