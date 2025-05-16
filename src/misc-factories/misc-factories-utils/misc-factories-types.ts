export type Pop<Tuple> = Tuple extends [...infer R, any] ? R
  : undefined;

export type Shift<Tuple> = Tuple extends [any, ...infer R] ? R
  : undefined;
