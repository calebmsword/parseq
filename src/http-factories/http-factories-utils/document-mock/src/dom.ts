import {
  isHTMLRawTextElement,
  isHTMLVoidElement,
  NAMESPACE,
} from "./conventions.ts";
import { DOMExceptionName } from "./errors.ts";
import {
  CDATA_END,
  CDATA_START,
  COMMENT_END,
  COMMENT_START,
  QNAME_EXACT,
} from "./grammar.ts";
import { copy } from "./conventions.ts";

/**
 * Private DOM Constructor symbol
 *
 * Internal symbol used for construction of all classes whose constructors
 * should be private. Currently used for checks in {@link Node},
 * {@link Document}, {@link Element}, {@link Attr}, {@link CharacterData},
 * {@link Text}, {@link Comment}, {@link CDATASection}, {@link DocumentType}
 * {@link Notation}, {@link Entity}, {@link EntityReference},
 * {@link DocumentFragment}, {@link ProcessingInstruction} so the constructor
 * can't be used from outside the module.
 */
const PRIVATE_DOM_CONSTRUCTOR_SYMBOL = Symbol("PRIVATE_DOM_CONSTRUCTOR_SYMBOL");

const checkSymbol = (symbol: symbol) => {
  if (symbol !== PRIVATE_DOM_CONSTRUCTOR_SYMBOL) {
    throw new TypeError("Illegal constructor");
  }
};

const notEmptyString = (input: string) => {
  return input !== "";
};

/**
 * @see {@link https://infra.spec.whatwg.org/#split-on-ascii-whitespace}
 * @see {@link https://infra.spec.whatwg.org/#ascii-whitespace}
 */
const splitOnASCIIWhitespace = (input: string) => {
  return input ? input.split(/[\t\n\f\r ]+/).filter(notEmptyString) : [];
};

/**
 * @see {@link https://infra.spec.whatwg.org/#ordered-set}
 */
const toOrderedSet = (input: string) => {
  if (!input) {
    return [];
  }

  const list = splitOnASCIIWhitespace(input);
  return Array.from(new Set(list).values());
};

type Lookup<Array, n> = n extends keyof Array ? Array[n] : never;

type ElementOf<T> = Lookup<T, number>;

const arrayIncludes = <T>(list: ElementOf<T>[]) => {
  return (element: ElementOf<T>) => {
    return list?.indexOf(element) !== -1;
  };
};

/**
 * @see {@link https://dom.spec.whatwg.org/#validate}
 */
const validateQualifiedName = (qualifiedName: string) => {
  if (!QNAME_EXACT.test(qualifiedName)) {
    throw new DOMException(
      `invalid character in qualified name "${qualifiedName}"`,
      DOMExceptionName.InvalidCharacterError,
    );
  }
};

const validateAndExtract = (
  namespace: string | null,
  qualifiedName: string,
) => {
  validateQualifiedName(qualifiedName);
  namespace = namespace || null;

  let prefix: string | null = null;
  let localName = qualifiedName;

  if (qualifiedName.indexOf(":") >= 0) {
    const splitResult = qualifiedName.split(":");
    prefix = splitResult[0];
    localName = splitResult[1];
  }

  if (prefix !== null && namespace === null) {
    throw new DOMException(
      "prefix is non-null and namespace is null",
      DOMExceptionName.NamespaceError,
    );
  }
  if (prefix === "xml" && namespace !== NAMESPACE.XML) {
    throw new DOMException(
      'prefix is "xml" and namespace is not the XML namespace',
      DOMExceptionName.NamespaceError,
    );
  }

  if (
    (prefix === "xmlns" || qualifiedName === "xmlns") &&
    namespace !== NAMESPACE.XMLNS
  ) {
    throw new DOMException(
      'either qualifiedName or prefix is "xmlns" and namespace is not the XMLNS namespace',
      DOMExceptionName.NamespaceError,
    );
  }

  if (
    namespace === NAMESPACE.XMLNS && prefix !== "xmlns" &&
    qualifiedName !== "xmlns"
  ) {
    throw new DOMException(
      'namespace is the XMLNS namespace and neither qualifiedName nor prefix is "xmlns"',
      DOMExceptionName.NamespaceError,
    );
  }
  return [namespace, prefix, localName];
};

