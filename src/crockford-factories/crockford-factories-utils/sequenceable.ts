import { Requestor } from "../../parseq-utilities/requestor.ts";

export type Message<R> = R extends Requestor<infer M, unknown> ? M : unknown;
export type Value<R> = R extends Requestor<any, infer V> ? V : unknown;
export type First<R> = R extends [infer T, ...unknown[]] ? T : unknown;
export type Last<R> = R extends [...unknown[], infer T] ? T : unknown;

type ValidCompose<R1, R2> = Value<R1> extends Message<R2> ? R1
  : Requestor<Message<R1>, Message<R2>>;

export type Sequenceable<Requestors> = Requestors extends
  [infer R1, infer R2, ...infer Rest]
  ? [ValidCompose<R1, R2>, ...Sequenceable<[R2, ...Rest]>] // tuple length > 1
  : Requestors; // tuple length == 1 || tuple length == 0
