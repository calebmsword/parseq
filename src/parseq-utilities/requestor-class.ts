import { Cancellor, Receiver } from "../types.d.ts";
import {
  exists,
  isBoolean,
  isCallable,
  isScheduler,
} from "./parseq-utilities-type-checking.ts";
import { getDefaultScheduler, Scheduler } from "./config.ts";

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

  run(spec?: {
    message?: M;
    receiver?: Receiver<V>;
    success?: (value: V) => void;
    failure?: (reason: any) => void;
    runOnFutureTick?: boolean;
    scheduler?: Scheduler;
  }) {
    let { message, receiver, success, failure, runOnFutureTick, scheduler } =
      typeof spec === "object" ? spec : { success() {} };

    if (!isBoolean(runOnFutureTick)) {
      runOnFutureTick = true;
    }

    if (
      scheduler === null || scheduler === undefined || !isScheduler(scheduler)
    ) {
      scheduler = getDefaultScheduler();
    }

    if (typeof receiver === "function") {
      if (receiver.length !== 1) {
        throw new Error("Receiver must be a function of one argument");
      }

      if (exists(success) || exists(failure)) {
        throw new Error(
          "If you provide a receiver, you cannot also provide a success or error callback!",
        );
      }
    } else if (typeof success !== "function") {
      success = () => {};
    } else {
      receiver = ({ value, reason }) => {
        if (exists(reason)) {
          isCallable(failure) ? failure?.call(this, reason) : undefined;
        } else {
          success?.call(this, value as V);
        }
      };
    }

    return this.#crockfordRequestor(
      (result) => {
        runOnFutureTick
          ? scheduler.schedule(
            receiver as (...args: any) => void,
            0,
            result,
          )
          : (receiver as Receiver<V>)(result);
        return;
      },
      message as M,
    );
  }
}

Object.freeze(Requestor);
Object.freeze(Requestor.prototype);
