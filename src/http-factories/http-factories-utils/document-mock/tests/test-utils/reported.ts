import * as path from "@std/path";
import { dirname } from "@std/path/dirname";
import { existsSync as fileExistsSync } from "@std/fs/exists";

const skippedInHtml = true;

const ERROR_REPORT_LEVELS = Object.freeze({
  ERROR: "error",
  WARNING: "warning",
  FATAL_ERROR: "fatalError",
});

type ValidErrorReportLevels =
  typeof ERROR_REPORT_LEVELS[keyof typeof ERROR_REPORT_LEVELS];

export type ErrorReport = {
  source: string;
  level: ValidErrorReportLevels;
  match: (message: string) => boolean;
  skippedInHtml?: boolean;
};

const REPORTED: { [key: string]: ErrorReport } = {
	/**
	 * There are well-formed documents containing the unicode replacement character,
	 * e.g. https://en.wikipedia.org/wiki/Mojibake
	 * see https://github.com/xmldom/xmldom/issues/790#issuecomment-2493975063
	 * But reading files in a different encoding than they have been written with,
	 * will also lead to these characters being present.
	 * Which is why this is reported once at the beginning,
	 * before parsing any content.
	 * Use `onWarningStopParsing` to prevent parsing documents containing these characters.
	 */
	Encoding_ReplacementCharacter: {
		source: '<doc>\ufffd</doc>',
		level: ERROR_REPORT_LEVELS.WARNING,
		match: (msg) => /unicode replacement character/i.test(msg),
	},
	/**
	 * Well-formedness constraint: Element Type Match
	 *
	 * The Name in an element's end-tag must match the element type in the start-tag.
	 *
	 * @see https://www.w3.org/TR/xml/#GIMatch
	 * @see https://www.w3.org/TR/xml11/#GIMatch
	 */
	WF_ElementTypeMatch_QName: {
		source: '<xml><a></b></xml 1',
		level: ERROR_REPORT_LEVELS.FATAL_ERROR,
		match: (msg) => /end tag name contains invalid characters/.test(msg),
	},
	WF_ElementTypeMatch_QName_complex: {
		source: '<r><Page><Label /></Page  <Page></Page></r>',
		level: ERROR_REPORT_LEVELS.FATAL_ERROR,
		match: (msg) => /end tag name contains invalid characters/.test(msg),
	},
	/**
	 * Well-formedness constraint: Element Type Match
	 *
	 * The Name in an element's end-tag must match the element type in the start-tag.
	 *
	 * @see https://www.w3.org/TR/xml/#GIMatch
	 * @see https://www.w3.org/TR/xml11/#GIMatch
	 */
	WF_ElementTypeMatch_Mismatch: {
		source: '<xml><a></b></xml>',
		level: ERROR_REPORT_LEVELS.FATAL_ERROR,
		match: (msg) => /Opening and ending tag mismatch/.test(msg),
	},
	WF_ElementTypeMatch_Mismatch_Root: {
		source: '<xml></Xml>',
		level: ERROR_REPORT_LEVELS.FATAL_ERROR,
		skippedInHtml,
		match: (msg) => /Opening and ending tag mismatch/.test(msg),
	},
	WF_ElementTypeMatch_Mismatch_Root_UnclosedMultiple: {
		source: '<xml></xml <second></second>',
		level: ERROR_REPORT_LEVELS.FATAL_ERROR,
		match: (msg) => /Opening and ending tag mismatch/.test(msg),
	},
	/**
	 * In the Browser (for XML) this is reported as
	 * `error on line 1 at column 6: Extra content at the end of the document`
	 * for HTML it's added to the DOM without anything being reported.
	 */
	WF_ElementTypeMatch_UnclosedXmlTag: {
		source: '<xml>',
		level: ERROR_REPORT_LEVELS.FATAL_ERROR,
		skippedInHtml,
		match: (msg) => /unclosed xml tag\(s\)/.test(msg),
	},
	WF_ElementTypeMatch_EndTagMissingName: {
		source: '<xml></>',
		level: ERROR_REPORT_LEVELS.FATAL_ERROR,
		match: (msg) => /end tag name missing/.test(msg),
	},
	/**
	 * This sample doesn't follow the specified grammar.
	 * In the browser it is reported as `error on line 1 at column 5: Couldn't find end of Start Tag xml`.
	 */
	WF_ElementTypeMatch_UnclosedXmlTag_IncompleteStartTag: {
		source: '<xml',
		level: ERROR_REPORT_LEVELS.FATAL_ERROR,
		skippedInHtml,
		match: (msg) => /unclosed xml tag\(s\)/.test(msg),
	},
	/**
	 * Entities need to be in the entityMap to be converted as part of parsing.
	 * xmldom currently doesn't parse entities declared in DTD.
	 *
	 * @see https://www.w3.org/TR/xml/#wf-entdeclared
	 * @see https://www.w3.org/TR/xml11/#wf-entdeclared
	 */
	WF_EntityDeclared: {
		source: '<xml>&e;</xml>',
		level: ERROR_REPORT_LEVELS.ERROR,
		match: (msg) => /entity not found/.test(msg),
	},
	WF_EntityDeclared_Attr: {
		source: '<xml attr="&e;"></xml>',
		level: ERROR_REPORT_LEVELS.ERROR,
		match: (msg) => /entity not found/.test(msg),
	},
	WF_EntityDeclared_Script: {
		source: '<script>&e;</script>',
		level: ERROR_REPORT_LEVELS.ERROR,
		skippedInHtml,
		match: (msg) => /entity not found/.test(msg),
	},
	WF_EntityRef: {
		source: '<xml>&amp</xml>',
		level: ERROR_REPORT_LEVELS.ERROR,
		skippedInHtml,
		match: (msg) => /EntityRef: expecting ;/.test(msg),
	},
	WF_EntityRef_Attr: {
		source: '<xml attr="&amp"></xml>',
		level: ERROR_REPORT_LEVELS.ERROR,
		skippedInHtml,
		match: (msg) => /EntityRef: expecting ;/.test(msg),
	},
	WF_EntityRef_Script: {
		source: '<script>&amp</script>',
		level: ERROR_REPORT_LEVELS.ERROR,
		skippedInHtml,
		match: (msg) => /EntityRef: expecting ;/.test(msg),
	},
	WF_Entity_ReferenceProduction: {
		source: '<xml>&1;</xml>',
		level: ERROR_REPORT_LEVELS.ERROR,
		match: (msg) => /entity not matching Reference production/.test(msg),
	},
	WF_Entity_ReferenceProduction_Attr: {
		source: '<xml attr="&1;"></xml>',
		level: ERROR_REPORT_LEVELS.ERROR,
		match: (msg) => /entity not matching Reference production/.test(msg),
	},
	WF_Entity_ReferenceProduction_Script: {
		source: '<script>&1;</script>',
		level: ERROR_REPORT_LEVELS.ERROR,
		skippedInHtml,
		match: (msg) => /entity not matching Reference production/.test(msg),
	},
	/**
	 * Well-formedness constraint: Unique Att Spec
	 *
	 * An attribute name must not appear more than once in the same start-tag or empty-element
	 * tag.
	 *
	 * In the browser:
	 * - as XML it is reported as `error on line 1 at column 17: Attribute a redefined`
	 * - as HTML only the first definition is considered
	 *
	 * In xmldom the behavior is different for namespaces (picks first)
	 * than for other attributes (picks last),
	 * which can be a security issue.
	 *
	 * @see https://www.w3.org/TR/xml/#uniqattspec
	 * @see https://www.w3.org/TR/xml11/#uniqattspec
	 */
	WF_DuplicateAttribute: {
		source: '<xml a="1" a="2"></xml>',
		level: ERROR_REPORT_LEVELS.FATAL_ERROR,
		match: (msg) => /Attribute .* redefined/.test(msg),
	},
	/**
	 * Well-formedness constraint: No < in Attribute Values
	 *
	 * The replacement text of any entity referred to directly or indirectly in an attribute value
	 * must not contain a `<`.
	 *
	 * @see https://www.w3.org/TR/xml/#CleanAttrVals
	 * @see https://www.w3.org/TR/xml11/#CleanAttrVals
	 */
	WF_AttValue_CleanAttrVals: {
		source: '<xml attr="1<2">',
		level: ERROR_REPORT_LEVELS.FATAL_ERROR,
		skippedInHtml,
		match: (msg) => /Unescaped '<' not allowed in attributes values/.test(msg),
	},
	WF_AttValue_CleanAttrVals_MissingClosingQuote: {
		source: '<xml><Label onClick="doClick..>Hello, World</Label></xml>',
		level: ERROR_REPORT_LEVELS.FATAL_ERROR,
		// the sample still reports another fatalError, because `Label` is never properly closed.
		// (search for the key in the snapshots to see it)
		// our test just makes sure that this specific error is not reported
		// browsers ignore the faulty tag, but this is not easy to implement
		skippedInHtml,
		match: (msg) => /Unescaped '<' not allowed in attributes values/.test(msg),
	},
	/**
	 * This sample doesn't follow the specified grammar.
	 * In the browser it is reported as `error on line 1 at column 6: Comment not terminated`.
	 */
	WF_UnclosedComment: {
		source: '<xml></xml><!--',
		level: ERROR_REPORT_LEVELS.FATAL_ERROR,
		match: (msg) => /comment is not well-formed/.test(msg),
	},
	/**
	 * Triggered by lib/sax.js:596, caught in 208
	 * This sample doesn't follow the specified grammar.
	 * In the browser:
	 * - as XML it is reported as
	 * `error on line 1 at column 2: StartTag: invalid element name`
	 * - as HTML it is accepted as characters
	 *
	 */
	SYNTAX_InvalidTagName: {
		source: '<xml><123 /></xml>',
		level: ERROR_REPORT_LEVELS.ERROR,
		match: (msg) => /invalid tagName/.test(msg),
	},
	/**
	 * Triggered by lib/sax.js:602, caught in 208
	 * This sample doesn't follow the specified grammar.
	 * In the browser:
	 * - as XML it is reported as
	 * `error on line 1 at column 6: error parsing attribute name`
	 * - as HTML it is accepted as attribute name
	 */
	SYNTAX_InvalidAttributeName: {
		source: '<xml><child 123=""/></xml>',
		level: ERROR_REPORT_LEVELS.ERROR,
		match: (msg) => /invalid attribute/.test(msg),
	},
	/**
	 * Triggered by lib/sax.js:392, caught in 208
	 * This sample doesn't follow the specified grammar.
	 * In the browser:
	 * - in XML it is reported as `error on line 1 at column 8: error parsing attribute name`
	 * - in HTML it produces `<xml><a <="" xml=""></a></xml>` (invalid XML?)
	 */
	SYNTAX_ElementClosingNotConnected: {
		source: '<xml><a/ </xml>',
		level: ERROR_REPORT_LEVELS.ERROR,
		match: (msg) => /must be connected/.test(msg),
	},
	/**
	 * In the browser:
	 * - for XML it is reported as
	 * `error on line 1 at column 10: Specification mandates value for attribute attr`
	 * - for HTML is uses the attribute as one with no value and adds `"value"` to the attribute name
	 *   and is not reporting any issue.
	 */
	WF_AttributeValueMustAfterEqual: {
		source: '<xml attr"value" />',
		level: ERROR_REPORT_LEVELS.WARNING,
		match: (msg) => /attribute value must after "="/.test(msg),
	},
	/**
	 * In the browser:
	 * - for XML it is reported as `error on line 1 at column 11: AttValue: " or ' expected`
	 * - for HTML is wraps `value"` with quotes and is not reporting any issue.
	 */
	WF_AttributeMissingStartingQuote: {
		source: '<xml attr=value" />',
		level: ERROR_REPORT_LEVELS.WARNING,
		match: (msg) => /missed start quot/.test(msg),
	},
	/**
	 * Triggered by lib/sax.js:264, caught in 208.
	 * TODO: Comment indicates fatalError, change to use errorHandler.fatalError?
	 *
	 * In the browser:
	 * - for XML it is reported as `error on line 1 at column 20: AttValue: ' expected`
	 * - for HTML nothing is added to the DOM.
	 */
	SYNTAX_AttributeMissingEndingQuote: {
		source: '<xml><child attr="value /></xml>',
		level: ERROR_REPORT_LEVELS.ERROR,
		match: (msg) => /attribute value no end .* match/.test(msg),
	},
	/**
	 * Triggered by lib/sax.js:324
	 * In the browser:
	 * - for XML it is reported as `error on line 1 at column 11: AttValue: " or ' expected`
	 * - for HTML is wraps `value/` with quotes and is not reporting any issue.
	 */
	WF_AttributeMissingQuote: {
		source: '<xml attr=value/>',
		level: ERROR_REPORT_LEVELS.WARNING,
		match: (msg) => / missed quot/.test(msg) && /!!/.test(msg) === false,
	},
	/**
	 * Triggered by lib/sax.js:354
	 * This is the only warning reported in this sample.
	 * For some reason the "attribute" that is reported as missing quotes
	 * has the name `&`.
	 * This case is also present in 2 tests in test/html/normalize.test.js
	 *
	 * In the browser:
	 * - for XML it is reported as `error on line 1 at column 8: AttValue: " or ' expected`
	 * - for HTML is yields `<xml a="&amp;" b="&amp;"></xml>` and is not reporting any issue.
	 */
	WF_AttributeMissingQuote2: {
		source: `<xml a=& b="&"/>`,
		level: ERROR_REPORT_LEVELS.WARNING,
		match: (msg) => / missed quot/.test(msg) && /!!/.test(msg),
	},
	/**
	 * In the browser:
	 * - for XML it is reported as `error on line 1 at column 9: AttValue: " or '
	 * expected`
	 * - for HTML is yields `<doc a1></xml>` and is not reporting any issue.
	 *
	 * But the XML specifications does not allow that:
	 *
	 * @see https://www.w3.org/TR/xml/#NT-Attribute
	 * @see https://www.w3.org/TR/xml11/#NT-Attribute
	 */
	WF_AttributeEqualMissingValue: {
		source: '<doc><child a1=></child></doc>',
		level: ERROR_REPORT_LEVELS.FATAL_ERROR,
		skippedInHtml,
		match: (msg) => /AttValue: \\' or " expected/.test(msg),
	},
	/**
	 * In the browser this is not an issue at all, but just add an attribute without a value.
	 * But the XML specifications does not allow that:
	 *
	 * @see https://www.w3.org/TR/xml/#NT-Attribute
	 * @see https://www.w3.org/TR/xml11/#NT-Attribute
	 */
	WF_AttributeMissingValue: {
		source: '<xml attr ></xml>',
		level: ERROR_REPORT_LEVELS.WARNING,
		match: (msg) => /missed value/.test(msg) && /instead!!/.test(msg),
		skippedInHtml,
	},
	/**
	 * Triggered by lib/sax.js:376 This seems to only be reached when there are two subsequent
	 * attributes with a missing value In the browser this is not an issue at all,
	 * but just add an attribute without a value.
	 * But the XML specifications does not allow that:
	 *
	 * @see https://www.w3.org/TR/xml/#NT-Attribute
	 * @see https://www.w3.org/TR/xml11/#NT-Attribute
	 */
	WF_AttributeMissingValue2: {
		source: '<xml attr attr2 ></xml>',
		level: ERROR_REPORT_LEVELS.WARNING,
		match: (msg) => /missed value/.test(msg) && /instead2!!/.test(msg),
		skippedInHtml,
	},
	WF_SingleRootElement_ContentAfter: {
		source: '<xml/>text after',
		level: ERROR_REPORT_LEVELS.ERROR,
		skippedInHtml,
		match: (msg) => /Extra content at the end of the document/.test(msg),
	},
	WF_SingleRootElement_ContentBefore: {
		source: 'text before<xml/>',
		level: ERROR_REPORT_LEVELS.ERROR,
		skippedInHtml,
		match: (msg) => /Unexpected content outside root element/.test(msg),
	},
	WF_SingleRootElement_InvalidCData: {
		source: '<!CDATA[ ] ] ><xml/>',
		level: ERROR_REPORT_LEVELS.FATAL_ERROR,
		match: (msg) => /Invalid CDATA starting at/.test(msg),
	},
	WF_SingleRootElement_CDataOutside: {
		source: '<!CDATA[]]><xml/>',
		level: ERROR_REPORT_LEVELS.FATAL_ERROR,
		skippedInHtml,
		match: (msg) => /CDATA outside of element/.test(msg),
	},
};

