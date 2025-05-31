import { ErrorHandler } from "../../src/reader/reader-utils.ts";
import { fn } from "@std/expect/fn";

type Handler = (..._messages: string[]) => void;

export const getMockErrorHandler = () => {
  const warningSpy = fn((..._messages: string[]) => {}) as Handler;
  const errorSpy = fn((..._messages: string[]) => {}) as Handler;
  const fatalErrorSpy = fn((..._messages: string[]) => {}) as Handler;

  const errorHandler: ErrorHandler = {
    warning: warningSpy,
    error: errorSpy,
    fatalError: fatalErrorSpy,
  };

  return {
    errorHandler,
    warningSpy,
    errorSpy,
    fatalErrorSpy,
  };
};
