import { assertSnapshot } from "@std/testing/snapshot";
import { describe, it } from "@std/testing/bdd";
import { existsSync as fileExistsSync } from "@std/fs/exists";
import { expect } from "@std/expect/expect";
import {
  ABOUT_LEGACY_COMPAT_SystemLiteral,
  ATTLIST_DECL,
  CD_SECT,
  CHAR,
  charsWithout,
  combine,
  COMMENT,
  detectUnicodeSupport,
  ELEMENT_DECL,
  ENTITY_DECL,
  ENTITY_VALUE,
  EXTERNAL_ID,
  EXTERNAL_ID_match,
  flatten,
  group,
  NAME,
  NAME_CHAR,
  NOTATION_DECL,
  PE_REFERENCE,
  PI,
  pipe,
  PUBID_LITERAL,
  QNAME,
  QNAME_EXACT,
  QNAME_GROUP,
  REFERENCE,
  S,
  S_OPT,
  SCHAR_s,
  SYSTEM_LITERAL,
  UNICODE_SUPPORT,
  XML_DECL,
} from "../src/grammar.ts";
import { each } from "./test-utils/each.ts";
import { range } from "./test-utils/range.ts";
import { expectMatch } from "./test-utils/expect-matches.ts";

describe("ATTLIST_DECL", () => {
  it("should contain Name expected number of times", () => {
    expect(ATTLIST_DECL.source.split(NAME.source)).toHaveLength(7);
  });

  it("should contain S expected number of times", () => {
    expect(ATTLIST_DECL.source.split(S.source)).toHaveLength(7);
  });

  it("should contain S_OPT expected number of times", () => {
    expect(ATTLIST_DECL.source.split(S_OPT.source)).toHaveLength(10);
  });

  each(
    [
      `<!ATTLIST target Name CDATA "">`,
      `<!ATTLIST target Name ID #REQUIRED >`,
      `<!ATTLIST target Name ID 'AttValue'>`,
      `<!ATTLIST target Name IDREF '&EntityRef;&#123;&#x0A; AttValue'>`,
      `<!ATTLIST target Name IDREFS #IMPLIED >`,
      `<!ATTLIST target Name ENTITY #FIXED 'AttValue'>`,
      `<!ATTLIST target Name ENTITIES 'AttValue'>`,
      `<!ATTLIST target Name NMTOKEN 'AttValue'>`,
      `<!ATTLIST target Name NMTOKENS 'AttValue'>`,
      `<!ATTLIST target Name (Enumeration|NmToken) 'AttValue'>`,
      `<!ATTLIST target Name NOTATION (Name|Name) 'AttValue'>`,
    ],
    "should match different AttType and AttValue %{}",
    (attListDecl) => () => {
      expectMatch(ATTLIST_DECL, attListDecl);
    },
  );

  each(
    [
      `<!ATTLIST termdef
id      ID      #REQUIRED
name    CDATA   #IMPLIED>`,
      `<!ATTLIST list type (bullets|ordered|glossary) "ordered">`,
      `<!ATTLIST form method  CDATA   #FIXED "POST">`,
      `<!ATTLIST poem xml:space (default|preserve) 'preserve'>`,
      `<!ATTLIST pre xml:space (preserve) #FIXED 'preserve'>`,
      `<!ATTLIST target xml:lang CDATA #IMPLIED>`,
      `<!ATTLIST poem xml:lang CDATA 'fr'>`,
      `<!ATTLIST gloss xml:lang CDATA 'en'>`,
      `<!ATTLIST note xml:lang CDATA 'en'>`,
      // https://en.wikipedia.org/wiki/Document_type_definition#Attribute_list_declarations
      `<!ATTLIST img
   src    CDATA          #REQUIRED
   id     ID             #IMPLIED
   sort   CDATA          #FIXED "true"
   print  (yes | no) "yes"
>`,
    ],
    "should match examples from spec %{}",
    (attListDecl) => () => {
      expectMatch(ATTLIST_DECL, attListDecl);
    },
  );

  each(
    [`<!ATTLIST\n \r\tpoem\n \r\txml:space\n \r\t(default|preserve)\n \r\t'preserve'\n \r\t>`],
    "should accept any type of whitespace in various places",
    (attListDecl) => () => {
      expectMatch(ATTLIST_DECL, attListDecl);
    },
  );
});

