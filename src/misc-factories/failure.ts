import { requestor } from "../parseq-utilities/requestor.ts";

export const failure = (reason: any) => {
  return requestor<any, never>((_pass, fail) => {
    fail(reason);
    return;
  });
};
