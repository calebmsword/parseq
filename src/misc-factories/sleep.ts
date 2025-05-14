import { getDefaultScheduler, Scheduler } from "../parseq-utilities/config.ts";
import { isScheduler } from "../parseq-utilities/parseq-utilities-misc.ts";
import { requestor } from "../parseq-utilities/requestor.ts";

export const sleep = (dt: number, customScheduler: Scheduler) => {
  const scheduler = isScheduler(customScheduler)
    ? customScheduler
    : getDefaultScheduler();

  return requestor<any, undefined>((pass) => {
    const id = scheduler.schedule(pass, dt);

    return () => {
      scheduler.unschedule(id);
    };
  });
};