describe("ENTITY_VALUE", () => {
  it("should contain NAME the expected number of times", () => {
    // 2 times via PEReference
    // 2 times via Reference
    expect(ENTITY_VALUE.source.split(NAME.source)).toHaveLength(5);
  });
});

describe("ENTITY_DECL", () => {
  it("should contain NAME the expected number of times", () => {
    // 4 times in each of the two EntityValues
    expect(ENTITY_DECL.source.split(ENTITY_VALUE.source)).toHaveLength(3);
    // 3 times visible in the inlined code above
    expect(ENTITY_DECL.source.split(NAME.source)).toHaveLength(12);
  });

  it("should contain ExternalID twice", () => {
    expect(ENTITY_DECL.source.split(EXTERNAL_ID.source)).toHaveLength(3);
  });

  it("should contain S 13 times", () => {
    expect(ENTITY_DECL.source.split(S.source)).toHaveLength(14);
  });

  it("should contain S_OPT twice", () => {
    expect(ENTITY_DECL.source.split(S_OPT.source)).toHaveLength(3);
  });

  each(
    [
      `<!ENTITY d "&#xD;">`,
      `<!ENTITY a "&#xA;">`,
      `<!ENTITY da "&#xD;&#xA;">`,
      `<!ENTITY % draft 'INCLUDE' >`,
      `<!ENTITY % final 'IGNORE' >`,
      `<!ENTITY % ISOLat2
SYSTEM "http://www.xml.com/iso/isolat2-xml.entities" >`,
      `<!ENTITY Pub-Status "This is a pre-release of the
specification.">`,
      `<!ENTITY open-hatch
SYSTEM "http://www.textuality.com/boilerplate/OpenHatch.xml">`,
      `<!ENTITY open-hatch
PUBLIC "-//Textuality//TEXT Standard open-hatch boilerplate//EN"
"http://www.textuality.com/boilerplate/OpenHatch.xml">`,
      `<!ENTITY hatch-pic
SYSTEM "../grafix/OpenHatch.gif"
NDATA gif >`,
      `<!ENTITY % YN '"Yes"' >`,
      `<!ENTITY WhatHeSaid "He said %YN;" >`,
      `<!ENTITY EndAttr "27'" >`,
      `<!ENTITY % pub    "&#xc9;ditions Gallimard" >`,
      `<!ENTITY   rights "All rights reserved" >`,
      `<!ENTITY   book   "La Peste: Albert Camus,
&#xA9; 1947 %pub;. &rights;" >`,
      `<!ENTITY example "<p>An ampersand (&#38;#38;) may be escaped
numerically (&#38;#38;#38;) or with a general entity
(&amp;amp;).</p>" >`,
      `<!ENTITY % xx '&#37;zz;'>`,
      `<!ENTITY % zz '&#60;!ENTITY tricky "error-prone" >' >`,
    ],
    "should match examples from spec %{}",
    (entityDecl) => () => {
      expectMatch(ENTITY_DECL, entityDecl);
    },
  );
});

describe("CDATA", () => {
  it("should not be greedy", () => {
    const match = CD_SECT.exec("<![CDATA[foo]]>]]>");
    expect((match || {})[0]).toBe("<![CDATA[foo]]>");
  });

  each(
    [
      "<![CDATA[]]>",
      "<![CDATA[\t\n\r\x7F\x84\x85\x86\x9F\uE000\uFFFD\u{10000}\u{10FFFF}]]>",
    ],
    "should match %u{}",
    (cddata) => () => {
      expect(CD_SECT.test(cddata)).toBe(true);
    },
  );

  each(
    [
      "",
      "<![CDATA[foo",
      "<![CDATA[\x01]]>", // restricted char
      "<![CDATA[\x08]]>", // restricted char
      "<![CDATA[\x0B]]>", // restricted char
      "<![CDATA[\x0C]]>", // restricted char
      "<![CDATA[\x0E]]>", // restricted char
      "<![CDATA[\x1F]]>", // restricted char
      "<![CDATA[\uD800]]>",
      "<![CDATA[\uDFFF]]>",
      "<![CDATA[\uFFFE]]>",
      "<![CDATA[\uFFFF]]>",
    ],
    "should not match %u{}",
    (invalidCddata) => () => {
      expect(CD_SECT.test(invalidCddata)).toBe(false);
    },
  );
});

