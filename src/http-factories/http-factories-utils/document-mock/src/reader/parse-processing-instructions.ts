import { Builder } from "../builder.ts";
import { PI, XML_DECL } from "../grammar.ts";
import { ErrorHandler } from "./reader-utils.ts";

export const parseProcessingInstruction = (
  source: string,
  start: number,
  builder: Builder,
  errorHandler: ErrorHandler,
) => {
  const match = source.substring(start).match(PI);

  if (match === null) {
    errorHandler.fatalError(
      `Invalid processing instruction starting at position ${start}`,
    );
    return;
  }

  if (match[1].toLowerCase() === "xml") {
    if (start > 0) {
      errorHandler.fatalError(
        `processing instruction at position ${start} is an xml declaration which is only at the start of the document`,
      );
      return;
    }

    if (!XML_DECL.test(source.substring(start))) {
      errorHandler.fatalError("xml declaration is not well-formed");
      return;
    }
  }

  builder.processingInstruction(match[1], match[2]);
  return start + match[0].length;
};
