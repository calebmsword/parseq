import { requestor } from "../parseq-utilities/requestor.ts";

export const map = <M, V> (mapper: (value: M) => V) => {
  return requestor<M, V>((pass, _fail, message) => {
    pass(mapper(message));
  });
};