describe("CHAR", () => {
  each(
    [
      " ",
      "\t",
      "\n",
      "\r",
      "\x7F",
      "\x84",
      "\x85",
      "\x86",
      "\x9F",
      "\uE000",
      "\uFFFD",
      "\u{10000}",
      "\u{10FFFF}",
    ],
    "should match %u{}",
    (char) => () => {
      expectMatch(CHAR, char);
    },
  );

  each(
    [
      "\x01", // restricted char
      "\x08", // restricted char
      "\x0B", // restricted char
      "\x0C", // restricted char
      "\x0E", // restricted char
      "\x1F", // restricted char
      "\uD800",
      "\uDFFF",
      "\uFFFE",
      "\uFFFF",
    ],
    "should not match %u{}",
    (invalidChar) => () => {
      expect(CHAR.test(invalidChar)).toBe(false);
    },
  );
});

describe("COMMENT", () => {
  each(
    [
      "<!-- -->",
      "<!---->",
      "<!--- -->",
      "<!-- - -->",
      "<!--\t-->",
      "<!--\n-->",
      "<!--\r-->",
      "<!-- -->",
      `<!--${range("\x7F", "\x84")}-->`, // restricted char
      "<!--\x85-->",
      `<!--${range("\x86", "\x9F")}-->`, // restricted char
      `<!--${range("\uE000", "\uFFFD")}-->`,
      `<!--${range("\u{10000}", "\u{1FFFF}")}-->`,
      `<!--${range("\u{20000}", "\u{2FFFF}")}-->`,
      `<!--${range("\u{30000}", "\u{3FFFF}")}-->`,
      `<!--${range("\u{40000}", "\u{4FFFF}")}-->`,
      `<!--${range("\u{50000}", "\u{5FFFF}")}-->`,
      `<!--${range("\u{60000}", "\u{6FFFF}")}-->`,
      `<!--${range("\u{70000}", "\u{7FFFF}")}-->`,
      `<!--${range("\u{80000}", "\u{8FFFF}")}-->`,
      `<!--${range("\u{90000}", "\u{9FFFF}")}-->`,
      `<!--${range("\u{100000}", "\u{10FFFF}")}-->`,
    ],
    "comments can contain any Char",
    (comment) => () => {
      expectMatch(COMMENT, comment);
    },
  );

  each(
    [
      "<!-- ->",
      "<!-- --->",
      "<!---- -->",
      "<!--\x01-->", // restricted char
      "<!--\x08-->", // restricted char
      "<!--\x0B-->", // restricted char
      "<!--\x0C-->", // restricted char
      "<!--\x0E-->", // restricted char
      "<!--\x1F-->", // restricted char
      "<!--\uD800-->",
      "<!--\uDFFF-->",
      "<!--\uFFFE-->",
      "<!--\uFFFF-->",
    ],
    "should not match %{}",
    (invalidComment) => () => {
      expect(COMMENT.test(invalidComment)).toBe(false);
    },
  );
});

describe("ELEMENT_DECL", () => {
  it("should contain Name twice", () => {
    expect(ELEMENT_DECL.source.split(NAME.source)).toHaveLength(3);
  });

  it("should contain QName twice", () => {
    expect(ELEMENT_DECL.source.split(QNAME.source)).toHaveLength(3);
  });

  it("should contain PEReference twice", () => {
    expect(ELEMENT_DECL.source.split(PE_REFERENCE.source)).toHaveLength(3);
  });

  it("should contain S twice", () => {
    expect(ELEMENT_DECL.source.split(S.source)).toHaveLength(3);
  });

  it("should contain S_OPT seven times", () => {
    expect(ELEMENT_DECL.source.split(S_OPT.source)).toHaveLength(8);
  });

  each(
    [
      `<!ELEMENT br EMPTY>`,
      `<!ELEMENT container ANY>`,
      `<!ELEMENT p (#PCDATA)>`,
      `<!ELEMENT p ( #PCDATA ) >`,
      `<!ELEMENT p (#PCDATA)*>`,
      `<!ELEMENT p (#PCDATA|emph)*>`,
      `<!ELEMENT p ( #PCDATA | emph | hpme )* >`,
      `<!ELEMENT %name.para; %content.para; >`,
      `<!ELEMENT spec (front, body, back?)>`,
      `<!ELEMENT div1 (head, (p | list | note)*, div2*)>`,
      `<!ELEMENT dictionary-body (%div.mix; | %dict.mix;)*>`,
      `<!ELEMENT p (#PCDATA|a|ul|b|i|em)*>`,
      `<!ELEMENT p (#PCDATA | %font; | %phrase; | %special; | %form;)* >`,
      `<!ELEMENT book (comments*, title, body, supplements?)>`,
      `<!ELEMENT book (title, body, supplements?)>`,
    ],
    "should match examples from spec %{}",
    (elementDecl) => () => {
      expectMatch(ELEMENT_DECL, elementDecl);
    },
  );

  each(
    [`<!ELEMENT\n \r\tName\n \r\tANY\n \r\t>`],
    "should accept arbitrary whitespace in various places",
    (elementDecl) => () => {
      expectMatch(ELEMENT_DECL, elementDecl);
    },
  );
});

