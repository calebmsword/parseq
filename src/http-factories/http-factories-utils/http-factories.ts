import { empty } from "../../misc-factories/empty.ts";
import { map } from "../../misc-factories/map.ts";
import { sequence } from "../../crockford-factories/sequence.ts";
import {
  isObject,
  isString,
} from "../../parseq-utilities/parseq-utilities-type-checking.ts";
import { httpInternal } from "../http.ts";
import { is2xx } from "../is2xx.ts";
import { HttpMessage, HttpSpec, HttpValue, Json } from "./http-types.ts";

export const listenerHttpFactory = <T>(method: string, factoryName: string) => {
  return (url: string, spec?: HttpSpec) => {
    return sequence([
      map<string | Json, { body: string | Json }>((message) => {
        return isString(message) || isObject(message)
          ? { body: message }
          : { body: {} };
      }),
      httpInternal<T>(factoryName, url, method, spec),
      is2xx<T>(),
      map<HttpValue<T>, T>((response) => {
        return response.data;
      }),
    ]);
  };
};

export const nonListenerHttpFactory = <T>(
  method: string,
  factoryName: string,
) => {
  return (url: string, spec?: HttpSpec) => {
    return sequence([
      empty(),
      httpInternal<T>(factoryName, url, method, spec),
      is2xx<T>(),
      map<HttpValue<T>, T>((response) => {
        return response.data;
      }),
    ]);
  };
};

export const mapToHttpSpecificMethod = <M, V>(
  method: string,
  factoryName: string,
) => {
  return (mapper: (message: M) => HttpMessage) => {
    return sequence([
      map(mapper),
      httpInternal<V>(factoryName, '', method),
      is2xx<V>(),
      map<HttpValue<V>, V>((response) => {
        return response.data;
      }),
    ]);
  };
};
