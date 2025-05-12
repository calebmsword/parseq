import { requestor } from "../parseq-utilities/requestor.js";

export const value = (value) => {
  return requestor((pass) => {
    pass(value);
  });
};