describe("SYSTEM_LITERAL", () => {
  each(
    [
      '""',
      "''",
      "'\"'",
      '"\'"',
      `"${flatten(S)}!${range("#", "\xFF")}"`,
      `'${range("!", "&")}${range("(", "\xFF")}${flatten(S)}'`,
    ],
    "should match %{}",
    (systemLiteral) => () => {
      expectMatch(SYSTEM_LITERAL, systemLiteral);
    },
  );

  each(
    ["", '"""', "'''"],
    "should not match %{}",
    (invalidSystemLiteral) => () => {
      expect(combine("^", SYSTEM_LITERAL, "$").test(invalidSystemLiteral)).toBe(
        false,
      );
    },
  );
});

describe("PUBID_LITERAL", () => {
  each(
    [
      '""',
      "''",
      '"\'"',
      `"\x20\x0D\x0Aa-zA-Z0-9-'()+,./:=?;!*#@$_%"`,
      `'\x20\x0D\x0Aa-zA-Z0-9-()+,./:=?;!*#@$_%'`,
    ],
    "should match %{}",
    (pubidLiteral) => () => {
      expectMatch(PUBID_LITERAL, pubidLiteral);
    },
  );

  each(
    ["", '"""', "'\"'", "'''"],
    "should not match %{}",
    (invalidPubidLiteral) => () => {
      expect(combine("^", PUBID_LITERAL, "$").test(invalidPubidLiteral)).toBe(
        false,
      );
    },
  );
});

const VALID_SYSTEM = [`SYSTEM ""`, `SYSTEM ''`, `SYSTEM "'"`, `SYSTEM '"'`];
const VALID_PUBLIC_DOUBLE = [
  `PUBLIC "" ""`,
  `PUBLIC '' ""`,
  `PUBLIC "" ''`,
  `PUBLIC '' ''`,
  `PUBLIC "'" "'"`,
  `PUBLIC '' "'"`,
  `PUBLIC "'" '"'`,
  `PUBLIC '' '"'`,
  `PUBLIC "\x20a-zA-Z0-9-()+,./:=?;!*#@$_%" '"'`,
  `PUBLIC '\x20a-zA-Z0-9-()+,./:=?;!*#@$_%' '"'`,
];

describe("EXTERNAL_ID", () => {
  it("should contain SystemLiteral once", () => {
    expect(EXTERNAL_ID.source.split(SYSTEM_LITERAL.source)).toHaveLength(3);
  });

  it("should contain PubidLiteral once", () => {
    expect(EXTERNAL_ID.source.split(PUBID_LITERAL.source)).toHaveLength(2);
  });

  describe("SYSTEM", () => {
    each(VALID_SYSTEM, "should match %{}", (validSystem) => async (t) => {
      expectMatch(EXTERNAL_ID, validSystem);
      await assertSnapshot(
        t,
        EXTERNAL_ID_match.exec(validSystem.replace("\x0D\x0A", ""))?.groups,
      );
    });

    each(["", "SYSTEM"], 'should not match "%{}"', (invalidSystem) => () => {
      expect(combine("^", EXTERNAL_ID, "$").test(invalidSystem)).toBe(false);
      expect(EXTERNAL_ID_match.test(invalidSystem)).toBe(false);
    });
  });

  describe("PUBLIC", () => {
    each(
      VALID_PUBLIC_DOUBLE,
      'should match ""%{}""',
      (validPublicDouble) => async (t) => {
        expectMatch(EXTERNAL_ID, validPublicDouble);
        await assertSnapshot(
          t,
          EXTERNAL_ID_match.exec(validPublicDouble)?.groups,
        );
      },
    );

    each(
      ["", "PUBLIC", `PUBLIC ''`, `PUBLIC ""`, `PUBLIC '"' ''`],
      'should not match ""%{}""',
      (invalidPublicDouble) => () => {
        expect(combine("^", EXTERNAL_ID, "$").test(invalidPublicDouble)).toBe(
          false,
        );
        expect(EXTERNAL_ID_match.test(invalidPublicDouble)).toBe(false);
      },
    );
  });
});

