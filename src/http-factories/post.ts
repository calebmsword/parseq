import { listenerHttpFactory } from "./http-factories-utils/http-factories.ts";
import { mapToHttpSpecificMethod } from "./http-factories-utils/http-factories.ts";
import { HttpMessage, HttpSpec } from "./http-factories-utils/http-types.ts";

const POST$ = "post$";

const MAP_TO_POST$ = "mapToPost$";

export const post$ = <T>(url: string, spec?: HttpSpec) => {
  return listenerHttpFactory<T>("POST", POST$)(url, spec);
};

export const mapToPost$ = <M, V>(mapper: (message: M) => HttpMessage) => {
  return mapToHttpSpecificMethod<M, V>("GET", MAP_TO_POST$)(mapper);
};
