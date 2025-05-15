import { nonListenerHttpFactory } from "./http-factories-utils/http-factories.ts";
import { httpSpecificMethod } from "./http-factories-utils/http-factories.ts";
import { HttpSpec } from "./http-factories-utils/http-types.ts";

export const delete$ = <T>(url: string, spec?: HttpSpec) => {
  return nonListenerHttpFactory<T>("DELETE")(url, spec);
};

export const httpDelete = <T>(url: string, spec?: HttpSpec) => {
  return httpSpecificMethod<T>("DELETE")(url, spec);
};
