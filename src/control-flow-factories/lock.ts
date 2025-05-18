import { sequence } from "../crockford-factories/sequence.ts";
import { newTick } from "../misc-factories/newTick.ts";
import { Container, container } from "../parseq-utilities/container.ts";
import { Requestor } from "../types.d.ts";
import { Absent } from "./control-flow-utils/control-flow-types.ts";
import { repeat } from "./repeat.ts";
import { trycatch } from "./trycatch.ts";
import { waitFor } from "./wait-for.ts";

class Lock {
  #locked: Container<boolean>;

  constructor(locked: Container<boolean>) {
    this.#locked = locked;
  }

  acquire<M, V>(requestor: Requestor<M, V>) {
    return sequence([
      waitFor<M>(repeat(sequence([
        newTick(),
        this.#locked.assert((isLocked) => !isLocked),
      ]))),
      trycatch<M, V, Absent, V>({
        attempt: sequence([
          waitFor<M>(this.#locked.update(() => true)),
          requestor,
        ]),
        cleanup: waitFor<V>(this.#locked.update(() => false)),
        ifCancelled: this.#locked.cancellor(() => false),
      }) as Requestor<M, V>,
    ]);
  }
}

export const lock = () => {
  return new Lock(container(false));
};