const NODE_TYPE = Object.freeze({
  ELEMENT_NODE: 1,
  ATTRIBUTE_NODE: 2,
  TEXT_NODE: 3,
  CDATA_SECTION_NODE: 4,
  ENTITY_REFERENCE_NODE: 5,
  ENTITY_NODE: 6,
  PROCESSING_INSTRUCTION_NODE: 7,
  COMMENT_NODE: 8,
  DOCUMENT_NODE: 9,
  DOCUMENT_TYPE_NODE: 10,
  DOCUMENT_FRAGMENT_NODE: 11,
  NOTATION_NODE: 12,
});

type NodeType = typeof NODE_TYPE[keyof typeof NODE_TYPE];

const DOCUMENT_POSITION = Object.freeze({
  DOCUMENT_POSITION_DISCONNECTED: 1,
  DOCUMENT_POSITION_PRECEDING: 2,
  DOCUMENT_POSITION_FOLLOWING: 4,
  DOCUMENT_POSITION_CONTAINS: 8,
  DOCUMENT_POSITION_CONTAINED_BY: 16,
  DOCUMENT_POSITION_IMPLEMENTATION_SPECIFIC: 32,
});

type DocumentPosition =
  typeof DOCUMENT_POSITION[keyof typeof DOCUMENT_POSITION];

class Node {}

// these should be included on Node
Object.defineProperty(Node.prototype, "textContent", {
  get() {
    return (function getTextContent(node: Node): string {
      switch (node.nodeType) {
        case NODE_TYPE.ELEMENT_NODE:
        case NODE_TYPE.DOCUMENT_FRAGMENT_NODE: {
          const buf = [];
          node = node.firstChild;
          while (node) {
            if (
              node.nodeType !== NODE_TYPE.PROCESSING_INSTRUCTION_NODE &&
              node.nodeType !== NODE_TYPE.COMMENT_NODE
            ) {
              buf.push(getTextContent(node));
            }
            node = node.nextSibling;
          }
          return buf.join("");
        }
        default:
          return node.nodeValue;
      }
    })(this);
  },

  set(data) {
    switch (this.nodeType) {
      case NODE_TYPE.ELEMENT_NODE:
      case NODE_TYPE.DOCUMENT_FRAGMENT_NODE:
        while (this.firstChild) {
          this.removeChild(this.firstChild);
        }
        if (data || String(data)) {
          this.appendChild(this.ownerDocument.createTextNode(data));
        }
        break;

      default:
        this.data = data;
        this.value = data;
        this.nodeValue = data;
    }
  },
});

/** Finds the deepest common ancestor of two nodes. */
const commonAncestor = (a: Node[], b: Node[]) => {
  if (b.length < a.length) {
    return commonAncestor(b, a);
  }

  let c: Node | null = null;

  for (let i = 0; i < a.length; ++i) {
    if (a[i] !== b[i]) {
      return c;
    }

    c = a[i];
  }

  return c;
};

class Document {}

type Namespace = {
  namespace: string;
  prefix: string;
};

const documentMap = (() => {
  const idFromDocumentMap = new Map<Document, symbol>();
  const documentFromIdMap = new Map<symbol, Document>();

  return {
    idFrom(document: Document) {
      if (!idFromDocumentMap.has(document)) {
        const newId = Symbol();
        idFromDocumentMap.set(document, newId);
        documentFromIdMap.set(newId, document);
      }

      return idFromDocumentMap.get(document) as Document;
    },

    documentFrom(id: symbol) {
      return documentFromIdMap.get(id);
    },
  };
})();

/**
 * Encodes special XML characters to their corresponding entities.
 * @param {string} char
 * The character to be encoded.
 * @returns
 * The encoded character.
 */
function xmlEncoder(char: string) {
  return (
    (char == "<" && "&lt;") ||
    (char == ">" && "&gt;") ||
    (char == "&" && "&amp;") ||
    (char == '"' && "&quot;") ||
    "&#" + char.charCodeAt(0) + ";"
  );
}

