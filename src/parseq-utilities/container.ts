import { makeListenerIf } from "./parseq-utilities-misc.ts";

export class Container<State, Message = any> {
  #state: State;

  constructor(state: State) {
    this.#state = state;
  }

  update(updater: (state: State, message: Message) => State) {
    return makeListenerIf<Message, State>(
      updater.length > 1,
      (pass, _fail, message) => {
        this.#state = updater(this.#state, message as Message);
        pass(this.#state);
      },
    );
  }
}

export const container = <State, Message = any>(state: State) => {
  return new Container<State, Message>(state);
};
