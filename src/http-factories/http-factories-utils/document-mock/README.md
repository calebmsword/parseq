<!-- deno-fmt-ignore-file -->

A reimplementation of `@xmldom/xmldom`. See https://www.npmjs.com/package/@xmldom/xmldom and https://github.com/xmldom/xmldom.

# Acknowledgments:

It would be irresponsible not to credit the contributors for the `@xmldom/xmldom` project. Here is the list of contributors I could find. If you are aware of anyone I am missing, please let me know:

 - [karfau](https://github.com/karfau)
 - [jindw](https://github.com/jindw)
 - [flatheadmill](https://github.com/flatheadmill)
 - [jinjinyun](https://github.com/jinjinyun)
 - [kethinov](https://github.com/kethinov)
 - [heycam](https://github.com/heycam)
 - [zorkow](https://github.com/zorkow)
 - [shunkica](https://github.com/shunkica)
 - [Ponynjaa](https://github.com/Ponynjaa)
 - [skypanther](https://github.com/skypanther)
 - [yaronn](https://github.com/yaronn)
 - [rrthomas](https://github.com/rrthomas)
 - [codler](https://github.com/codler)
 - [awwright](https://github.com/awwright)
 - [timbru31](https://github.com/timbru31)
 - [microshine](https://github.com/microshine)
 - [kboshold](https://github.com/kboshold)
 - [UdayKharatmol](https://github.com/UdayKharatmol)
 - [cjbarth](https://github.com/cjbarth)
 - [jhauga](https://github.com/jhauga)
 - [krystofwoldrich](https://github.com/krystofwoldrich)
 - [Bulandent](https://github.com/Bulandent)
 - [marvinruder](https://github.com/marvinruder)
 - [xiaopanshi](https://github.com/xiaopanshi)
 - [lupestro](https://github.com/lupestro)
 - [Mathias-S](https://github.com/Mathias-S)
 - [forty](https://github.com/forty)
 - [dsimpsonOMF](https://github.com/dsimpsonOMF)
 - [nightwing](https://github.com/nightwing)
 - [kachkaev](https://github.com/kachkaev)
 - [Olegas](https://github.com/Olegas)
 - [jbeard4](https://github.com/jbeard4)
 - [gierschv](https://github.com/gierschv)
 - [Frost](https://github.com/Frost)
 - [daurnimator](https://github.com/daurnimator)
 - [matt-deboer](https://github.com/matt-deboer)
 - [isnotgood](https://github.com/isnotgood)
 - [shazron](https://github.com/shazron)
 - [nfischer](https://github.com/nfischer)
 - [ajmas](https://github.com/ajmas)
 - [pilsy](https://github.com/pilsy)
 - [rg1](https://github.com/rg1)
 - [joestringer](https://github.com/joestringer)
 - [davidmc24](https://github.com/davidmc24)
 - [jesse-y](https://github.com/jesse-y)
 - [jaller94](https://github.com/jaller94)
 - [yeegor](https://github.com/yeegor)
 - [FranckDepoortere](https://github.com/FranckDepoortere)
 - [eboureau](https://github.com/eboureau)
 - [ChALkeR](https://github.com/ChALkeR)
 - [pdecat](https://github.com/pdecat)

# Project Structure

```javascript
src/
  // contains code for the XMLReader (which is implemented in sax.js in the
  // original project). The reader is responsible for reading the string input
  // representing XML.
  reader/

  // contains the DOMBuilder (called DOMHandler in the original project.) The
  // DOMBuilder can create DOM nodes representing different XML nodes. The
  // XMLReader must be given a DOMBuilder in order to create a XML parser that
  // converts a string into an DOM representation of an XML document. 
  builder.ts

  // contains ponyfills for portions of the DOM required to create a DOM parser.
  dom.ts

  // contains maps of XML entity names to their Unicode character.
  entities.ts

  // contains ponyfills for DOM Error subclasses. Deno has DOMException built-in
  // to its environment, so the DOMException ponyfill is not implemented in this
  // project.
  errors.ts

  // Contains strings and regular expressions representing parsable syntactic
  // constructs in XML.
  grammar.ts
```
