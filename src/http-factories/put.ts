import { listenerHttpFactory } from "./http-factories-utils/http-factories.ts";
import { httpSpecificMethod } from "./http-factories-utils/http-factories.ts";
import { HttpSpec } from "./http-factories-utils/http-types.ts";

const PUT$ = "put$";

const HTTP_PUT = "httpPut";

export const put$ = <T>(url: string, spec?: HttpSpec) => {
  return listenerHttpFactory<T>("PUT", PUT$)(url, spec);
};

export const httpPost = <T>(url: string, spec?: HttpSpec) => {
  return httpSpecificMethod<T>("PUT", HTTP_PUT)(url, spec);
};
