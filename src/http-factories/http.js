import {
  exists,
  isBoolean,
  isCallable,
  isObject,
  isPrimitive,
  isString,
  safeCallback
} from "../parseq-utilities/misc.js";
import { requestor } from "../parseq-utilities/requestor.js";
import {
  ContentType,
  getStatusMessage,
  isJson,
  recognizedContentType,
  Stringify,
} from "./http-factories-utils/http-misc.js";

export const http = (baseUrl, method, spec) => {
  if (isPrimitive(spec)) {
    spec = {};
  }

  let {
    params,
    headers,
    body,
    contentType,
    customCancel,
    autoParseRequest = true,
    autoParseResponse = true,
    log,
  } = spec;

  if (isPrimitive(headers)) {
    headers = {};
  }

  if (isPrimitive(params)) {
    params = {};
  }

  return requestor((pass, fail, httpMessage) => {
    if (isPrimitive(httpMessage)) {
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
      headers = { ...headers, ...additionalHeaders };
    }

    // concantenate factory query parameters with those from requestor
    if (isObject(additionalParams)) {
      params = { ...params, ...additionalParams };
    }

    // let headers override `contentType` if headers defines it
    const contentTypeKey = Object.keys(headers || {}).find((key) => {
      return key.toLowerCase().includes("content-type");
    });
    if (exists(contentTypeKey) && exists(headers)) {
      const _contentType = headers[contentTypeKey];

      if (
        exists(_contentType) &&
        _contentType.includes(ContentType["x-www-form-urlencoded"])
      ) {
        contentType = ContentType["x-www-form-urlencoded"];
      } else if (
        exists(_contentType) && _contentType.includes(ContentType.json)
      ) {
        contentType = ContentType.json;
      } else {
        contentType = ContentType.other;
      }
    }

    // If improper log provided, use default log
    if (!isCallable(log)) {
      log = (error) => {
        console.log("Could not autoparse response:\n", error);
      };
    }

    // requestor can append URL
    if (isString(additionalPath)) {
      baseUrl += "/" + additionalPath;
    }

    // determine query parameters
    if (isObject(params) && Object.keys(params).length > 0) {
      baseUrl += `?${new URLSearchParams(Object.entries(params)).toString()}`;
    }

    // If headers didn't override `contentType`, apply `contentType`
    if (isString(contentType) && exists(headers)) {
      headers["Content-Type"] = ContentType[contentType];
    }

    // Automatically parse request
    if (isObject(body) && autoParseRequest !== false) {
      body = Stringify[contentType](body);
    }

    // XMLHttpRequest isn't allowed to assign content-length, toss it
    Object.keys(headers || {}).forEach((header) => {
      if (header?.toLowerCase() === "content-length") {
        delete headers[header];
      }
    });

    const request = new XMLHttpRequest();

    request.onreadystatechange = safeCallback(fail, () => {
      if (request.readyState !== XMLHttpRequest.DONE) {
        return;
      }

      const code = request.status;

      const message = getStatusMessage(request.status);

      let headers = {};

      let data = "";

      headers = {};
      request.getAllResponseHeaders().split("\r\n").forEach((line) => {
        if (line === "") {
          return;
        }
        const [header, headerValue] = line
          .split(":")
          .map((string) => string.trim());
        headers[header] = headerValue;
      });

      let responseHandler = (unparsed) => unparsed;

      // If auto-parsing response, JSON.parse response if it is
      // JSON content type
      if (autoParseResponse !== false && isJson(headers)) {
        responseHandler = JSON.parse;
      }

      try {
        data = responseHandler(request.responseText);
      } catch (error) {
        if (isCallable(log)) {
          log(error);
        }
        data = request.responseText;
      }

      pass({
        code,
        message,
        headers,
        data,
      });
    });

    request.onerror = safeCallback(fail, () => {
      throw new Error("An unspecified error occurred in XMLHttpRequest.");
    });

    request.open(method || "GET", baseUrl || "", true);

    Object.keys(headers || {}).forEach((key) => {
      request.setRequestHeader(key, headers && headers[key] || "");
    });

    request.send(isString(body) ? body : undefined);

    const cancellor = isCallable(customCancel)
      ? customCancel(request.abort, pass, fail)
      : () => {
        request.abort;
      };

    if (!isCallable(cancellor)) {
      throw Object.assign(
        new Error("customCancel did not return a function"),
        { evidence: cancellor },
      );
    }

    return cancellor;
  });
};
