/** Can receive a RegExp constructor for testing purposes. */
export const detectUnicodeSupport = (
  RegExpImpl?: new (...args: any[]) => any,
) => {
  try {
    if (typeof RegExpImpl !== "function") {
      RegExpImpl = RegExp;
    }

    const match = new RegExpImpl("\u{1d306}", "u").exec("𝌆");
    return Boolean(match) && (match || {})[0]?.length === 2;
  } catch {
    return false;
  }
};

export const UNICODE_SUPPORT = detectUnicodeSupport();

/** Strips enclosing square brackets around a regular expression source. */
export const flatten = (regexp: RegExp) => {
  if (regexp.source[0] !== "[") {
    throw new Error(`/${regexp.source}/ cannot be used with chars`);
  }
  return regexp.source.slice(1, regexp.source.lastIndexOf("]"));
};

/**
 * Replaces all presence of a given string within a regular expression's source
 * and returns the new RegExp.
 */
export const charsWithout = (regexp: RegExp, search: string) => {
  if (regexp.source[0] !== "[") {
    throw new Error(`/${regexp.source}/ cannot be used with charsWithout`);
  }

  if (typeof search !== "string") {
    throw new Error("search must be a string", { cause: search });
  }

  if (regexp.source.indexOf(search) === -1) {
    throw new Error(`"${search}" is not in /${regexp.source}/`);
  }

  if (search === "-" && regexp.source.indexOf(search) !== 1) {
    throw new Error(
      `"${search}" is not at the first position of  /${regexp.source}/`,
    );
  }

  return new RegExp(
    regexp.source.replace(search, ""),
    UNICODE_SUPPORT ? "u" : "",
  );
};

/**
 * Internal function used to create functions that combine regular expressions.
 * @param beforeCombine
 * Receives the array of regular expressions/strings and can do some side effect
 * with it. This occurs before the array is iterated over.
 * @param checker
 * This callback is operated on every regular expression. Use it to throw if a
 * specific RegExp/string has some undesirable characteristic.
 * @returns
 * A "combiner" function which takes any number of RegExp instances or strings
 * and combines them into a single regular expression.
 */
export const getCombiner = (
  beforeCombine: undefined | ((regexps: (RegExp | string)[]) => void),
  checker: undefined | ((regexp: RegExp | string) => void),
) => {
  const mapper = (regexp: RegExp | string) => {
    if (typeof checker === "function") {
      checker(regexp);
    }
    return regexp instanceof RegExp ? regexp.source : regexp;
  };

  return (...regexps: (RegExp | string)[]) => {
    if (typeof beforeCombine === "function") {
      beforeCombine(regexps);
    }

    return new RegExp(
      regexps.map(mapper).join(""),
      UNICODE_SUPPORT ? "mu" : "m",
    );
  };
};

/**
 * Combines regular expressions into a single regular expression.
 * An error is thrown if any RegExp::source/string is simply '|'.
 *
 * @example
 * ```
 * const combined = combine(/abc/, "123");
 * expect(combined instanceof RegExp).toBe(true);
 * expect(combined.source).toEqual("abc123");
 * ```
 */
export const combine = getCombiner(undefined, (regexp) => {
  if (typeof regexp === "string" && regexp === "|") {
    throw new Error(
      "use group instead of combine to wrap expressions with `|`!",
    );
  }
});

/**
 * Combines regular expressions into a single regular expression that uses a
 * non-capturing group.
 * An error is thrown if no arguments are provided.
 *
 * @example
 * ```
 * const grouped = group(/abc/, "123");
 * expect(grouped instanceof RegExp).toBe(true);
 * expect(grouped.source).toEqual("(?:abc123)");
 * ```
 */
export const group = getCombiner((regexps) => {
  if (regexps.length === 0) {
    throw new Error("no parameters provided");
  }

  regexps.unshift("(?:");
  regexps.push(")");
}, undefined);

/**
 * The character "�".
 * Usually appears in wrongly-converted strings.
 * @see https://en.wikipedia.org/wiki/Specials_(Unicode_block)#Replacement_character
 * @see https://nodejs.dev/en/api/v18/buffer/#buffers-and-character-encodings
 * @see https://www.unicode.org/faq/utf_bom.html#BOM
 * @readonly
 */
