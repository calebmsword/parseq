const HIDDEN = Symbol();

export class Absent{
  [HIDDEN] = HIDDEN
};

export type TryCatchValue<Try, Catch, Finally> = Catch extends Absent
  ? Finally extends Absent
    ? Try
    : Finally
  : Finally extends Absent
    ? Try | Catch
    : Finally | Catch;  
