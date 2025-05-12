import {
  exists,
  isCallable,
  makePotentialListener,
} from "../parseq-utilities/misc.js";

export const node = (takesNodeStyleCallback) => {
  if (!isCallable) {
    throw new Error("parseq.node expects to receive callable", {
      cause: takesNodeStyleCallback,
    });
  }

  return makePotentialListener(
    takesNodeStyleCallback.length > 1,
    (pass, fail, message) => {
      takesNodeStyleCallback((error, data) => {
        exists(error) ? fail(error) : pass(data);
      }, message);
    },
  );
};