describe("NOTATION_DECL", () => {
  it("should contain S NAME S once", () => {
    expect(NOTATION_DECL.source.split(combine(S, NAME, S).source)).toHaveLength(
      2,
    );
  });

  it("should contain ExternalID once", () => {
    expect(NOTATION_DECL.source.split(EXTERNAL_ID.source)).toHaveLength(2);
  });

  it("should contain PubidLiteral twice", () => {
    expect(NOTATION_DECL.source.split(PUBID_LITERAL.source)).toHaveLength(3);
  });

  const VALID_PUBLIC_SINGLE = VALID_PUBLIC_DOUBLE.map((pub) => {
    // remove second pair of quotes
    return pub.substring(0, pub.lastIndexOf(" "));
  }).filter((pub, i, all) => {
    // remove duplicates
    return all.indexOf(pub) === i;
  }).map((pub) => {
    return `<!NOTATION Name ${pub}>`;
  });

  it("VALID_PUBLIC_SINGLE should have 5 testcases", () => {
    expect(VALID_PUBLIC_SINGLE).toHaveLength(5);
  });

  each(
    [
      ...VALID_SYSTEM.map((sys) => `<!NOTATION Name ${sys}>`),
      ...VALID_PUBLIC_DOUBLE.map((pub) => `<!NOTATION Name ${pub}>`),
      ...VALID_PUBLIC_SINGLE,
    ],
    "should match %{}",
    (validPublic) => () => {
      expectMatch(NOTATION_DECL, validPublic);
    },
  );

  it("should accept arbitrary whitespace in various places", () => {
    const source = `<!NOTATION\n \r\tName\n \r\tPUBLIC ""\n \r\t>`;
    expectMatch(NOTATION_DECL, source);
  });
});

describe("UNICODE_SUPPORT", () => {
  it("should be true in Deno environment", () => {
    expect(UNICODE_SUPPORT).toBe(true);
  });
});

describe("detectUnicodeSupport", () => {
  const getMockRegExp = (customizer?: (...args: any) => any) => {
    return class {
      exec() {
        if (typeof customizer === "function") {
          return customizer();
        }
      }
    };
  };

  it("should return false if regular expression throws", () => {
    expect(detectUnicodeSupport(getMockRegExp(() => {
      throw new Error("from test");
    }))).toBe(false);
  });

  it("should return false if regular expression matches string with length 1", () => {
    expect(detectUnicodeSupport(getMockRegExp(() => {
      return ["1"];
    }))).toBe(false);
  });
});

describe("combine", () => {
  it("should use RegExp.source", () => {
    expect(combine(/first/, "second").source).toBe(/firstsecond/.source);
  });

  it("should throw when used with `|`", () => {
    expect(() => combine("|")).toThrow();
  });
});

describe("flatten", () => {
  it("should drop wrapping []", () => {
    expect(flatten(/[a-z.-\]]/)).toBe("a-z.-\\]");
  });

  it("should drop wrapping []+", () => {
    expect(flatten(/[a-z.-\]]+/)).toBe("a-z.-\\]");
  });

  it("should drop wrapping []{1, 2}", () => {
    expect(flatten(/[a-z.-\]]{1,2}}/)).toBe("a-z.-\\]");
  });

  it("should reject regexp not starting with [", () => {
    expect(() => flatten(/abc/)).toThrow("/abc/");
  });
});

describe("charsWithout", () => {
  it("should drop character [", () => {
    const actual = charsWithout(/[a-z.-\]]/, "\\]");
    expect(actual).toEqual(/[a-z.-]/u);
  });

  it("should throw if second parameter is not part of source", () => {
    expect(() => charsWithout(/[a-z.-\]]/, "x")).toThrow(Error);
  });

  it("should throw if second parameter is not provided", () => {
    const args: [RegExp, any] = [/[false]/, undefined];
    expect(() => charsWithout(...args)).toThrow(Error);
  });

  it("should throw if second parameter is not a string", () => {
    const args: [RegExp, any] = [/[false]/, true];
    expect(() => charsWithout(...args)).toThrow(Error);
  });

  it("should throw if second parameter does not start with `[`", () => {
    expect(() => charsWithout(/abc/, "")).toThrow("/abc/");
  });
});

