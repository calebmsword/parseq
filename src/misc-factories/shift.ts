import { requestor } from "../parseq-utilities/requestor.ts";
import { Flatten, Shift } from "./misc-factories-utils/misc-factories-types.ts";

export const shift = <M extends any[]>() => {
  return requestor<Shift<[M, ...any[]]>, Flatten<Shift<M>>>(
    (pass, _fail, message) => {
      const wrapped = [message].flat();
      wrapped.shift();
      pass(wrapped.length < 2 ? wrapped.at(0) : wrapped.flat());
    },
  );
};
