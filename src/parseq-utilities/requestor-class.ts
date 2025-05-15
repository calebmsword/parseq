import { Cancellor, Receiver } from "../types.d.ts";
import { exists, isCallable } from "./parseq-utilities-type-checking.ts";

export type CrockfordRequestor<M, V> = (
  receiver: (result: { value: V; reason: any }) => void,
  message: M,
) => Cancellor | void;

export const CROCKFORD_REQUESTOR = Symbol("CROCKFORD_REQUESTOR");

export class Requestor<M, V> {
  #crockfordRequestor: CrockfordRequestor<M, V>;

  #listener: boolean;

  constructor(crockfordRequestor: CrockfordRequestor<M, V>) {
    this.#crockfordRequestor = crockfordRequestor;
    this.#listener = crockfordRequestor.length === 2;
    Object.freeze(this);
  }

  get isListener() {
    return this.#listener;
  }

  run(spec: {
    message?: M;
    receiver?: Receiver<V>;
    success?: (value: V) => void;
    error?: (reason: any) => void;
  }) {
    let { message, receiver, success, error } = typeof spec === "object"
      ? spec
      : { success() {} };

    if (typeof receiver === "function") {
      if (receiver.length !== 1) {
        throw new Error("Receiver must be a function of one argument");
      }

      if (exists(success) || exists(error)) {
        throw new Error(
          "If you provide a receiver, you cannot also provide a success or error callback!",
        );
      }
    } else if (typeof success !== "function") {
      success = () => {};
    } else {
      receiver = ({ value, reason }) => {
        if (exists(reason)) {
          isCallable(error) ? error?.call(this, reason) : undefined;
        } else {
          success?.call(this, value as V);
        }
      };
    }

    return this.#crockfordRequestor(
      receiver as (result: { value: V; reason: any }) => void,
      message as M,
    );
  }
}

Object.freeze(Requestor);
Object.freeze(Requestor.prototype);
