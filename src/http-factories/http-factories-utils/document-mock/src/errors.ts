export class ParseError extends Error {
  locator;

  constructor(message: string, locator?: any) {
    super(message);
    this.name = ParseError.name;
    this.locator = locator;
  }
}