/**
 * Literal whitespace other than space that appear in attribute values are serialized as
 * their entity references, so they will be preserved.
 * (In contrast to whitespace literals in the input which are normalized to spaces).
 *
 * Well-formed constraint: No < in Attribute Values:
 * > The replacement text of any entity referred to directly or indirectly
 * > in an attribute value must not contain a <.
 *
 * @see https://www.w3.org/TR/xml11/#CleanAttrVals
 * @see https://www.w3.org/TR/xml11/#NT-AttValue
 * @see https://www.w3.org/TR/xml11/#AVNormalize
 * @see https://w3c.github.io/DOM-Parsing/#serializing-an-element-s-attributes
 * @prettierignore
 */
const addSerializedAttribute = (
  buf: (Node | string)[],
  qualifiedName: string,
  value: string,
) => {
  buf.push(
    " ",
    qualifiedName,
    '="',
    value.replace(/[<>&"\t\n\r]/g, xmlEncoder),
    '"',
  );
};

function needNamespaceDefine(
  node: Node,
  isHTML: boolean,
  visibleNamespaces: Namespace[],
) {
  var prefix = node.prefix || "";
  var uri = node.namespaceURI;
  // According to [Namespaces in XML 1.0](https://www.w3.org/TR/REC-xml-names/#ns-using) ,
  // and more specifically https://www.w3.org/TR/REC-xml-names/#nsc-NoPrefixUndecl :
  // > In a namespace declaration for a prefix [...], the attribute value MUST NOT be empty.
  // in a similar manner [Namespaces in XML 1.1](https://www.w3.org/TR/xml-names11/#ns-using)
  // and more specifically https://www.w3.org/TR/xml-names11/#nsc-NSDeclared :
  // > [...] Furthermore, the attribute value [...] must not be an empty string.
  // so serializing empty namespace value like xmlns:ds="" would produce an invalid XML document.
  if (!uri) {
    return false;
  }
  if ((prefix === "xml" && uri === NAMESPACE.XML) || uri === NAMESPACE.XMLNS) {
    return false;
  }

  var i = visibleNamespaces.length;
  while (i--) {
    var ns = visibleNamespaces[i];
    // get namespace prefix
    if (ns.prefix === prefix) {
      return ns.namespace !== uri;
    }
  }
  return true;
}

const serializeToString = (
  node: Node | string,
  buf: (Node | string)[],
  nodeFilter: (node: Node | string) => Node | string,
  visibleNamespaces?: Namespace[],
) => {
  if (!visibleNamespaces) {
    visibleNamespaces = [];
  }
  var doc = node.nodeType === NODE_TYPE.DOCUMENT_NODE
    ? node
    : node.ownerDocument;
  var isHTML = doc.type === "html";

  if (nodeFilter) {
    node = nodeFilter(node);
    if (node) {
      if (typeof node === "string") {
        buf.push(node);
        return;
      }
    } else {
      return;
    }
    //buf.sort.apply(attrs, attributeSorter);
  }

  switch (node.nodeType) {
    case NODE_TYPE.ELEMENT_NODE: {
      const attrs = node.attributes;
      const len = attrs.length;
      const nodeName = node.tagName;

      let child = node.firstChild;
      let prefixedNodeName = nodeName;

      if (!isHTML && !node.prefix && node.namespaceURI) {
        var defaultNS;
        // lookup current default ns from `xmlns` attribute
        for (var ai = 0; ai < attrs.length; ai++) {
          if (attrs.item(ai).name === "xmlns") {
            defaultNS = attrs.item(ai).value;
            break;
          }
        }
        if (!defaultNS) {
          // lookup current default ns in visibleNamespaces
          for (var nsi = visibleNamespaces.length - 1; nsi >= 0; nsi--) {
            var namespace = visibleNamespaces[nsi];
            if (
              namespace.prefix === "" &&
              namespace.namespace === node.namespaceURI
            ) {
              defaultNS = namespace.namespace;
              break;
            }
          }
        }
        if (defaultNS !== node.namespaceURI) {
          for (var nsi = visibleNamespaces.length - 1; nsi >= 0; nsi--) {
            var namespace = visibleNamespaces[nsi];
            if (namespace.namespace === node.namespaceURI) {
              if (namespace.prefix) {
                prefixedNodeName = namespace.prefix + ":" + nodeName;
              }
              break;
            }
          }
        }
      }

      buf.push("<", prefixedNodeName);

      for (var i = 0; i < len; i++) {
        // add namespaces for attributes
        var attr = attrs.item(i);
        if (attr.prefix == "xmlns") {
          visibleNamespaces.push({
            prefix: attr.localName,
            namespace: attr.value,
          });
        } else if (attr.nodeName == "xmlns") {
          visibleNamespaces.push({ prefix: "", namespace: attr.value });
        }
      }

      for (var i = 0; i < len; i++) {
        var attr = attrs.item(i);
        if (needNamespaceDefine(attr, isHTML, visibleNamespaces)) {
          var prefix = attr.prefix || "";
          var uri = attr.namespaceURI;
          addSerializedAttribute(
            buf,
            prefix ? "xmlns:" + prefix : "xmlns",
            uri,
          );
          visibleNamespaces.push({ prefix: prefix, namespace: uri });
        }
        serializeToString(attr, buf, nodeFilter, visibleNamespaces);
      }

      // add namespace for current node
      if (
        nodeName === prefixedNodeName &&
        needNamespaceDefine(node, isHTML, visibleNamespaces)
      ) {
        var prefix = node.prefix || "";
        var uri = node.namespaceURI;
        addSerializedAttribute(buf, prefix ? "xmlns:" + prefix : "xmlns", uri);
        visibleNamespaces.push({ prefix: prefix, namespace: uri });
      }
      // in XML elements can be closed when they have no children
      var canCloseTag = !child;
      if (canCloseTag && (isHTML || node.namespaceURI === NAMESPACE.HTML)) {
        // in HTML (doc or ns) only void elements can be closed right away
        canCloseTag = isHTMLVoidElement(nodeName);
      }
      if (canCloseTag) {
        buf.push("/>");
      } else {
        buf.push(">");
        //if is cdata child node
        if (isHTML && isHTMLRawTextElement(nodeName)) {
          while (child) {
            if (child.data) {
              buf.push(child.data);
            } else {
              serializeToString(
                child,
                buf,
                nodeFilter,
                visibleNamespaces.slice(),
              );
            }
            child = child.nextSibling;
          }
        } else {
          while (child) {
            serializeToString(
              child,
              buf,
              nodeFilter,
              visibleNamespaces.slice(),
            );
            child = child.nextSibling;
          }
        }
        buf.push("</", prefixedNodeName, ">");
      }
      // remove added visible namespaces
      //visibleNamespaces.length = startVisibleNamespaces;
      return;
    }
    case NODE_TYPE.DOCUMENT_NODE:
    case NODE_TYPE.DOCUMENT_FRAGMENT_NODE: {
      let child = node.firstChild;
      while (child) {
        serializeToString(child, buf, nodeFilter, visibleNamespaces.slice());
        child = child.nextSibling;
      }
      return;
    }
    case NODE_TYPE.ATTRIBUTE_NODE: {
      return addSerializedAttribute(buf, node.name, node.value);
    }
    case NODE_TYPE.TEXT_NODE: {
      /*
       * The ampersand character (&) and the left angle bracket (<) must not appear in their literal form,
       * except when used as markup delimiters, or within a comment, a processing instruction,
       * or a CDATA section.
       * If they are needed elsewhere, they must be escaped using either numeric character
       * references or the strings `&amp;` and `&lt;` respectively.
       * The right angle bracket (>) may be represented using the string " &gt; ",
       * and must, for compatibility, be escaped using either `&gt;`,
       * or a character reference when it appears in the string `]]>` in content,
       * when that string is not marking the end of a CDATA section.
       *
       * In the content of elements, character data is any string of characters which does not
       * contain the start-delimiter of any markup and does not include the CDATA-section-close
       * delimiter, `]]>`.
       *
       * @see https://www.w3.org/TR/xml/#NT-CharData
       * @see https://w3c.github.io/DOM-Parsing/#xml-serializing-a-text-node
       */
      return buf.push(node.data.replace(/[<&>]/g, xmlEncoder));
    }
    case NODE_TYPE.CDATA_SECTION_NODE:
      return buf.push(CDATA_START, node.data, CDATA_END);
    case NODE_TYPE.COMMENT_NODE:
      return buf.push(COMMENT_START, node.data, COMMENT_END);
    case NODE_TYPE.DOCUMENT_TYPE_NODE:
      var pubid = node.publicId;
      var sysid = node.systemId;
      buf.push(g.DOCTYPE_DECL_START, " ", node.name);
      if (pubid) {
        buf.push(" ", g.PUBLIC, " ", pubid);
        if (sysid && sysid !== ".") {
          buf.push(" ", sysid);
        }
      } else if (sysid && sysid !== ".") {
        buf.push(" ", g.SYSTEM, " ", sysid);
      }
      if (node.internalSubset) {
        buf.push(" [", node.internalSubset, "]");
      }
      buf.push(">");
      return;
    case NODE_TYPE.PROCESSING_INSTRUCTION_NODE:
      return buf.push("<?", node.target, " ", node.data, "?>");
    case NODE_TYPE.ENTITY_REFERENCE_NODE:
      return buf.push("&", node.nodeName, ";");
    default:
      buf.push("??", node.nodeName);
  }
};

export class NodeList {
  [index: number]: Node;

  #length: number = 0;

  get length() {
    return this.#length;
  }

  item(index: number) {
    return index >= 0 && index < this.#length ? this[index] : null;
  }

  toString(nodeFilter: unknown | ((...args: any[]) => any)) {
    for (let buf: (Node | string)[] = [], i = 0; i < this.#length; ++i) {
      serializeToString(this[i], buf, nodeFilter as (...args: any[]) => any);
    }
  }

  indexOf(node: Node) {
    return Array.prototype.indexOf.call(this, node);
  }

  [Symbol.iterator]() {
    let index = 0;

    return {
      next: () => {
        if (index < this.#length) {
          return {
            value: this[index++],
            done: false,
          };
        } else {
          return {
            done: true,
          };
        }
      },
    };
  }
}

export class LiveNodeList extends NodeList {
  #length: number = 0;

  override get length() {
    this.#updateLiveList();
    return this.#length;
  }

  #updateLiveList() {
    const inc = this._node._inc || this._node.ownerDocument._inc;
    if (this._inc !== inc) {
      const ls = this._refresh(this._node);
      this.#length = ls.length;
      if (!this.#length || ls.length < this.#length) {
        for (let i = ls.length; i in this; i++) {
          if (Object.hasOwn(this, i)) {
            delete this[i];
          }
        }
      }
      copy(ls, this);
      this._inc = inc;
    }
  }
}

class Element {}

class Attr extends Node {
  constructor(symbol: symbol) {
    super(symbol);
    checkSymbol(symbol);
  }
}

export class NamedNodeMap {
  [key: number]: Node;

  length = 0;

  #onRemoveAttribute(doc: Document, el: Element, newAttr: Attr, remove?: boolean) {
    doc && doc._inc++;

    const ns = newAttr.namespaceURI;
    if (ns === NAMESPACE.XMLNS) {
      delete el._nsMap[newAttr.prefix ? newAttr.localName : ''];
    }
  }

  #findNodeIndex(node: Node) {
    return Array.prototype.indexOf.call(this, node);
  }

  #addNamedNode(
    el: Element,
    list: NamedNodeMap,
    newAttr: Attr,
    oldAttr?: Attr,
  ) {
    if (oldAttr) {
      list[this.#findNodeIndex(oldAttr)] = newAttr;
    } else {
      this[this.length] = newAttr;
      this.length++;
    }

    if (el) {
      newAttr.ownerElement = el;
      const doc = el.ownerDocument;
      if (doc) {
        oldAttr && 
      }
    }
  }
}
