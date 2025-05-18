import { nonListenerHttpFactory } from "./http-factories-utils/http-factories.ts";
import { mapToHttpSpecificMethod } from "./http-factories-utils/http-factories.ts";
import { HttpMessage, HttpSpec } from "./http-factories-utils/http-types.ts";

const DELETE$ = "delete$";

const MAP_TO_DELETE$ = "mapToDelete$";

export const delete$ = <T>(url: string, spec?: HttpSpec) => {
  return nonListenerHttpFactory<T>("DELETE", DELETE$)(url, spec);
};

export const mapToDelete$ = <M, V>(mapper: (message: M) => HttpMessage) => {
  return mapToHttpSpecificMethod<M, V>("DELETE", MAP_TO_DELETE$)(mapper);
};
