import { requestor } from "../parseq-utilities/requestor.ts";

/** A fixed requestor that propogates the given value. */
export const value = <T>(value: T) => {
  return requestor<any, T>((pass) => {
    pass(value);
    return;
  });
};
