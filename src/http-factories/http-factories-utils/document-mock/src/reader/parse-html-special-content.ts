import { Builder } from "../builder.ts";
import {
  isHTMLEscapableRawTextElement,
  isHTMLRawTextElement,
} from "../conventions.ts";
import { ENTITY_REG } from "./reader-utils.ts";

export const parseHtmlSpecialContent = (
  source: string,
  end: number,
  tagName: string,
  entityReplacer: (reference: string) => string,
  builder: Builder,
) => {
  // https://html.spec.whatwg.org/#raw-text-elements
  // https://html.spec.whatwg.org/#escapable-raw-text-elements
  // https://html.spec.whatwg.org/#cdata-rcdata-restrictions:raw-text-elements
  // TODO: https://html.spec.whatwg.org/#cdata-rcdata-restrictions
  const isEscapableRaw = isHTMLEscapableRawTextElement(tagName);
  if (isEscapableRaw || isHTMLRawTextElement(tagName)) {
    const elEndStart = source.indexOf(`</${tagName}>`, end);
    let text = source.substring(end + 1, elEndStart);

    if (isEscapableRaw) {
      text = text.replace(ENTITY_REG, entityReplacer);
    }
    builder.characters(text, 0, text.length);
    return elEndStart;
  }
  return end + 1;
};
