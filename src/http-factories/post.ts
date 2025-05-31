import { listenerHttpFactory } from "./http-factories-utils/http-factories.ts";
import { mapToHttpSpecificMethod } from "./http-factories-utils/http-factories.ts";
import { HttpMessage, HttpSpec } from "./http-factories-utils/http-types.ts";

const HTTP_POST = "httpPost";

const MAP_TO_HTTP_POST = "mapToHttpPost";

export const httpPost = <T>(url: string, spec?: HttpSpec) => {
  return listenerHttpFactory<T>("POST", HTTP_POST)(url, spec);
};

export const mapToHttpPost = <M, V>(mapper: (message: M) => HttpMessage) => {
  return mapToHttpSpecificMethod<M, V>("GET", MAP_TO_HTTP_POST)(mapper);
};
