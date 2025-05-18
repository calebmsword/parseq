import { assert as _assert } from "../control-flow-factories/assert.ts";
import { sequence } from "../crockford-factories/sequence.ts";
import { Cancellor } from "../types.d.ts";
import { makeListenerIf } from "./parseq-utilities-misc.ts";
import { requestor } from "./requestor.ts";

/**
 * Creates requestor factories for observing or manipulating encapsulated state.
 */
export class Container<State, Message = any> {
  #state: State;

  constructor(state: State) {
    this.#state = state;
  }

  update(updater: (state: State, message: Message) => State) {
    return makeListenerIf<Message, State>(
      updater.length > 1,
      (pass, _fail, message) => {
        this.#state = updater(this.#state, message);
        pass(this.#state);
        return;
      },
    );
  }

  observe<T>(observer: (state: State, message?: T) => void) {
    return requestor<T, T>((pass, _fail, message) => {
      observer(this.#state, message);
      pass(message);
      return;
    });
  }

  get<T = State>(mapper?: (state: State) => T) {
    return requestor<any, T>((pass, _fail) => {
      const result = typeof mapper === "function"
        ? mapper(this.#state)
        : this.#state;

      pass(result as T);
      return;
    });
  }

  assert(assertion: (state: State) => boolean, description?: string) {
    return sequence([
      this.get<State>(),
      _assert<State>(assertion, description)
    ]);
  }

  cancellor(updater: (state: State, reason?: any) => State): Cancellor {
    return (reason?: any) => {
      this.#state = updater(this.#state, reason);
    };
  }
}

export const container = <State, Message = any>(state: State) => {
  return new Container<State, Message>(state);
};
