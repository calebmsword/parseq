export const exists = (value: any) => {
  return value !== undefined && value !== null;
};

export const isObject = (value: any) => {
  return value !== null && typeof value === "object";
};

export const isBoolean = (value: any) => {
  return typeof value === "boolean";
};

export const isString = (value: any) => {
  return typeof value === "string";
};

export const isCallable = (value: any) => {
  return typeof value === "function";
};

export const isThenable = (value: any) => {
  return isObject(value) && isCallable(value.then);
};

export const isScheduler = (value: any) => {
  return isObject(value) && isCallable(value.schedule) &&
    isCallable(value.unschedule);
};
