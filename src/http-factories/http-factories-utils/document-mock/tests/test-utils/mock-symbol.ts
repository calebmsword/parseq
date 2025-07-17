import { fn } from "@std/expect/fn";

export interface SymbolableFunction extends Function {
  [key: symbol]: any;
}

const getMockSymbol = () => {
  const func = fn(() => {}) as SymbolableFunction;

  return Object.getOwnPropertySymbols(func).find((symbol) => {
    return func[symbol] !== null && typeof func[symbol] === "object" &&
      Array.isArray(func[symbol].calls);
  });
};

/**
 * The mock returned by `fn` has a symbol property which stores all of the data
 * required to meaningfully make assertions on the mock. For logging purposes
 * it can be useful to have access to this symbol property to check exactly what
 * went wrong when a test fails unexpectedly. This is a hack given that symbol
 * properties are supposed to be treated as private, so do not use this for any
 * actual test--only use this to solve problems when things go wrong.
 */
const MOCK_SYMBOL = getMockSymbol() as symbol;

export const getCalls = (func: (...args: any[]) => any): {
  args: any[];
  returned: any;
  timestamp: number;
  returns: boolean;
  throws: boolean;
} | undefined => {
  return (func as unknown as SymbolableFunction)[MOCK_SYMBOL]?.calls;
};
