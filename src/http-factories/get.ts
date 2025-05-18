import { nonListenerHttpFactory } from "./http-factories-utils/http-factories.ts";
import { mapToHttpSpecificMethod } from "./http-factories-utils/http-factories.ts";
import { HttpMessage, HttpSpec } from "./http-factories-utils/http-types.ts";

const GET$ = "get$";

const MAP_TO_GET$ = "mapToGet$";

export const get$ = <T>(url: string, spec?: HttpSpec) => {
  return nonListenerHttpFactory<T>("GET", GET$)(url, spec);
};

export const mapToGet$ = <M, V>(mapper: (message: M) => HttpMessage) => {
  return mapToHttpSpecificMethod<M, V>("GET", MAP_TO_GET$)(mapper);
};
