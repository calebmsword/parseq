import { listenerHttpFactory } from "./http-factories-utils/http-factories.ts";
import { mapToHttpSpecificMethod } from "./http-factories-utils/http-factories.ts";
import { HttpMessage, HttpSpec } from "./http-factories-utils/http-types.ts";

const PUT$ = "put$";

const MAP_TO_PUT$ = "mapToPut$";

export const put$ = <T>(url: string, spec?: HttpSpec) => {
  return listenerHttpFactory<T>("PUT", PUT$)(url, spec);
};

export const mapToPost$ = <M, V>(mapper: (message: M) => HttpMessage) => {
  return mapToHttpSpecificMethod<M, V>("GET", MAP_TO_PUT$)(mapper);
};
