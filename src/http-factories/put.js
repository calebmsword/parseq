import { listenerHttpFactory } from "./http-factories-utils/http-factories.js";
import { httpSpecificMethod } from "./http-factories-utils/http-factories.js";

export const put$ = listenerHttpFactory("PUT");
export const httpPut = httpSpecificMethod("PUT");
