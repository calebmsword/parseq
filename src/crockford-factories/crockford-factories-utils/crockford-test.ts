import {
  Requestor,
  requestor,
  Result,
} from "../../parseq-utilities/requestor.ts";
import { First, Last } from "./sequenceable.ts";

export type Message<R> = R extends Requestor<infer M, unknown> ? M : unknown;
export type Value<R> = R extends Requestor<any, infer V> ? V : unknown;
type Lookup<Array, n> = n extends keyof Array ? Array[n] : never;
type Shift<T extends any[], Default = never> = T extends [any, ...infer R] ? R
  : Default;

type ResultsOf<Values extends any[]> = {
  [n in keyof Values]: Result<Value<Lookup<Values, n>>>;
};

type SameMessage<R1, R2> = Message<R1> extends Message<R2> ? R1
  : Requestor<Message<R1>, Message<R2>>;

type AllSame<Requestors> = Requestors extends
  [infer R1, infer R2, ...infer Rest]
  ? [SameMessage<R1, R2>, ...AllSame<[R2, ...Rest]>] // tuple length > 1
  : Requestors; // tuple length == 1 || tuple length == 0

type AllSame2<Requestors extends Requestor<any, any>[]> = {
  [n in keyof Requestors]: Requestor<
    Message<Shift<Requestors, Message<Last<Requestors>>>>,
    any
  >;
};

// declare function simultaneous<
//   Requireds,
//   Optionals,
//   M = Message<First<[
//       ...(Requireds extends Requestor<any, any>[] ? [...Requireds] : []),
//       ...(Optionals extends Requestor<any, any>[] ? [...Optionals] : []),
//     ]
//   >>
// >(
//   required?: Requireds extends Requestor<M, any>[] ? [...Requireds] : [],
//   optionals?: Optionals extends Requestor<M, any>[] ? [...Optionals] : [],
// ): Requestor<
//   M,
//   ResultsOf<
//     [
//       ...(Requireds extends Requestor<M, any>[] ? [...Requireds] : []),
//       ...(Optionals extends Requestor<M, any>[] ? [...Optionals] : []),
//     ]
//   >
// >;

const through = <T>() =>
  requestor<T, T>((pass, _fail, message) => {
    pass(message);
  });

const double = () =>
  requestor<number, number>((pass, _fail, number) => {
    pass(number * number);
  });

const stringify = <T>() =>
  requestor<T, string>((pass, _fail) => {
    pass(String());
  });

// const test = simultaneous([
//   double(),
//   stringify<number>(),
//   through<number>(),
//   // through<string>(),
// ], [
//   double(),
// ]);

// test.run({
//   success(value) {
//     const a = value[0];
//     const b = value[1];
//     const c = value[2];
//     const d = value[3];
//   },
// });

type ValuesOf<M, Requestors> = {
  [n in keyof Requestors]: Value<Lookup<Requestors, n>>;
};

declare function race<
  Requestors,
  M = Message<First<Requestors>>,
>(
  requestors: Requestors extends Requestor<M, any>[] ? [...Requestors] : [],
): Requestor<M, Lookup<ValuesOf<M, Requestors>, number>>;
