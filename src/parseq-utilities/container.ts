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

  get() {
    return requestor<any, State>((pass, _fail) => {
      pass(this.#state);
      return;
    });
  }
}

export const container = <State, Message = any>(state: State) => {
  return new Container<State, Message>(state);
};
