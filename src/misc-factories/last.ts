import { requestor } from "../parseq-utilities/requestor.ts";

export const last = <M>() => {
  return requestor<[...any[], M] | M, M>((pass, _fail, message) => {
    pass([message].flat().at(-1));
    return;
  });
};
