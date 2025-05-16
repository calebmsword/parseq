import { nonListenerHttpFactory } from "./http-factories-utils/http-factories.ts";
import { httpSpecificMethod } from "./http-factories-utils/http-factories.ts";
import { HttpSpec } from "./http-factories-utils/http-types.ts";

const DELETE$ = "delete$";

const HTTP_DELETE = "httpDelete";

export const delete$ = <T>(url: string, spec?: HttpSpec) => {
  return nonListenerHttpFactory<T>("DELETE", DELETE$)(url, spec);
};

export const httpDelete = <T>(url: string, spec?: HttpSpec) => {
  return httpSpecificMethod<T>("DELETE", HTTP_DELETE)(url, spec);
};
