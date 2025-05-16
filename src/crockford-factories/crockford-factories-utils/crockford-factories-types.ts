import { Result } from "../../types.d.ts";
import { Requestor } from "../../parseq-utilities/requestor-class.ts";

/** The Message of the given Requestor. */
export type Message<R> = R extends Requestor<infer M, unknown> ? M : unknown;

/** The Value of the given Requestor. */
export type Value<R> = R extends Requestor<any, infer V> ? V : unknown;

/** The type of the first element of the given array. */
export type First<R, Default = unknown> = R extends [infer T, ...unknown[]] ? T
  : Default;

/** The type of the last element of the given array. */
export type Last<R, Default = unknown> = R extends [...unknown[], infer T] ? T
  : Default;

/** The type of the nth element of the given array. */
export type Lookup<Array, n> = n extends keyof Array ? Array[n] : never;

/** Maps a tuple type to a tuple of Results type. */
export type ResultsOf<Values extends any[]> = {
  [n in keyof Values]: Result<Value<Lookup<Values, n>>>;
};

/** Maps a tuple of Requestors type to a tuple of values. */
export type ValuesOf<Requestors> = {
  [n in keyof Requestors]: Value<Lookup<Requestors, n>>;
};

/** A union type of all values mapped by the array-like type. */
export type ElementOf<ArrayLike> = Lookup<ArrayLike, number>;

/**
 * "Casts" the given type as a Requestor tuple where each Requestor takes the
 * same message, or as an empty array if this is impossible.
 */
export type AsRequestors<Requestors, M> = Requestors extends Requestor<M, any>[]
  ? [...Requestors]
  : [];

/**
 * Is the given type ThisRequestor if ThisRequestor is a Requestor that takes a
 * message of the expected type, otherwise "casts" ThisRequestor as one that
 * does.
 * An Internal helper type. */
type AsTakesMessage<ThisRequestor, SomeMessage> = Message<ThisRequestor> extends
  SomeMessage ? ThisRequestor
  : Requestor<SomeMessage, Value<ThisRequestor>>;

/**
 * Thinks of this type as one that casts the given type as a Requestor tuple
 * where each Requestor takes the same message.
 */
export type SameMessages<T, M> = T extends [infer Requestor, ...infer Rest]
  // tuple length > 0
  ? [AsTakesMessage<Requestor, M>, ...SameMessages<Rest, M>]
  // tuple length == 0
  : Requestor<M, any>[];

/**
 * Casts the given type as a Requestor tuple where each takes the same message.
 */
export type AsSameMessages<Requestors, M> =
  & AsRequestors<Requestors, M>
  & SameMessages<Requestors, M>;

/**
 * Equivalent to AsSameMessages where the particular message is the first
 * message of the given Requestors.
 */
export type AllHaveSameMessages<Requestors> = AsSameMessages<
  Requestors,
  Message<First<Requestors>>
>;

/**
 * Is the given type Left if Left is "sequenceable into" Right (the value of
 * Left is the message of Right), otherwise "casts" Left into a Requestor that
 * is sequenceable into Right.
 */
type AsSequenceableInto<Left, Right> = Value<Left> extends Message<Right> ? Left
  : Requestor<Message<Left>, Message<Right>>;

// special thanks to https://stackoverflow.com/users/5770132/oblosys and their
// comment on https://stackoverflow.com/questions/53173203/typescript-recursive-function-composition/53175538#53175538
/**
 * "Casts" the given type into a Requestor tuple where each Requestor is
 * sequenceable into the Requestor to its right.
 */
export type AsSequenceable<Requestors> = Requestors extends
  [infer Left, infer Right, ...infer Rest]
  // tuple length >= 2
  ? [AsSequenceableInto<Left, Right>, ...AsSequenceable<[Right, ...Rest]>]
  // tuple length == 1 || tuple length == 0
  : Requestors;
