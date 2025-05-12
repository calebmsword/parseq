import { listenerHttpFactory } from "./http-factories-utils/http-factories.js";
import { httpSpecificMethod } from "./http-factories-utils/http-factories.js";

export const post$ = listenerHttpFactory("POST");
export const httpPost = httpSpecificMethod("POST");
