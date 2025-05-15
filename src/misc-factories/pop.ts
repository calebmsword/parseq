import { Last } from "../crockford-factories/crockford-factories-utils/crockford-factories-types.ts";
import { requestor } from "../parseq-utilities/requestor.ts";
import { Flatten, Pop } from "./misc-factories-utils/misc-factories-types.ts";

export const pop = <M>(observer?: (popped: Last<M, undefined>) => void) => {
  return requestor<M, Flatten<Pop<M>>>(
    (pass, _fail, message) => {
      if (!Array.isArray(message)) {
        pass(undefined as Flatten<Pop<M>>);
        return;
      }
      const clone = message.slice();
      const popped = clone.pop();
      if (typeof observer === "function") {
        observer(popped);
      }
      pass(clone.length < 2 ? clone[0] : clone);
    },
  );
};
