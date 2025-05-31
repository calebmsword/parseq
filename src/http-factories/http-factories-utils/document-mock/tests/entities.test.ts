import { describe, it } from "@std/testing/bdd";
import { expect } from "@std/expect/expect";
import { HTML_ENTITIES, XML_ENTITIES } from "../src/entities.ts";

describe("XML_ENTITIES", () => {
  it("should not have a prototype", () => {
    expect(XML_ENTITIES).not.toHaveProperty("prototype");
    expect(XML_ENTITIES).not.toHaveProperty("__proto__");
  });
});

describe("HTML ENTITIES", () => {
  it("should not have a prototype", () => {
    expect(HTML_ENTITIES).not.toHaveProperty("prototype");
    expect(HTML_ENTITIES).not.toHaveProperty("__proto__");
  });
});
