import { requestor } from "../parseq-utilities/requestor.ts";

export const value = <T>(value: T) => {
  return requestor<any, T>((pass) => {
    pass(value);
  });
};
