import { nonListenerHttpFactory } from "./http-factories-utils/http-factories.js";
import { httpSpecificMethod } from "./http-factories-utils/http-factories.js";

export const delete$ = nonListenerHttpFactory("DELETE");
export const httpDelete = httpSpecificMethod("DELETE");
