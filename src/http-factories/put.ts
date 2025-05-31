import { listenerHttpFactory } from "./http-factories-utils/http-factories.ts";
import { mapToHttpSpecificMethod } from "./http-factories-utils/http-factories.ts";
import { HttpMessage, HttpSpec } from "./http-factories-utils/http-types.ts";

const HTTP_PUT = "httpPut";

const MAP_TO_HTTP_PUT = "mapToHttpPut";

export const httpPut = <T>(url: string, spec?: HttpSpec) => {
  return listenerHttpFactory<T>("PUT", HTTP_PUT)(url, spec);
};

export const mapToHttpPut = <M, V>(mapper: (message: M) => HttpMessage) => {
  return mapToHttpSpecificMethod<M, V>("GET", MAP_TO_HTTP_PUT)(mapper);
};
