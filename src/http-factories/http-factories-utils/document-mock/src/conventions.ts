export const assign = (target: object, source: object | null | undefined) => {
  if (target === null || typeof target !== "object") {
    throw new TypeError("target is not an object");
  }

  if (source === null || source === undefined) {
    return target;
  }

  Object.keys(source).forEach((key) => {
    if (Object.hasOwn(source, key)) {
      target[key as keyof typeof target] = source[key as keyof typeof source];
    }
  });

  return target;
};

/**
 * A number of HTML attributes are boolean attributes.
 * The presence of a boolean attribute on an element represents the `true` value
 * and the absence of the attribute represents the `false` value.
 * @see https://html.spec.whatwg.org/#boolean-attributes
 * @see https://html.spec.whatwg.org/#attributes-3
 */
export const HTML_BOOLEAN_ATTRIBUTES = Object.freeze({
  allowfullscreen: true,
  async: true,
  autofocus: true,
  autoplay: true,
  checked: true,
  controls: true,
  default: true,
  defer: true,
  disabled: true,
  formnovalidate: true,
  hidden: true,
  ismap: true,
  itemscope: true,
  loop: true,
  multiple: true,
  muted: true,
  nomodule: true,
  novalidate: true,
  open: true,
  playsinline: true,
  readonly: true,
  required: true,
  reversed: true,
  selected: true,
});

/**
 * Check if `name` is matching one of the HTML boolean attribute names.
 * This method does not check if such attributes are allowed in the context of
 * the current document/parsing.
 * @see {@link HTML_BOOLEAN_ATTRIBUTES}
 * @see https://html.spec.whatwg.org/#boolean-attributes
 * @see https://html.spec.whatwg.org/#attributes-3
 */
export const isHTMLBooleanAttribute = (name: string) => {
  return Object.hasOwn(HTML_BOOLEAN_ATTRIBUTES, name.toLowerCase());
};

/**
 * Void elements only have a start tag; end tags must not be specified for void
 * elements.
 * These elements should be written as self-closing like this: `<area />`. This
 * should not be confused with optional tags that HTML allows to omit the end
 * tag for (like `li`, `tr` and others), which can have content after them so
 * they can not be written as self-closing.
 * xmldom does not have any logic for optional end tags cases and will report
 * them as a warning. Content that would go into the unopened element will
 * instead be added as a sibling text node.
 * @see https://html.spec.whatwg.org/#void-elements
 * @see https://html.spec.whatwg.org/#optional-tags
 */
export const HTML_VOID_ELEMENTS = Object.freeze({
  area: true,
  base: true,
  br: true,
  col: true,
  embed: true,
  hr: true,
  img: true,
  input: true,
  link: true,
  meta: true,
  param: true,
  source: true,
  track: true,
  wbr: true,
});

/**
 * Check if `tagName` is matching one of the HTML void element names.
 * This method doesn't check if such tags are allowed in the context of the
 * current document/parsing.
 * @see {@link HTML_VOID_ELEMENTS}
 * @see https://html.spec.whatwg.org/#void-elements
 */
export const isHTMLVoidElement = (tagName: string) => {
  return Object.hasOwn(HTML_VOID_ELEMENTS, tagName.toLowerCase());
};

/**
 * Tag names that are raw text elements according to HTML spec.
 * The value denotes whether they are escapable or not.
 * @see {@link isHTMLEscapableRawTextElement}
 * @see {@link isHTMLRawTextElement}
 * @see https://html.spec.whatwg.org/#raw-text-elements
 * @see https://html.spec.whatwg.org/#escapable-raw-text-elements
 */
export const HTML_RAW_TEXT_ELEMENTS = Object.freeze({
  script: false,
  style: false,
  textarea: true,
  title: true,
});

/**
 * Check if `tagName` is matching one of the HTML raw text element names.
 * This method doesn't check if such tags are allowed in the context of the
 * current document/parsing.
 * @see {@link isHTMLEscapableRawTextElement}
 * @see {@link HTML_RAW_TEXT_ELEMENTS}
 * @see https://html.spec.whatwg.org/#raw-text-elements
 * @see https://html.spec.whatwg.org/#escapable-raw-text-elements
 */
export const isHTMLRawTextElement = (tagName: string) => {
  const key = tagName.toLowerCase() as keyof typeof HTML_RAW_TEXT_ELEMENTS;
  return Object.hasOwn(HTML_RAW_TEXT_ELEMENTS, key) &&
    !HTML_RAW_TEXT_ELEMENTS[key];
};

