import { wait } from "./wait.ts";

export const newTick = <M>() => {
  return wait<M>(0);
};
