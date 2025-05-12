let defaultScheduler = {
  schedule(callback, timeout, ...args) {
    setTimeout(callback, timeout, ...args);
  },
  unschedule(id) {
    clearTimeout(id);
  },
};

let safeRecursionMode = false;

export const getDefaultScheduler = () => {
  return defaultScheduler;
};

export const setDefaultScheduler = (scheduler) => {
  defaultScheduler = scheduler;
};

export const getSafeRecursionMode = () => {
  return safeRecursionMode;
};

export const setSafeRecursionMode = (isSafe) => {
  safeRecursionMode = isSafe;
};
