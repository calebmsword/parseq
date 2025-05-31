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

/**
 * A convenience util for the standard use case for a listener that uses http.
 * The given message is used as the request body for the http request. The
 * requestor succeeds only if the http response has a 2xx status code and the
 * response body is the requestor value.
 */
export const listenerHttpFactory = <T>(method: string, factoryName: string) => {
  return (url: string, spec?: HttpSpec) => {
    return sequence([
      map<string | Json, { body: string | Json }>((message) => {
        return isString(message) || isObject(message)
          ? { body: message }
          : { body: {} };
      }),
      httpInternal<T>(factoryName, url, method, spec),
      is2xx<T>(factoryName),
      map<HttpValue<T>, T>((response) => {
        return response.data;
      }),
    ]);
  };
};

/**
 * A convenience util for the standard use case for a nonlistener http usage.
 * The requestor succeeds only if the http response has a 2xx status code and
 * the response body is the requestor value.
 */
export const nonListenerHttpFactory = <T>(
  method: string,
  factoryName: string,
) => {
  return (url: string, spec?: HttpSpec) => {
    return sequence([
      empty(),
      httpInternal<T>(factoryName, url, method, spec),
      is2xx<T>(factoryName),
      map<HttpValue<T>, T>((response) => {
        return response.data;
      }),
    ]);
  };
};

/**
 * A convenience util for creating requestors.
 * The message is mapped into an HttpSpec object which is used to configure
 * a requestor returned by http. The requestor fails if the response code is not
 * 2xx. The result is the body of the HTTP response.
 * @param method 
 * @param factoryName 
 * @returns 
 */
export const mapToHttpSpecificMethod = <M, V>(
  method: string,
  factoryName: string,
) => {
  return (mapper: (message: M) => HttpMessage) => {
    return sequence([
      map(mapper),
      httpInternal<V>(factoryName, "", method),
      is2xx<V>(factoryName),
      map<HttpValue<V>, V>((response) => {
        return response.data;
      }),
    ]);
  };
};
