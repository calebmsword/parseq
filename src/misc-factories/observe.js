import { requestor } from "../parseq-utilities/requestor.js";

export const observe = (observer) => {
  return requestor((pass, _fail, message) => {
    observer(message);
    pass(message);
  });
};
