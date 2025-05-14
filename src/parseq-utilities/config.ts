export type Scheduler<T extends any[] = any[]> = {
  schedule: (callback: (...args: T) => any, timeout: number, ...args: T) => number;
  unschedule: (id: number) => void;
};

let defaultScheduler: Scheduler = {
  schedule(callback, timeout, ...args) {
    return setTimeout(callback, timeout, ...args);
  },
  unschedule(id) {
    clearTimeout(id);
  },
};

let safeRecursionMode = false;

export const getDefaultScheduler = () => {
  return defaultScheduler;
};

export const setDefaultScheduler = (scheduler: Scheduler) => {
  defaultScheduler = scheduler;
};

export const getSafeRecursionMode = () => {
  return safeRecursionMode;
};

export const setSafeRecursionMode = (isSafe: boolean) => {
  safeRecursionMode = isSafe;
};
