import { requestor } from "../parseq-utilities/requestor.js";

export const map = (mapper) => {
  return requestor((pass, _fail, message) => {
    pass(mapper(message));
  });
};
