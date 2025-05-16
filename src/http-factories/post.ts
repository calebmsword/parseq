import { listenerHttpFactory } from "./http-factories-utils/http-factories.ts";
import { httpSpecificMethod } from "./http-factories-utils/http-factories.ts";
import { HttpSpec } from "./http-factories-utils/http-types.ts";

const POST$ = "post$";

const HTTP_POST = "httpPost";

export const post$ = <T>(url: string, spec?: HttpSpec) => {
  return listenerHttpFactory<T>("POST", POST$)(url, spec);
};

export const httpPost = <T>(url: string, spec?: HttpSpec) => {
  return httpSpecificMethod<T>("POST", HTTP_POST)(url, spec);
};
