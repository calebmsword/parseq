import { requestor } from "../parseq-utilities/requestor.js";

export const failure = (reason) => {
  return requestor((_pass, fail) => {
    fail(reason);
  });
};
