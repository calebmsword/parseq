import { makeReason } from "../crockford-factories/crockford-factories-utils/cockford-factories-misc.ts";
import { getLogger } from "../parseq-utilities/config.ts";
import { safeCallback } from "../parseq-utilities/parseq-utilities-misc.ts";
import {
  exists,
  isBoolean,
  isCallable,
  isLogger,
  isObject,
  isString,
} from "../parseq-utilities/parseq-utilities-type-checking.ts";
import { requestor } from "../parseq-utilities/requestor.ts";
import { Logger } from "../types.d.ts";
import {
  ContentTypes,
  getStatusMessage,
  isJson,
  recognizedContentType,
  Stringify,
} from "./http-factories-utils/http-misc.ts";
import {
  HttpMessage,
  HttpSpec,
  HttpValue,
} from "./http-factories-utils/http-types.ts";

export const HTTP = "http";

export const httpInternal = <T>(
  factoryName: string,
  baseUrl: string,
  method: string,
  spec?: HttpSpec,
) => {
  let {
    params,
    headers,
    body,
    contentType,
    customCancel,
    autoParseRequest = true,
    autoParseResponse = true,
    logger,
  } = spec !== null && typeof spec === "object" ? spec : {};

  if (headers === null || typeof headers !== "object") {
    headers = {};
  }

  if (params === null || typeof params !== "object") {
    params = {};
  }

  if (exists(logger) && !isLogger(logger)) {
    throw makeReason(factoryName, "Expected a logger", logger);
  }

  if (logger === null || logger === undefined) {
    logger = getLogger();
  }

  return requestor<HttpMessage | undefined, HttpValue<T>>(
    (pass, fail, httpMessage) => {
      if (httpMessage === null || typeof httpMessage !== "object") {
        httpMessage = {};
      }

      // requestor can override body, contentType, or customCancel
      body = isObject(httpMessage.body) ? httpMessage.body : body;
      contentType = exists(httpMessage.contentType)
        ? httpMessage.contentType
        : contentType;
      customCancel = exists(httpMessage.customCancel)
        ? httpMessage.customCancel
        : customCancel;

      const additionalHeaders = httpMessage.headers;
      const additionalParams = httpMessage.params;
      const additionalPath = httpMessage.pathname;

      // requestor can disable automatic request parsing
      if (isBoolean(httpMessage.autoParseRequest)) {
        autoParseRequest = httpMessage.autoParseRequest;
      }

      // requestor can disable automatic response parsing
      if (isBoolean(httpMessage.autoParseResponse)) {
        autoParseResponse = httpMessage.autoParseResponse;
      }

      // if the `contentType` is not recognized, use default
      if (!isString(contentType) || !recognizedContentType(contentType)) {
        contentType = "default";
      }

      // concantentate factory headers with any provided from requestor
      if (isObject(additionalHeaders)) {
        Object.assign(headers as object, additionalHeaders);
      }

      // concantenate factory query parameters with those from requestor
      if (isObject(additionalParams)) {
        Object.assign(params, additionalParams);
      }

      // let headers override `contentType` if headers defines it
      const contentTypeKey = Object.keys(headers || {}).find((key) => {
        return key.toLowerCase().includes("content-type");
      });
      if (
        contentTypeKey !== null && contentTypeKey !== undefined &&
        headers !== null && headers !== undefined
      ) {
        const _contentType = headers[contentTypeKey];

        if (
          _contentType !== null && _contentType !== undefined &&
          _contentType.includes(ContentTypes["x-www-form-urlencoded"])
        ) {
          contentType = ContentTypes["x-www-form-urlencoded"];
        } else if (
          _contentType !== null && _contentType !== undefined &&
          _contentType.includes(ContentTypes.json)
        ) {
          contentType = ContentTypes.json;
        } else {
          contentType = ContentTypes.other;
        }
      }

      // requestor can append URL
      if (isString(additionalPath)) {
        baseUrl += "/" + additionalPath;
      }

      // determine query parameters
      if (
        params !== null && typeof params === "object" &&
        Object.keys(params).length > 0
      ) {
        baseUrl += `?${new URLSearchParams(Object.entries(params)).toString()}`;
      }

      // If headers didn't override `contentType`, apply `contentType`
      if (
        typeof contentType === "string" && headers !== null &&
        headers !== undefined
      ) {
        headers["Content-Type"] = ContentTypes[contentType];
      }

      // Automatically parse request
      if (
        body !== null && typeof body === "object" && autoParseRequest !== false
      ) {
        body = Stringify[contentType](body);
      }

      // XMLHttpRequest isn't allowed to assign content-length, toss it
      Object.keys(headers || {}).forEach((header) => {
        if (header?.toLowerCase() === "content-length") {
          delete (headers || {})[header];
        }
      });

      const request = new XMLHttpRequest();

      const cancellor = typeof customCancel === "function"
        ? customCancel(request.abort, fail)
        : () => {
          return request.abort;
        };

      if (!isCallable(cancellor)) {
        fail(
          makeReason(
            factoryName,
            "customCancel did not return a function",
            cancellor,
          ),
        );
        return;
      }

      request.open(method || "GET", baseUrl || "", true);

      Object.keys(headers || {}).forEach((key) => {
        request.setRequestHeader(key, headers && headers[key] || "");
      });

      request.onreadystatechange = safeCallback(fail, () => {
        if (request.readyState !== XMLHttpRequest.DONE) {
          return;
        }

        // when the request is finished, request is no longer null
        const code = request.status as number;

        const message = getStatusMessage(request.status as number);

        let responseHeaders: { [key: string]: string } = {};

        let data: T | string = "";

        responseHeaders = {};
        request.getAllResponseHeaders().split("\r\n").forEach((line) => {
          if (line === "") {
            return;
          }
          const [header, headerValue] = line
            .split(":")
            .map((string) => string.trim());
          responseHeaders[header] = headerValue;
        });

        let responseHandler = (unparsed: string) => unparsed;

        // If auto-parsing response, JSON.parse response if it is
        // JSON content type
        if (autoParseResponse !== false && isJson(responseHeaders)) {
          responseHandler = JSON.parse;
        }

        try {
          data = responseHandler(request.responseText);
        } catch (error) {
          (logger as Logger).warn("Could not autoparse response:\n", error);
          data = request.responseText;
        }

        pass({
          code,
          status: message,
          headers: responseHeaders,
          data: data as T,
        });
        return;
      });

      request.onerror = safeCallback(fail, () => {
        fail(
          makeReason(
            factoryName,
            "An unspecified error occurred in XMLHttpRequest.",
          ),
        );
        return;
      });

      request.send(isString(body) ? body : undefined);

      return cancellor;
    },
  );
};

export const http = <T>(
  baseUrl: string,
  method: string,
  spec?: HttpSpec,
) => {
  return httpInternal<T>(HTTP, baseUrl, method, spec);
};
