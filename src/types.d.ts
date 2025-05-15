export type Cancellor = (reason?: unknown) => void;

export type CrockfordRequestor<M, V> = (
  receiver: (result: { value: V; reason: any }) => void,
  message: M,
) => Cancellor | void;
