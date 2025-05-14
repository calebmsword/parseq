export type Cancellor = (reason?: any) => void;

export type CrockfordRequestor<M, V> = (
  receiver: (result: { value: V; reason: any }) => void,
  message: M,
) => Cancellor | void;
