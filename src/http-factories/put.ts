import { listenerHttpFactory } from "./http-factories-utils/http-factories.ts";
import { httpSpecificMethod } from "./http-factories-utils/http-factories.ts";
import { HttpSpec } from "./http-factories-utils/http-types.ts";

export const put$ = <T>(url: string, spec?: HttpSpec) => {
  return listenerHttpFactory<T>("PUT")(url, spec);
};

export const httpPost = <T>(url: string, spec?: HttpSpec) => {
  return httpSpecificMethod<T>("PUT")(url, spec);
};