describe("group", () => {
  it("should wrap all arguments between `(?:` and `)`", () => {
    expect(group(/abc/, "|", "def")).toEqual(/(?:abc|def)/mu);
  });

  it("should throw if no arguments are provided", () => {
    expect(() => group()).toThrow(Error);
  });
});

const NAME_START_CHARS = [
  ":",
  "_",
  "a",
  "z",
  "A",
  "Z",
  "\xC0",
  "\xD6",
  "\xD8",
  "\xF6",
  "\u00F8",
  "\u02FF",
  "\u0370",
  "\u037D",
  "\u037F",
  "\u1FFF",
  "\u200C",
  "\u200D",
  "\u2070",
  "\u218F",
  "\u2C00",
  "\u2FEF",
  "\u3001",
  "\uD7FF",
  "\uF900",
  "\uFDCF",
  "\uFDF0",
  "\uFFFD",
  "\u{10000}",
  "\u{10FFFF}",
];

const NAME_CHAR_ADDITIONS = [
  "-",
  ".",
  "0",
  "9",
  "\xB7",
  "\u0300",
  "\u036F",
  "\u203F",
  "\u2040",
];

describe("NAME", () => {
  it("should contain NameStartChar characters in second character class", () => {
    const endOfFirstCharacterClass = NAME.source.indexOf("]");
    const firstCharacterClass = NAME.source.substring(
      1,
      endOfFirstCharacterClass,
    );

    const endOfSecondCharacterClass = NAME.source.lastIndexOf("]");
    const secondCharacterClass = NAME.source.substring(
      endOfFirstCharacterClass + 1,
      endOfSecondCharacterClass + 1,
    );

    expect(NAME.source.includes(NAME_CHAR.source)).toBe(true);
    expect(firstCharacterClass.includes(NAME_CHAR.source)).toBe(false);
    expect(secondCharacterClass.includes(NAME_CHAR.source)).toBe(true);
  });

  each(
    NAME_START_CHARS,
    "should match the single character %u{}",
    (nameStartChar) => () => {
      expectMatch(NAME, nameStartChar);
    },
  );

  each(
    [
      ...NAME_CHAR_ADDITIONS.map((nameChar, index) => {
        return `${NAME_START_CHARS[index]}${nameChar}`;
      }),
      "a0123456789",
    ],
    "should match a single NameStartChar followed by NameChar(s) %u{}",
    (value) => () => {
      expectMatch(NAME, value);
    },
  );

  each(
    NAME_CHAR_ADDITIONS,
    "should not match single NameChar addition %u{}",
    (nameCharAddition) => () => {
      expect(NAME.test(nameCharAddition)).toBe(false);
    },
  );

  each(
    [
      "\xBF",
      "\xD7",
      "\xF7",
      "\u0300",
      "\u0369",
      "\u2000",
      "\u2069",
      "\u2190",
      "\u2BFF",
      "\u2FF0",
      "\u3000",
      "\uD800",
      "\uF8FF",
      "\uFDD0",
      "\uFDDF",
      "\uFFFF",
    ],
    "should not match single excluded NameStarChar %u{}",
    (invalidNameStartChar) => () => {
      expect(NAME.test(invalidNameStartChar)).toBe(false);
    },
  );
});

const QNAME_START_CHARS = NAME_START_CHARS.filter((char) => {
  return char !== ":";
});

