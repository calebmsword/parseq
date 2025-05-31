import { nonListenerHttpFactory } from "./http-factories-utils/http-factories.ts";
import { mapToHttpSpecificMethod } from "./http-factories-utils/http-factories.ts";
import { HttpMessage, HttpSpec } from "./http-factories-utils/http-types.ts";

const HTTP_GET = "httpGet";

const MAP_TO_HTTP_GET = "mapToHttpGet";

export const httpGet = <T>(url: string, spec?: HttpSpec) => {
  return nonListenerHttpFactory<T>("GET", HTTP_GET)(url, spec);
};

export const mapToHttpGet = <M, V>(mapper: (message: M) => HttpMessage) => {
  return mapToHttpSpecificMethod<M, V>("GET", MAP_TO_HTTP_GET)(mapper);
};
