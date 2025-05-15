export type Flatten<Tuple> = Tuple extends [infer R] ? R : Tuple;

export type Pop<Tuple> = Tuple extends [...infer R, any] ? Flatten<R>
  : undefined;

export type Shift<Tuple> = Tuple extends [any, ...infer R] ? Flatten<R>
  : undefined;
