import { nonListenerHttpFactory } from "./http-factories-utils/http-factories.ts";
import { httpSpecificMethod } from "./http-factories-utils/http-factories.ts";

export const delete$ = nonListenerHttpFactory("DELETE");
export const httpDelete = httpSpecificMethod("DELETE");
