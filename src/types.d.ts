export { Requestor } from "./parseq-utilities/requestor-class.ts";

export type Cancellor = (reason?: unknown) => void;

export type Result<V> = { value?: V; reason?: unknown };

export type Receiver<V> = (result: Result<V>) => void;

export type Action<M, V> = (
  pass: (value: V) => void,
  fail: (reason: any) => void,
  message: M,
) => Cancellor | void;