describe("QNAME", () => {
  it('should contain NameStartChar characters with ":" 4 times', () => {
    const endOfFirstCharacterClass = NAME.source.indexOf("]");

    const start = NAME.source.indexOf(":") + 1;
    const chars = NAME.source.substring(start, endOfFirstCharacterClass);

    expect(QNAME.source.split(chars)).toHaveLength(5);
  });

  each(
    QNAME_START_CHARS,
    "should match a single NCNameStartChar %u{}",
    (qnameStartChars) => () => {
      expectMatch(QNAME, qnameStartChars);
    },
  );

  each(
    [
      ...NAME_CHAR_ADDITIONS.map((nameChar, index) => {
        return `${QNAME_START_CHARS[index]}${nameChar}`;
      }),
      "a0123456789",
    ],
    "should match a single NCNameStartChar followed by NCNameChar(s) %u{}",
    (value) => () => {
      expectMatch(QNAME, value);
    },
  );

  each(
    [
      ...NAME_CHAR_ADDITIONS.map((nameChar, index) => {
        return `${QNAME_START_CHARS[index]}${nameChar}`;
      }),
      "a0123456789:a0123456789",
    ],
    'should match a single NCNameStartChar NCNameChar(s) \:" NCNameStartChar NCNameChar(s) %u{}',
    (value) => async (t) => {
      expectMatch(QNAME, value);
      expect(QNAME_EXACT.test(value)).toBe(true);
      await assertSnapshot(t, QNAME_GROUP.exec(value));
    },
  );

  each(
    NAME_CHAR_ADDITIONS,
    "should not match single NameChar addition %u{}",
    (nameCharAddition) => () => {
      expect(QNAME.test(nameCharAddition)).toBe(false);
    },
  );

  each(
    [
      ":",
      "::",
      "a:",
      ":a",
      "a:b:",
      `${QNAME_START_CHARS[0]}:${NAME_CHAR_ADDITIONS[0]}`,
    ],
    "should not match %u{}",
    (value) => () => {
      expect(QNAME_EXACT.test(value)).toBe(false);
    },
  );
});

describe("PEReference", () => {
  it("should use Name", () => {
    const splitByName = PE_REFERENCE.source.split(NAME.source);
    expect(splitByName).toEqual(["%", ";"]);
  });
});

describe("PI", () => {
  it("should contain Name", () => {
    expect(PI.source.split(NAME.source)).toHaveLength(2);
  });

  it("should contain Char", () => {
    expect(PI.source.split(CHAR.source)).toHaveLength(2);
  });

  each(
    [
      `<?xml version="1.0"?>`,
      `<?xml version="1.0" ?>`,
      `<?xml version="1.1" ?>`,
      `<?xml version="1.0" encoding="A"?>`,
      `<?xml version="1.0" encoding="A-A-Za-z0-9._"?>`,
      `<?xml version="1.0" encoding="a" ?>`,
      `<?xml version="1.0" encoding='A' ?>`,
      `<?xml version="1.0" encoding="A" standalone="yes" ?>`,
      `<?xml version="1.0" encoding="A" standalone='no'?>`,
      `<?xml version="1.0" standalone='yes'?>`,
      `<?xml\n \r\tversion="1.1"\n \r\tencoding="A"\n \r\tstandalone="yes"\n \r\t?>`,
    ],
    "should match XMLDecl %{}",
    (value) => () => {
      expectMatch(PI, value);
    },
  );

  each([`<?xml?>`, `<?target\n\t\r ?>`], "should match %{}", (value) => () => {
    expectMatch(PI, value);
  });

  it("should not be greedy", async (t) => {
    const longExample =
      `<?target anything is allowed here as long as ? and > are not beside each other like this:\t\n?>`;
    const actual = PI.exec(longExample + longExample);
    expect((actual || {})[0]).toHaveLength(longExample.length);
    await assertSnapshot(t, actual);
  });

  it("should drop initial white-space but keep ending white-space", () => {
    const example = `<?target\n\t\r 0-9\r \n\t?>`;
    const actual = PI.exec(example);
    expect((actual || {})[0]).toHaveLength(example.length);
    expect((actual || [])[2]).toBe(`0-9\r \n\t`);
  });

  each(
    ['< ?xml version="1.0"?>', '<? xml version="1.0"?>'],
    "should not match %{}",
    (value) => () => {
      expect(PI.test(value)).toBe(false);
    },
  );
});

describe("pipe", () => {
  it("should wrap all elements in `(?:` and `)` and with `|` delimiters", () => {
    expect(pipe(/abc/, "def")).toEqual(/(?:abc|def)/mu);
    expect(pipe(/abc/, "def", "ghi", "klm")).toEqual(/(?:abc|def|ghi|klm)/mu);
  });

  it("should throw if no arguments are provided", () => {
    expect(() => pipe()).toThrow(Error);
  });

  it("should throw if any argument is not RegExp instance or string", () => {
    expect(() => pipe(/abc/, "def", {} as any)).toThrow(Error);
  });
});

