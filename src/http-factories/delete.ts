import { nonListenerHttpFactory } from "./http-factories-utils/http-factories.ts";
import { mapToHttpSpecificMethod } from "./http-factories-utils/http-factories.ts";
import { HttpMessage, HttpSpec } from "./http-factories-utils/http-types.ts";

const HTTP_DELETE = "httpDelete";

const MAP_TO_HTTP_DELETE = "mapToHttpDelete";

export const httpDelete = <T>(url: string, spec?: HttpSpec) => {
  return nonListenerHttpFactory<T>("DELETE", HTTP_DELETE)(url, spec);
};

export const mapToHttpDelete = <M, V>(mapper: (message: M) => HttpMessage) => {
  return mapToHttpSpecificMethod<M, V>("DELETE", MAP_TO_HTTP_DELETE)(mapper);
};