export const UNICODE_REPLACEMENT_CHARACTER = "\uFFFD";

/**
 * Any Unicode character, excluding the surrogate blocks, FFFE, and FFFF.
 *
 * `[2] Char ::= #x9 | #xA | #xD | [#x20-#xD7FF] | [#xE000-#xFFFD] | [#x10000-#x10FFFF]`
 *
 * `[2] Char ::= [#x1-#xD7FF] | [#xE000-#xFFFD] | [#x10000-#x10FFFF]`
 *
 * `[2a] RestrictedChar ::= [#x1-#x8] | [#xB-#xC] | [#xE-#x1F] | [#x7F-#x84] | [#x86-#x9F]`
 *
 * @see https://www.w3.org/TR/xml/#NT-Char
 * @see https://www.w3.org/TR/xml11/#NT-Char
 * @see https://www.w3.org/TR/xml11/#NT-RestrictedChar
 * @see https://www.w3.org/TR/xml11/#charsets
 */
export const CHAR = (() => {
  // deno-lint-ignore no-control-regex
  const char = /[-\x09\x0A\x0D\x20-\x2C\x2E-\uD7FF\uE000-\uFFFD]/;

  if (UNICODE_SUPPORT) {
    return combine(
      "[",
      flatten(char),
      "\\u{10000}-\\u{10FFFF}",
      "]",
    );
  }

  return char;
})();

// deno-lint-ignore no-control-regex
const _SChar = /[\x20\x09\x0D\x0A]/;

export const SCHAR_s = flatten(_SChar);

/**
 * `[3] S ::= (#x20 | #x9 | #xD | #xA)+`
 *
 * @see https://www.w3.org/TR/xml11/#NT-S
 */
export const S = combine(_SChar, "+");

/**
 * Optional whitespace described as `S?` n the grammar
 */
export const S_OPT = combine(_SChar, "*");

/**
 * Legal characters to start a name of anything in XML.
 *
 * `[4] NameStartChar ::= ":" | [A-Z] | "_" | [a-z] | [#xC0-#xD6] | [#xD8-#xF6] | [#xF8-#x2FF] | [#x370-#x37D] | [#x37F-#x1FFF] | [#x200C-#x200D] | [#x2070-#x218F] | [#x2C00-#x2FEF] | [#x3001-#xD7FF] | [#xF900-#xFDCF] | [#xFDF0-#xFFFD] | [#x10000-#xEFFFF]`
 *
 * @see https://www.w3.org/TR/xml11/#NT-NameStartChar
 */
const NAME_START_CHAR = (() => {
  const char =
    /[:_a-zA-Z\xC0-\xD6\xD8-\xF6\xF8-\u02FF\u0370-\u1FFF\u200C-\u200D\u2070-\u218F\u2C00-\u2FEF\u3001-\uD7FF\uF900-\uFDCF\uFDF0-\uFFFD]/; // without \u10000-\uEFFFF
  if (UNICODE_SUPPORT) {
    return combine(
      "[",
      flatten(char),
      "\\u{10000}-\\u{10FFFF}",
      "]",
    );
  }
  return char;
})();

export const NAME_START_CHAR_s = flatten(NAME_START_CHAR);

/**
 * Legal characters with can follow a NameStarChar for any name in XML.
 *
 * `[4a] NameChar ::= NameStartChar | "-" | "." | [0-9] | #xB7 | [#x0300-#x036F] | [#x203F-#x2040]`
 *
 * @see https://www.w3.org/TR/xml11/#NT-NameChar
 */
export const NAME_CHAR = combine(
  "[",
  NAME_START_CHAR_s,
  flatten(/[-.0-9\xB7]/),
  flatten(/[\u0300-\u036F\u203F-\u2040]/),
  "]",
);

/**
 * Legal names in XML.
 *
 * `[5] Name ::= NameStartChar (NameChar)*`
 *
 * @see https://www.w3.org/TR/xml11/#NT-Name
 */
export const NAME = combine(NAME_START_CHAR, NAME_CHAR, "*");