export const LINE_TO_ERROR_INDEX: {
  [key: string]: string | {
    errorType: string;
    index: number;
    line: string;
    message: string;
    reportedAs?: string;
  };
} = {
  "":
    `This file is gitignored and is generated by ${import.meta.filename} every time the tests run.`,
};

console.log(path.join("./", "sax.js"));

export const parseErrorLines = (fileNameInKey: string) => {
  let errorIndex = 0;

  const source = Deno.readTextFileSync(
    path.join(dirname(dirname(import.meta.dirname || "")), fileNameInKey),
  ).split("\n");

  source.forEach((untrimmedLine, lineNumber) => {
    const line = untrimmedLine.trim();

    if (/^(\/\/|\/\*|\* ?)/.test(line) || line.length === 0) {
      // ignoring single or multiline comments
      return;
    }
    if (/^(\w+Error\.prototype|function \w+Error)/.test(line)) {
      // ignoring "class" definitions for custom errors
      return;
    }

    // ignore lines that don't throw or report an error or warning
    const match = /(warning|[\w.]*error)\((.*)\)/i.exec(line);
    if (!match) {
      return;
    }

    const [, errorType, message] = match;

    // line numbers are NOT 0-indexed!
    LINE_TO_ERROR_INDEX[`${fileNameInKey}:${lineNumber + 1}`] = {
      errorType,
      index: errorIndex++,
      line,
      message,
    };
  });

  Object.entries(REPORTED).forEach(([key, value]) => {
    const matches = source.reduce((lineNumbers: number[], currentLine, n) => {
      if (
        new RegExp(value.level, "i").test(currentLine) &&
        value.match(currentLine)
      ) {
        lineNumbers.push(n + 1);
      }
      return lineNumbers;
    }, []);

    if (matches.length === 0) {
      throw `${key} doesn't match any line in $${fileNameInKey}`;
    }
    if (matches.length > 1) {
      throw `${key} matches multiple lines in ${fileNameInKey}`;
    }

    const lineKey = `${fileNameInKey}:${matches[0]}`;

    if (Object.keys(LINE_TO_ERROR_INDEX).includes(lineKey)) {
      if (typeof LINE_TO_ERROR_INDEX[lineKey] !== "string") {
        LINE_TO_ERROR_INDEX[lineKey].reportedAs = key;
      } else {
        throw new Error(`line not mapped: ${lineKey} reportedAs $${key}`);
      }
    }
  });

  const REPORTED_JSON = path.join(import.meta.dirname || "", "reported.json");
  const data = JSON.stringify(LINE_TO_ERROR_INDEX, null, 2);
  const currentData = fileExistsSync(REPORTED_JSON)
    ? Deno.readTextFile(REPORTED_JSON)
    : "";

  if (data !== currentData) {
    Deno.writeTextFileSync(REPORTED_JSON, data);
  }
};

parseErrorLines(path.join("src", "sax.js"));
