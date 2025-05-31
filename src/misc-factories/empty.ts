import { value } from "./value.ts";

/**
 * Propogates undefined. Mostly used internally to create fixed requestors.
 */
export const empty = () => {
  return value(undefined);
};
