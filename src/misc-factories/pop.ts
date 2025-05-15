import { requestor } from "../parseq-utilities/requestor.ts";
import { Flatten, Pop } from "./misc-factories-utils/misc-factories-types.ts";

export const pop = <M>() => {
  return requestor<M, Flatten<Pop<M>>>(
    (pass, _fail, message) => {
      if (!Array.isArray(message)) {
        pass(undefined as Flatten<Pop<M>>);
        return;
      }
      const clone = message.slice();
      clone.pop();
      pass(clone.length === 1 ? clone[0] : clone);
    },
  );
};
