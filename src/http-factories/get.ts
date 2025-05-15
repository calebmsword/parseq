import { nonListenerHttpFactory } from "./http-factories-utils/http-factories.ts";
import { httpSpecificMethod } from "./http-factories-utils/http-factories.ts";
import { HttpSpec } from "./http-factories-utils/http-types.ts";

export const get$ = <T>(url: string, spec?: HttpSpec) => {
  return nonListenerHttpFactory<T>("GET")(url, spec);
};

export const httpGet = <T>(url: string, spec?: HttpSpec) => {
  return httpSpecificMethod<T>("GET")(url, spec);
};
