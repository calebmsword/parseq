import { sequence } from "../crockford-factories/sequence.ts";
import { container } from "../parseq-utilities/container.ts";
import { Requestor } from "../types.d.ts";
import { Absent } from "./control-flow-utils/control-flow-types.ts";
import { repeat } from "./repeat.ts";
import { trycatch } from "./trycatch.ts";
import { waitFor } from "./wait-for.ts";

class Lock {
  #mutex;

  #lock;

  #unlock;

  #lockCancellor;

  #assertUnlocked;

  constructor() {
    this.#mutex = container(false);
    this.#lock = this.#mutex.update(() => true);
    this.#unlock = this.#mutex.update(() => false);
    this.#lockCancellor = this.#mutex.cancellor(() => false);
    this.#assertUnlocked = this.#mutex.assert((isLocked) => !isLocked);
  }

  acquire<M, V>(requestor: Requestor<M, V>) {
    return sequence([
      waitFor<M>(repeat(this.#assertUnlocked, {
        eachTryOnNewTick: true,
      })),
      trycatch<M, V, Absent, V>({
        attempt: sequence([
          waitFor<M>(this.#lock),
          requestor,
        ]),
        cleanup: waitFor<V>(this.#unlock),
        ifCancelled: this.#lockCancellor,
      }) as Requestor<M, V>,
    ]);
  }
}

/**
 * Creates a lock.
 * The lock is an object with a single method `acquire`, which returns a new
 * requestor which runs the original requestor guarded by a lock. For each lock,
 * only one requestor created by `acquire` can be pending at a time.
 */
export const lock = () => {
  return new Lock();
};
