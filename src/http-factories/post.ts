import { listenerHttpFactory } from "./http-factories-utils/http-factories.ts";
import { httpSpecificMethod } from "./http-factories-utils/http-factories.ts";
import { HttpSpec } from "./http-factories-utils/http-types.ts";

export const post$ = <T>(url: string, spec?: HttpSpec) => {
  return listenerHttpFactory<T>("POST")(url, spec);
};

export const httpPost = <T>(url: string, spec?: HttpSpec) => {
  return httpSpecificMethod<T>("POST")(url, spec);
};
