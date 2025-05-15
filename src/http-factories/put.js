import { listenerHttpFactory } from "./http-factories-utils/http-factories.ts";
import { httpSpecificMethod } from "./http-factories-utils/http-factories.ts";

export const put$ = listenerHttpFactory("PUT");
export const httpPut = httpSpecificMethod("PUT");
