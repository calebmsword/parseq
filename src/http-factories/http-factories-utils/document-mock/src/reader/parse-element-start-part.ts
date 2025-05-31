import { ElementAttributes, ENTITY_REG, ErrorHandler } from "./reader-utils.ts";

const S_TAG = 0; // tag name offerring
const S_ATTR = 1; // attr name offerring
const S_ATTR_SPACE = 2; // attr name end and space offer
const S_EQ = 3; // =space?
const S_ATTR_NOQUOT_VALUE = 4; // attr value (no quot value only)
const S_ATTR_END = 5; // attr value end and no space (quot end)
const S_TAG_SPACE = 6; // (attr value end || tag end ) && (space offer)
const S_TAG_CLOSE = 7; // closed el <el />

const addAttribute = (
  qname: string,
  value: string,
  startIndex: number,
  el: ElementAttributes,
  errorHandler: ErrorHandler,
  isHTML: boolean,
  entityReplacer: (reference: string) => string,
) => {
  if (el.attributeNames?.has(qname)) {
    errorHandler.fatalError(`Attribute ${qname} redefined`);
    return;
  }
  if (!isHTML && value.indexOf("<") >= 0) {
    return errorHandler.fatalError(
      "Unescaped '<' not allowed in attributes values",
    );
  }
  el.add(
    qname,
    // @see https://www.w3.org/TR/xml/#AVNormalize
    // since the xmldom sax parser does not "interpret" DTD the following is not
    // implemented:
    // - recursive replacement of (DTD) entity references
    // - trimming and collapsing multiple spaces into a single one for
    //   attributes that are not of type CDATA
    value.replace(/[\t\n\r]/g, " ").replace(ENTITY_REG, entityReplacer),
    startIndex,
  );
};

export const parseElementStartPart = (
  source: string,
  start: number,
  el: ElementAttributes,
  entityReplacer: (reference: string) => string,
  errorHandler: ErrorHandler,
  isHTML: boolean,
) => {
  let attrName;
  let value;

  let p = ++start;

  /**
   * Internal flag for tracking parse status.
   * See the variables S_TAG, S_ATTR, S_ATTR_SPACE, S_EQ, S_ATTR_NOQUOT_VALUE,
   * S_ATTR_END, S_TAG_SPACE, and S_TAG_CLOSE.
   */
  let s = S_TAG;

  while (true) {
    let c = source.charAt(p);

    if (c === "=") {
      if (s === S_ATTR) {
        attrName = source.slice(start, p);
        s = S_EQ;
      } else if (s === S_ATTR_SPACE) {
        s = S_EQ;
      } else {
        throw new Error("attribute equal must after attrName");
      }
    } else if (c === "'" || c === '"') {
      if (s === S_EQ || s === S_ATTR) {
        if (s === S_ATTR) {
          errorHandler.warning('attribute value must after "="');
          attrName = source.slice(start, p);
        }
        start = p + 1;
        p = source.indexOf(c, start);
        if (p > 0) {
          value = source.slice(start, p);
          addAttribute(
            attrName || "",
            value,
            start - 1,
            el,
            errorHandler,
            isHTML,
            entityReplacer,
          );
        } else {
          throw new Error(`attribute value no end '${c}' match`);
        }
      } else if (s === S_ATTR_NOQUOT_VALUE) {
        value = source.slice(start, p);
        addAttribute(
          attrName || "",
          value,
          start,
          el,
          errorHandler,
          isHTML,
          entityReplacer,
        );
        errorHandler.warning(
          `attribute "${attrName}" missed start quot(${c})!!`,
        );
        start = p + 1;
        s = S_ATTR_END;
      } else {
        throw new Error('attribute value must after "="');
      }
    } else if (c === "/") {
      if (s === S_TAG) {
        el.setTagName(source.slice(start, p));
      } else if (s === S_ATTR_END || s === S_TAG_SPACE || s === S_TAG_CLOSE) {
        s = S_TAG_CLOSE;
        el.closed = true;
      } else if (s === S_ATTR_NOQUOT_VALUE || s === S_ATTR) {
        // continue
      } else if (s === S_ATTR_SPACE) {
        el.closed = true;
      } else {
        throw new Error("attribute invalid close char('/')");
      }
    } else if (c === "") {
      errorHandler.error("unexpected end of input");
      if (s === S_TAG) {
        el.setTagName(source.slice(start, p));
      }
      return p;
    } else if (c === ">") {
      if (s === S_TAG) {
        el.setTagName(source.slice(start, p));
      } else if (s === S_ATTR_END || s === S_TAG_SPACE || s === S_TAG_CLOSE) {
        // continue
      } else if (s === S_ATTR_NOQUOT_VALUE || s === S_ATTR) {
        value = source.slice(start, p);
        if (value.slice(-1) === "/") {
          el.closed = true;
          value = value.slice(0, -1);
        }
      } else if (s === S_ATTR_SPACE) {
        value = attrName;
      } else if (s === S_EQ) {
        if (!isHTML) {
          errorHandler.fatalError(`AttValue: ' or " expected`);
          return;
        }
      }
      return p;
    } else if (c === "\u0080") {
      c = " ";
    } else {
      // should it be c <= 32? (32 is empty space, 0-31 are control characters)
      if (c <= " ") {
        if (s === S_TAG) {
          el.setTagName(source.slice(start, p));
          s = S_TAG_SPACE;
        } else if (s === S_ATTR) {
          attrName = source.slice(start, p);
          s = S_ATTR_SPACE;
        } else if (s === S_ATTR_NOQUOT_VALUE) {
          const value = source.slice(start, p);
          errorHandler.warning(`attribute "${value}" missed quot(")!!`);
          addAttribute(
            attrName || "",
            value,
            start,
            el,
            errorHandler,
            isHTML,
            entityReplacer,
          );
        } else if (S_ATTR_END) {
          s = S_TAG_SPACE;
        }
      } else {
        if (s === S_ATTR_SPACE) {
          if (!isHTML) {
            errorHandler.warning(
              `attribute "${attrName}" missed value!! ${attrName} instead!!`,
            );
          }
          addAttribute(
            attrName || "",
            attrName || "",
            start,
            el,
            errorHandler,
            isHTML,
            entityReplacer,
          );
        } else if (s === S_ATTR_END) {
          errorHandler.warning(`attribute space is required for ${attrName}!!`);
        } else if (s === S_TAG_SPACE) {
          s = S_ATTR;
          start = p;
        } else if (s === S_EQ) {
          s = S_ATTR_NOQUOT_VALUE;
          start = p;
        } else if (s === S_TAG_CLOSE) {
          throw new Error(
            `elements closed character '/' and '>' must be connected to`,
          );
        }
      }
    }
    p++;
  }
};
