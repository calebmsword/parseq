import { requestor } from "../parseq-utilities/requestor.ts";

export const thru = <T>() => {
  return requestor<T, T>((pass, _fail, message) => {
    pass(message);
  });
};
