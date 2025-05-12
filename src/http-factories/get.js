import { nonListenerHttpFactory } from "./http-factories-utils/http-factories.js"; 
import { httpSpecificMethod } from "./http-factories-utils/http-factories.js";

export const get$ = nonListenerHttpFactory("GET");
export const httpGet = httpSpecificMethod("GET");
