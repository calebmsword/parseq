import { requestor } from "../parseq-utilities/requestor.ts";

export const first = <M>() => {
  return requestor<[M, ...any[]] | M, M>((pass, _fail, message) => {
    pass([message].flat().at(0));
  });
};
