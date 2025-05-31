import { wait } from "./wait.ts";

/**
 * Propogates the given value on a future tick of the event loop.
 * This is a simple way to guarantee that a sequence is asynchronous.
 */
export const tick = <M>() => {
  return wait<M>(0);
};
