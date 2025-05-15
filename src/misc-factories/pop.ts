import { Last } from "../crockford-factories/crockford-factories-utils/crockford-factories-types.ts";
import { requestor } from "../parseq-utilities/requestor.ts";
import { Pop } from "./misc-factories-utils/misc-factories-types.ts";

export const pop = <M>(observer?: (popped: Last<M, undefined>) => void) => {
  return requestor<M, Pop<M>>(
    (pass, _fail, message) => {
      if (!Array.isArray(message)) {
        pass(undefined as Pop<M>);
        return;
      }
      const clone = message.slice();
      const popped = clone.pop();
      if (typeof observer === "function") {
        observer(popped);
      }
      pass(clone as Pop<M>);
    },
  );
};
