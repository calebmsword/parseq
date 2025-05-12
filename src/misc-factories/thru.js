import { requestor } from "../parseq-utilities/requestor.js";

export const thru = () => {
  return requestor((pass, _fail, message) => {
    pass(message);
  });
};