// -- regexp.js code generation helpers
const grammar = {
  ABOUT_LEGACY_COMPAT_SystemLiteral,
  ATTLIST_DECL,
  CHAR,
  COMMENT,
  ELEMENT_DECL,
  ENTITY_DECL,
  ENTITY_VALUE,
  EXTERNAL_ID,
  EXTERNAL_ID_match,
  NAME,
  NOTATION_DECL,
  REFERENCE,
  PE_REFERENCE,
  PI,
  PUBID_LITERAL,
  QNAME,
  QNAME_EXACT,
  QNAME_GROUP,
  S,
  S_OPT,
  SYSTEM_LITERAL,
  XML_DECL,
};

const alphabetical = Object.keys(grammar);

const Grammar = Object.keys(grammar).sort((_a, _b) => {
  const a = _a as keyof typeof grammar;
  const b = _b as keyof typeof grammar;

  const length = grammar[a].source.length - grammar[b].source.length;
  return length === 0
    ? alphabetical.indexOf(a) - alphabetical.indexOf(b)
    : length;
}).reduce((acc, _key) => {
  const key = _key as keyof typeof grammar;

  acc[key] = grammar[key];
  return acc;
}, {} as typeof grammar);

const REGEXP_DOT_JS_CONTENT = `// deno-lint-ignore-file
// THIS FILE IS AUTOMATICALLY GENERATED AT TEST, DO NOT CHANGE IT MANUALLY
${
  Object.entries(Grammar).map(([name, regexp]) => {
    return `const ${name} = /${
      regexp.source.replace(/\\?\//g, "\\/")
    }/${regexp.flags}`;
  }).join("\n")
}
`;

describe("all grammar regular expressions", () => {
  it("should have the expected keys", async (t) => {
    await assertSnapshot(t, Object.keys(Grammar));
  });

  it("should match the file on disk", () => {
    const filename = (import.meta.dirname || "") + "/generated-files/regexp.js";
    if (!fileExistsSync(filename)) {
      Deno.writeTextFileSync(filename, REGEXP_DOT_JS_CONTENT);
    }

    expect(Deno.readTextFileSync(filename)).toBe(REGEXP_DOT_JS_CONTENT);
  });
});

describe("S", () => {
  ["\x20\x09\x0D\x0A", " \n\r\t", " ", "\n", "\r", "\t"].forEach((value) => {
    if (value.length > 1) {
      it(`should match all ${value.length} chars`, () => {
        expectMatch(S, value);
        expect(SCHAR_s.length % value.length).toBe(0);
      });
    } else {
      it(`should match \\x${value.charCodeAt(0)}`, () => {
        expectMatch(S, value);
      });
    }
  });

  it("should not match the empty string", () => {
    expect(S.test("")).toBe(false);
  });
});

describe("S_OPT", () => {
  ["\x20\x09\x0D\x0A", " \n\r\t", " ", "\n", "\r", "\t"].forEach((value) => {
    if (value.length > 1) {
      it(`should match all ${value.length} chars`, () => {
        expectMatch(S_OPT, value);
        expect(SCHAR_s.length % value.length).toBe(0);
      });
    } else {
      it(`should match \\x${value.charCodeAt(0)}`, () => {
        expectMatch(S_OPT, value);
      });
    }
  });

  it("should match the empty string", () => {
    expect(S_OPT.test("")).toBe(true);
  });
});

describe("XML_DECL", () => {
  each(
    [
      `<?xml version="1.0"?>`,
      `<?xml version="1.0" ?>`,
      `<?xml version="1.1" ?>`,
      `<?xml version="1.0" encoding="A"?>`,
      `<?xml version="1.0" encoding="A-A-Za-z0-9._"?>`,
      `<?xml version="1.0" encoding="a" ?>`,
      `<?xml version="1.0" encoding='A' ?>`,
      `<?xml version="1.0" encoding="A" standalone="yes" ?>`,
      `<?xml version="1.0" encoding="A" standalone='no'?>`,
      `<?xml version="1.0" standalone='yes'?>`,
      `<?xml\n \r\tversion="1.1"\n \r\tencoding="A"\n \r\tstandalone="yes"\n \r\t?>`,
    ],
    "should match %{}",
    (value) => () => {
      expectMatch(XML_DECL, value);
    },
  );

  each(
    [
      '< ?xml version="1.0"?>',
      '<? xml version="1.0"?>',
      '<?xml version="1.0"? >',
      '<?xml version="1."?>',
      '<?xml version="1."?>',
      `<?xml version="1.0" standalone='no' encoding="A" ?>`,
    ],
    "should not match %{}",
    (value) => () => {
      expect(XML_DECL.test(value)).toBe(false);
    },
  );
});
