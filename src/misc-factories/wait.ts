import { getDefaultScheduler, Scheduler } from "../parseq-utilities/config.ts";
import { isScheduler } from "../parseq-utilities/parseq-utilities-type-checking.ts";
import { requestor } from "../parseq-utilities/requestor.ts";

/**
 * Propogates the given message after the given amount of time passes.
 * This invokes the application scheduler and settles on a future tick of the
 * event loop.
 */
export const wait = <M>(dt: number, customScheduler?: Scheduler) => {
  const scheduler =
    customScheduler !== null && customScheduler !== undefined &&
      isScheduler(customScheduler)
      ? customScheduler
      : getDefaultScheduler();

  return requestor<M, M>((pass, _fail, message) => {
    const id = scheduler.schedule(pass, dt, message);

    return () => {
      scheduler.unschedule(id);
    };
  });
};