/**
 * `[7] Nmtoken ::= (NameChar)+`
 *
 * @see https://www.w3.org/TR/xml11/#NT-Nmtoken
 */
export const NMTOKEN = combine(NAME_CHAR, "+");

/**
 * `[68] EntityRef ::= '&' Name ';'` [WFC: Entity Declared] [VC: Entity Declared] [WFC: Parsed Entity] [WFC: No Recursion]
 *
 * @see https://www.w3.org/TR/xml11/#NT-EntityRef
 */
export const ENTITY_REF = combine("&", NAME, ";");

/**
 * `[66] CharRef ::= '&#' [0-9]+ ';' | '&#x' [0-9a-fA-F]+ ';'` [WFC: Legal Character]
 *
 * @see https://www.w3.org/TR/xml11/#NT-CharRef
 */
export const CHAR_REF = group(/&#[0-9]+;|&#x[0-9a-fA-F]+;/);

export const REFERENCE = group(ENTITY_REF, "|", CHAR_REF);

/**
 * "Parameter-Entity references".
 *
 * `[69] PEReference ::= '%' Name ';'`
 *
 * @see https://www.w3.org/TR/xml11/#NT-PEReference
 * @see https://docstore.mik.ua/orelly/xml/xmlnut/ch03_07.htm
 */
export const PE_REFERENCE = combine("%", NAME, ";");

/**
 * `[9] EntityValue ::= '"' ([^%&"] | PEReference | Reference)* '"' | "'" ([^%&'] | PEReference | Reference)* "'"`
 *
 * @see https://www.w3.org/TR/xml11/#NT-EntityValue
 */
export const ENTITY_VALUE = group(
  combine(
    '"',
    group(/[^%&"]/, "|", PE_REFERENCE, "|", REFERENCE),
    "*",
    '"',
  ),
  "|",
  combine(
    "'",
    group(/[^%&']/, "|", PE_REFERENCE, "|", REFERENCE),
    "*",
    "'",
  ),
);

/**
 * `[10] AttValue ::= '"' ([^<&"] | Reference)* '"' | "'" ([^<&'] | Reference)* "'"`
 *
 * @see https://www.w3.org/TR/xml11/#NT-AttValue
 */
export const ATT_VALUE = group(
  '"',
  group(/[^<&"]/, "|", REFERENCE),
  "*",
  '"',
  "|",
  "'",
  group(/[^<&']/, "|", REFERENCE),
  "*",
  "'",
);

/**
 * NameStartChar without ":"
 * @see https://www.w3.org/TR/xml-names/#ns-decl
 * @see https://www.w3.org/TR/xml-names/#ns-qualnames
 */
export const NC_NAME_START_CHART = charsWithout(NAME_START_CHAR, ":");

/**
 * An XML NameChar, minus the ":"
 *
 * `[5] NCNameChar ::= NameChar - ':'`
 *
 * @see https://www.w3.org/TR/xml-names/#orphans
 */
export const NC_NAME_CHAR = charsWithout(NAME_CHAR, ":");

/**
 * An XML Name, minus the ":"
 *
 * `[4] NCName ::= Name - (Char* ':' Char*)`
 *
 * @see https://www.w3.org/TR/xml-names/#NT-NCName
 */
export const NC_NAME = combine(NC_NAME_START_CHART, NC_NAME_CHAR, "*");

/**


```
[7] QName ::= PrefixedName | UnprefixedName
				  === (NCName ':' NCName) | NCName
				  === NCName (':' NCName)?
[8] PrefixedName ::= Prefix ':' LocalPart
								 === NCName ':' NCName
[9] UnprefixedName ::= LocalPart
									 === NCName
[10] Prefix ::= NCName
[11] LocalPart ::= NCName
```

@see https://www.w3.org/TR/xml-names/#ns-qualnames
*/
export const QNAME = combine(NC_NAME, group(":", NC_NAME), "?");
export const QNAME_EXACT = combine("^", QNAME, "$");
export const QNAME_GROUP = combine("(", QNAME, ")");

/**
 * `[11] SystemLiteral ::= ('"' [^"]* '"') | ("'" [^']* "'")`
 *
 * @see https://www.w3.org/TR/xml11/#NT-SystemLiteral
 */
export const SYSTEM_LITERAL = group(/"[^"]*"|'[^']*'/);

/**
 *  target /xml/i is not excluded!
 *
 * ```
 * [17] PITarget    ::= Name - (('X' | 'x') ('M' | 'm') ('L' | 'l'))
 * [16] PI    ::= '<?' PITarget (S (Char* - (Char* '?>' Char*)))? '?>'
 * ```
 *
 * @see https://www.w3.org/TR/xml11/#NT-PI
 */
export const PI = combine(
  /^<\?/,
  "(",
  NAME,
  ")",
  group(S, "(", CHAR, "*?)"),
  "?",
  /\?>/,
);

/**
 * `[13] PubidChar ::= #x20 | #xD | #xA | [a-zA-Z0-9] | [-'()+,./:=?;!*#@$_%]`
 *
 * @see https://www.w3.org/TR/xml11/#NT-PubidChar
 */
// deno-lint-ignore no-control-regex
export const PUBID_CHAR = /[\x20\x0D\x0Aa-zA-Z0-9-'()+,./:=?;!*#@$_%]/;

/**
 * `[12] PubidLiteral ::= '"' PubidChar* '"' | "'" (PubidChar - "'")* "'"`
 *
 * @see https://www.w3.org/TR/xml11/#NT-PubidLiteral
 */
export const PUBID_LITERAL = group(
  '"',
  PUBID_CHAR,
  '*"',
  "|",
  "'",
  charsWithout(PUBID_CHAR, "'"),
  "*'",
);

export const COMMENT_START = "<!--";
export const COMMENT_END = "-->";

/**
 * `[15] Comment ::= '<!--' ((Char - '-') | ('-' (Char - '-')))* '-->'`
 *
 * @see https://www.w3.org/TR/xml11/#NT-Comment
 */
export const COMMENT = combine(
  COMMENT_START,
  group(
    charsWithout(CHAR, "-"),
    "|",
    combine("-", charsWithout(CHAR, "-")),
  ),
  "*",
  COMMENT_END,
);

const PCDATA = "#PCDATA";

/**
 * `[51] Mixed ::= '(' S? '#PCDATA' (S? '|' S? Name)* S? ')*' | '(' S? '#PCDATA' S? ')'`
 * `[51] Mixed ::= '(' S? '#PCDATA' (S? '|' S? QName)* S? ')*' | '(' S? '#PCDATA' S? ')'`
 *
 * @see https://www.w3.org/TR/xml11/#NT-Mixed
 * @see  https://www.w3.org/TR/xml-names/#NT-Mixed
 */
export const MIXED = group(
  combine(
    /\(/,
    S_OPT,
    PCDATA,
    group(S_OPT, /\|/, S_OPT, QNAME),
    "*",
    S_OPT,
    /\)\*/,
  ),
  "|",
  combine(/\(/, S_OPT, PCDATA, S_OPT, /\)/),
);

const CHILDREN_QUANTITY = /[?*+]?/;

/**
 * Simplification to solve circular referencing (but doesn't check validity
 * constraint "Proper Group/PE Nesting").
 *
 * `[47] children ::= (choice | seq) ('?' | '*' | '+')?`
 */
export const CHILDREN = combine(
  /\([^>]+\)/,
  CHILDREN_QUANTITY, /*combinePipeable(choice, '|', seq), CHILDREN_QUANTITY*/
);

/**
 * `[46] contentspec ::= 'EMPTY' | 'ANY' | Mixed | children`
 *
 * @see https://www.w3.org/TR/xml11/#NT-contentspec
 */
export const CONTENT_SPEC = group(
  "EMPTY",
  "|",
  "ANY",
  "|",
  MIXED,
  "|",
  CHILDREN,
);

const ELEMENTDECL_START = "<!ELEMENT";

/**
 * because of https://www.w3.org/TR/xml11/#NT-PEReference, since xmldom is not
 * supporting replacements of PEReferences in the DTD, this also supports
 * PEReference in the possible places
 *
 * `[45] elementdecl ::= '<!ELEMENT' S Name S contentspec S? '>'`
 * `[17] elementdecl ::= '<!ELEMENT' S QName S contentspec S? '>'`
 *
 * @see https://www.w3.org/TR/xml11/#NT-elementdecl
 * @see https://www.w3.org/TR/xml-names/#NT-elementdecl
 */
export const ELEMENT_DECL = combine(
  ELEMENTDECL_START,
  S,
  group(QNAME, "|", PE_REFERENCE),
  S,
  group(CONTENT_SPEC, "|", PE_REFERENCE),
  S_OPT,
  ">",
);

/**
 * [VC: Notation Attributes] [VC: One Notation Per Element Type] [VC: No Notation on Empty Element] [VC: No Duplicate Tokens]
 *
 * `[58] NotationType ::= 'NOTATION' S '(' S? Name (S? '|' S? Name)* S? ')'`
 *
 * @see https://www.w3.org/TR/xml11/#NT-NotationType
 */
export const NOTATION_TYPE = combine(
  "NOTATION",
  S,
  /\(/,
  S_OPT,
  NAME,
  group(S_OPT, /\|/, S_OPT, NAME),
  "*",
  S_OPT,
  /\)/,
);

/**
 * [VC: Enumeration] [VC: No Duplicate Tokens]
 *
 * `[59] Enumeration ::= '(' S? Nmtoken (S? '|' S? Nmtoken)* S? ')'`
 *
 * @see https://www.w3.org/TR/xml11/#NT-Enumeration
 */
export const ENUMERATION = combine(
  /\(/,
  S_OPT,
  NMTOKEN,
  group(S_OPT, /\|/, S_OPT, NMTOKEN),
  "*",
  S_OPT,
  /\)/,
);

/**
 * `[57] EnumeratedType ::= NotationType | Enumeration`
 *
 * @see https://www.w3.org/TR/xml11/#NT-EnumeratedType
 */
export const ENUMERATED_TYPE = group(
  NOTATION_TYPE,
  "|",
  ENUMERATION,
);

/**
 * ```
 * [55] StringType ::= 'CDATA'
 * [56] TokenizedType ::= 'ID' [VC: ID] [VC: One ID per Element Type] [VC: ID Attribute Default]
 *    | 'IDREF' [VC: IDREF]
 *    | 'IDREFS' [VC: IDREF]
 * 	  | 'ENTITY' [VC: Entity Name]
 * 	  | 'ENTITIES' [VC: Entity Name]
 * 	  | 'NMTOKEN' [VC: Name Token]
 * 	  | 'NMTOKENS' [VC: Name Token]
 *  [54] AttType ::= StringType | TokenizedType | EnumeratedType
 * ```
 */
export const ATT_TYPE = group(
  /CDATA|ID|IDREF|IDREFS|ENTITY|ENTITIES|NMTOKEN|NMTOKENS/,
  "|",
  ENUMERATED_TYPE,
);

/**
 * [WFC: No < in Attribute Values] [WFC: No External Entity References]
 * [VC: Fixed Attribute Default] [VC: Required Attribute] [VC: Attribute Default Value Syntactically Correct]
 *
 * `[60] DefaultDecl ::= '#REQUIRED' | '#IMPLIED' | (('#FIXED' S)? AttValue)`
 */
export const DEFAULT_DECL = group(
  /#REQUIRED|#IMPLIED/,
  "|",
  group(group("#FIXED", S), "?", ATT_VALUE),
);

/**
 * xmldom is not distinguishing between QName and NSAttName on this level to
 * support XML without namespaces in DTD we can not restrict it to QName
 *
 * ```
 * [53] AttDef ::= S Name S AttType S DefaultDecl
 *
 * [1] NSAttName ::= PrefixedAttName | DefaultAttName
 * [2] PrefixedAttName ::= 'xmlns:' NCName [NSC: Reserved Prefixes and Namespace Names]
 * [3] DefaultAttName ::= 'xmlns'
 * [21] AttDef ::= S (QName | NSAttName) S AttType S DefaultDecl
 * 						 === S Name S AttType S DefaultDecl
 * ```
 *
 * @see https://www.w3.org/TR/xml-names/#NT-AttDef
 * @see https://www.w3.org/TR/xml11/#NT-AttDef
 */
export const ATT_DEF = group(
  S,
  NAME,
  S,
  ATT_TYPE,
  S,
  DEFAULT_DECL,
);

const ATTLIST_DECL_START = "<!ATTLIST";

/**
 * to support XML without namespaces in DTD we can not restrict it to QName
 *
 * `[52] AttlistDecl ::= '<!ATTLIST' S Name AttDef* S? '>'`
 * `[20] AttlistDecl ::= '<!ATTLIST' S QName AttDef* S? '>'`
 *
 * @see https://www.w3.org/TR/xml11/#NT-AttlistDecl
 * @see https://www.w3.org/TR/xml-names/#NT-AttlistDecl
 */
export const ATTLIST_DECL = combine(
  ATTLIST_DECL_START,
  S,
  NAME,
  ATT_DEF,
  "*",
  S_OPT,
  ">",
);

/** @see https://html.spec.whatwg.org/multipage/urls-and-fetching.html#about:legacy-compat */
export const ABOUT_LEGACY_COMPAT = "about:legacy-compat";

export const ABOUT_LEGACY_COMPAT_SystemLiteral = group(
  '"' + ABOUT_LEGACY_COMPAT + '"',
  "|",
  "'" + ABOUT_LEGACY_COMPAT + "'",
);

export const SYSTEM = "SYSTEM";
export const PUBLIC = "PUBLIC";
/**
 * `[75] ExternalID ::= 'SYSTEM' S SystemLiteral | 'PUBLIC' S PubidLiteral S SystemLiteral`
 * @see https://www.w3.org/TR/xml11/#NT-ExternalID
 */
export const EXTERNAL_ID = group(
  group(SYSTEM, S, SYSTEM_LITERAL),
  "|",
  group(PUBLIC, S, PUBID_LITERAL, S, SYSTEM_LITERAL),
);

export const EXTERNAL_ID_match = combine(
  "^",
  group(
    group(
      SYSTEM,
      S,
      "(?<SystemLiteralOnly>",
      SYSTEM_LITERAL,
      ")",
    ),
    "|",
    group(
      PUBLIC,
      S,
      "(?<PubidLiteral>",
      PUBID_LITERAL,
      ")",
      S,
      "(?<SystemLiteral>",
      SYSTEM_LITERAL,
      ")",
    ),
  ),
);

/**
 * `[76] NDataDecl ::= S 'NDATA' S Name` [VC: Notation Declared]
 *
 * @see https://www.w3.org/TR/xml11/#NT-NDataDecl
 */
export const N_DATA_DECL = group(S, "NDATA", S, NAME);

/**
 * `[73] EntityDef ::= EntityValue | (ExternalID NDataDecl?)`
 *
 * @see https://www.w3.org/TR/xml11/#NT-EntityDef
 */
export const ENTITY_DEF = group(
  ENTITY_VALUE,
  "|",
  group(EXTERNAL_ID, N_DATA_DECL, "?"),
);

const ENTITY_DECL_START = "<!ENTITY";
/**
 * `[71] GEDecl ::= '<!ENTITY' S Name S EntityDef S? '>'`
 *
 * @see https://www.w3.org/TR/xml11/#NT-GEDecl
 */
export const GE_DECL = combine(
  ENTITY_DECL_START,
  S,
  NAME,
  S,
  ENTITY_DEF,
  S_OPT,
  ">",
);

/**
 * `[74] PEDef ::= EntityValue | ExternalID`
 *
 * @see https://www.w3.org/TR/xml11/#NT-PEDef
 */
export const PE_DEF = group(ENTITY_VALUE, "|", EXTERNAL_ID);

/**
 * `[72] PEDecl ::= '<!ENTITY' S '%' S Name S PEDef S? '>'`
 *
 * @see https://www.w3.org/TR/xml11/#NT-PEDecl
 */
export const PE_DECL = combine(
  ENTITY_DECL_START,
  S,
  "%",
  S,
  NAME,
  S,
  PE_DEF,
  S_OPT,
  ">",
);

/**
 * `[70] EntityDecl ::= GEDecl | PEDecl`
 *
 * @see https://www.w3.org/TR/xml11/#NT-EntityDecl
 */
export const ENTITY_DECL = group(GE_DECL, "|", PE_DECL);

/**
 * `[83] PublicID    ::= 'PUBLIC' S PubidLiteral`
 *
 * @see https://www.w3.org/TR/xml11/#NT-PublicID
 */
export const PUBLIC_ID = combine(PUBLIC, S, PUBID_LITERAL);

/**
 * `[82] NotationDecl    ::= '<!NOTATION' S Name S (ExternalID | PublicID) S? '>'` [VC: Unique Notation Name]
 *
 * @see https://www.w3.org/TR/xml11/#NT-NotationDecl
 */
export const NOTATION_DECL = combine(
  "<!NOTATION",
  S,
  NAME,
  S,
  group(EXTERNAL_ID, "|", PUBLIC_ID),
  S_OPT,
  ">",
);

/**
 * `[25] Eq ::= S? '=' S?`
 *
 * @see https://www.w3.org/TR/xml11/#NT-Eq
 */
export const EQ = combine(S_OPT, "=", S_OPT);

/**
 * `[26] VersionNum ::= '1.' [0-9]+`
 * `[26] VersionNum ::= '1.1'`
 *
 * @see https://www.w3.org/TR/xml/#NT-VersionNum
 * @see https://www.w3.org/TR/xml11/#NT-VersionNum
 */
const VERSION_NUM = /1[.]\d+/;

/**
 * `[24] VersionInfo ::= S 'version' Eq ("'" VersionNum "'" | '"' VersionNum '"')`
 *
 * @see https://www.w3.org/TR/xml11/#NT-VersionInfo
 */
export const VERSION_INFO = combine(
  S,
  "version",
  EQ,
  group("'", VERSION_NUM, "'", "|", '"', VERSION_NUM, '"'),
);

/**
 * `[81] EncName ::= [A-Za-z] ([A-Za-z0-9._] | '-')*`
 *
 * @see https://www.w3.org/TR/xml11/#NT-EncName
 */
export const ENC_NAME = /[A-Za-z][-A-Za-z0-9._]*/;

/**
 * `[80] EncodingDecl ::= S 'encoding' Eq ('"' EncName '"' | "'" EncName "'" )`
 *
 * @see https://www.w3.org/TR/xml11/#NT-EncDecl
 */
export const ENCODING_DECL = group(
  S,
  "encoding",
  EQ,
  group('"', ENC_NAME, '"', "|", "'", ENC_NAME, "'"),
);

/**
 * `[32] SDDecl ::= S 'standalone' Eq (("'" ('yes' | 'no') "'") | ('"' ('yes' | 'no') '"'))`
 *
 * @see https://www.w3.org/TR/xml11/#NT-SDDecl
 */
export const SD_DECL = group(
  S,
  "standalone",
  EQ,
  group(
    "'",
    group("yes", "|", "no"),
    "'",
    "|",
    '"',
    group("yes", "|", "no"),
    '"',
  ),
);

/**
 * [23] XMLDecl ::= '<?xml' VersionInfo EncodingDecl? SDDecl? S? '?>'
 *
 * @see https://www.w3.org/TR/xml11/#NT-XMLDecl
 */
export const XML_DECL = combine(
  /^<\?xml/,
  VERSION_INFO,
  ENCODING_DECL,
  "?",
  SD_DECL,
  "?",
  S_OPT,
  /\?>/,
);

export const DOCTYPE_DECL_START = "<!DOCTYPE";

export const CDATA_START = "<![CDATA[";
export const CDATA_END = "]]>";

const CD_START = /<!\[CDATA\[/;
const CD_END = /\]\]>/;
export const C_DATA = combine(CHAR, "*?", CD_END);

/**
 * `[18]   	CDSect	   ::=   	CDStart CData CDEnd`
 * `[19]   	CDStart	   ::=   	'<![CDATA['`
 * `[20]   	CData	   ::=   	(Char* - (Char* ']]>' Char*))`
 * `[21]   	CDEnd	   ::=   	']]>'`
 *
 * @see https://www.w3.org/TR/xml/#dt-cdsection
 */
export const CD_SECT = combine(CD_START, C_DATA);
