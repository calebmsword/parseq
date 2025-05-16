import { nonListenerHttpFactory } from "./http-factories-utils/http-factories.ts";
import { httpSpecificMethod } from "./http-factories-utils/http-factories.ts";
import { HttpSpec } from "./http-factories-utils/http-types.ts";

const GET$ = "get$";

const HTTP_GET = "httpGet";

export const get$ = <T>(url: string, spec?: HttpSpec) => {
  return nonListenerHttpFactory<T>("GET", GET$)(url, spec);
};

export const httpGet = <T>(url: string, spec?: HttpSpec) => {
  return httpSpecificMethod<T>("GET", HTTP_GET)(url, spec);
};
