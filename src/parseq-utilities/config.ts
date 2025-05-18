import { Logger } from "../types.d.ts";

export type Scheduler<T extends any[] = any[]> = {
  schedule: (
    callback: (...args: T) => any,
    timeout: number,
    ...args: T
  ) => number;
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

export const getDefaultScheduler = () => {
  return defaultScheduler;
};

export const setDefaultScheduler = (scheduler: Scheduler) => {
  defaultScheduler = scheduler;
};

let logger: Logger = {
  debug: console.debug,
  log: console.log,
  info: console.info,
  warn: console.warn,
  error: console.error,
};

export const getLogger = () => {
  return logger;
};

export const setLogger = (newLogger: Logger) => {
  logger = newLogger;
};
