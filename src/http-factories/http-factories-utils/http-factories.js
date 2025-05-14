import { empty } from "../../misc-factories/empty.ts";
import { map } from "../../misc-factories/map.ts";
import { sequence } from "../../crockford-factories/sequence.ts";
import { isObject, isString } from "../../parseq-utilities/parseq-utilities-misc.ts";
import { http } from "../http.js";
import { is2xx } from "../is2xx.js";

export const listenerHttpFactory = (method) => {
  return (url, spec) => {
    return sequence([
      map((message) => {
        return isString(message) || isObject(message)
          ? { body: message }
          : { body: {} };
      }),
      http(url, method, spec),
      is2xx(),
    ]);
  };
};

export const nonListenerHttpFactory = (method) => {
  return (url, spec) => {
    return sequence([
      empty(),
      http(url, method, spec),
      is2xx(),
    ]);
  };
};

export const httpSpecificMethod = (method) => {
  return (baseUrl, spec) => {
    return sequence([
      http(baseUrl, method, spec),
      is2xx(),
    ]);
  };
};
