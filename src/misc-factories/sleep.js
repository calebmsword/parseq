import { getDefaultScheduler } from "../parseq-utilities/config.js";
import { isScheduler } from "../parseq-utilities/misc.js";
import { requestor } from "../parseq-utilities/requestor.js";

export const sleep = (dt, customScheduler) => {
  const scheduler = isScheduler(customScheduler)
    ? customScheduler
    : getDefaultScheduler();

  return requestor((pass) => {
    const id = scheduler.schedule(() => {
      pass();
    }, dt);

    return () => {
      scheduler.unschedule(id);
    };
  });
};
