import { ErrorHandler } from "../../src/reader/reader-utils.ts";
import { fn } from "@std/expect/fn";

type Handler = (..._messages: string[]) => void;

export const getMockErrorHandler = () => {
  const warningMock = fn((..._messages: string[]) => {}) as Handler;
  const errorMock = fn((..._messages: string[]) => {}) as Handler;
  const fatalErrorMock = fn((..._messages: string[]) => {}) as Handler;

  const errorHandler: ErrorHandler = {
    warning: warningMock,
    error: errorMock,
    fatalError: fatalErrorMock,
  };

  return {
    errorHandler,
    warningMock,
    errorMock,
    fatalErrorMock,
  };
};