/**
 * Check if `tagName` is matching one of the HTML escapable raw text element names.
 * This method doesn't check if such tags are allowed in the context of the current
 * document/parsing.
 * @see {@link isHTMLRawTextElement}
 * @see {@link HTML_RAW_TEXT_ELEMENTS}
 * @see https://html.spec.whatwg.org/#raw-text-elements
 * @see https://html.spec.whatwg.org/#escapable-raw-text-elements
 */
export const isHTMLEscapableRawTextElement = (tagName: string) => {
  const key = tagName.toLowerCase() as keyof typeof HTML_RAW_TEXT_ELEMENTS;
  return Object.hasOwn(HTML_RAW_TEXT_ELEMENTS, key) &&
    HTML_RAW_TEXT_ELEMENTS[key];
};

/**
 * All mime types that are allowed as input to `DOMParser.parseFromString`
 *
 * @see https://developer.mozilla.org/en-US/docs/Web/API/DOMParser/parseFromString#Argument02
 *      MDN
 * @see https://html.spec.whatwg.org/multipage/dynamic-markup-insertion.html#domparsersupportedtype
 *      WHATWG HTML Spec
 * @see {@link DOMParser.prototype.parseFromString}
 */
export const MIME_TYPE = Object.freeze({
  /**
   * `text/html`, the only mime type that triggers treating an XML document as HTML.
   *
   * @see https://www.iana.org/assignments/media-types/text/html IANA MimeType registration
   * @see https://en.wikipedia.org/wiki/HTML Wikipedia
   * @see https://developer.mozilla.org/en-US/docs/Web/API/DOMParser/parseFromString MDN
   * @see https://html.spec.whatwg.org/multipage/dynamic-markup-insertion.html#dom-domparser-parsefromstring
   *      WHATWG HTML Spec
   */
  HTML: "text/html",

  /**
   * `application/xml`, the standard mime type for XML documents.
   *
   * @see https://www.iana.org/assignments/media-types/application/xml IANA MimeType
   *      registration
   * @see https://tools.ietf.org/html/rfc7303#section-9.1 RFC 7303
   * @see https://en.wikipedia.org/wiki/XML_and_MIME Wikipedia
   */
  XML_APPLICATION: "application/xml",

  /**
   * `text/xml`, an alias for `application/xml`.
   *
   * @see https://tools.ietf.org/html/rfc7303#section-9.2 RFC 7303
   * @see https://www.iana.org/assignments/media-types/text/xml IANA MimeType registration
   * @see https://en.wikipedia.org/wiki/XML_and_MIME Wikipedia
   */
  XML_TEXT: "text/xml",

  /**
   * `application/xhtml+xml`, indicates an XML document that has the default HTML namespace,
   * but is parsed as an XML document.
   *
   * @see https://www.iana.org/assignments/media-types/application/xhtml+xml IANA MimeType
   *      registration
   * @see https://dom.spec.whatwg.org/#dom-domimplementation-createdocument WHATWG DOM Spec
   * @see https://en.wikipedia.org/wiki/XHTML Wikipedia
   */
  XML_XHTML_APPLICATION: "application/xhtml+xml",

  /**
   * `image/svg+xml`,
   *
   * @see https://www.iana.org/assignments/media-types/image/svg+xml IANA MimeType registration
   * @see https://www.w3.org/TR/SVG11/ W3C SVG 1.1
   * @see https://en.wikipedia.org/wiki/Scalable_Vector_Graphics Wikipedia
   */
  XML_SVG_IMAGE: "image/svg+xml",
});

export const isHTMLMimeType = (mimeType: string) => {
  return mimeType === MIME_TYPE.HTML;
};

export const hasDefaultHTMLNamespace = (mimeType: string) => {
  return isHTMLMimeType(mimeType) ||
    mimeType === MIME_TYPE.XML_XHTML_APPLICATION;
};

export const _MIME_TYPES = Object.values(MIME_TYPE);

export const isValidMimeType = (mimeType: string) => {
  return _MIME_TYPES.indexOf(
    mimeType as typeof MIME_TYPE[keyof typeof MIME_TYPE],
  ) > -1;
};

export const NAMESPACE = Object.freeze({
  /**
	 * The XHTML namespace.
	 * @see http://www.w3.org/1999/xhtml
	 */
	HTML: 'http://www.w3.org/1999/xhtml',

	/**
	 * The SVG namespace.
	 * @see http://www.w3.org/2000/svg
	 */
	SVG: 'http://www.w3.org/2000/svg',

	/**
	 * The `xml:` namespace.
	 * @see http://www.w3.org/XML/1998/namespace
	 */
	XML: 'http://www.w3.org/XML/1998/namespace',

	/**
	 * The `xmlns:` namespace.
	 * @see https://www.w3.org/2000/xmlns/
	 */
	XMLNS: 'http://www.w3.org/2000/xmlns/',
});
