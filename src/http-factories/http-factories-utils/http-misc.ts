/**
 * Gets the status message corresponding to the provided statusCode.
 * If the statusCode is unrecognized or not a number, then `null` is returned.
 */
export const getStatusMessage = (statusCode: number) => {
  switch (statusCode) {
    case 100:
      return "Continue";
    case 101:
      return "Switching Protocols";
    case 102:
      return "Processing";
    case 103:
      return "Early Hints";
    case 200:
      return "OK";
    case 201:
      return "Created";
    case 202:
      return "Accepted";
    case 203:
      return "Non-Authoritative Information";
    case 204:
      return "No Content";
    case 205:
      return "Reset Content";
    case 206:
      return "Partial Content";
    case 207:
      return "Multi-Status";
    case 208:
      return "Already Reported";
    case 226:
      return "IM Used";
    case 300:
      return "Multiple Choices";
    case 301:
      return "Moved Permanently";
    case 302:
      return "Found";
    case 303:
      return "Not Modified";
    case 307:
      return "Temporary Redirect";
    case 308:
      return "Permanent Redirect";
    case 400:
      return "Bad Request";
    case 401:
      return "Unauthorized";
    case 403:
      return "Forbidden";
    case 404:
      return "Not Found";
    case 405:
      return "Method Not Allowed";
    case 406:
      return "Not Acceptable";
    case 407:
      return "Proxy Authentication Required";
    case 408:
      return "Request Timeout";
    case 409:
      return "Conflict";
    case 410:
      return "Gone";
    case 411:
      return "Length Required";
    case 412:
      return "Precondition Failed";
    case 413:
      return "Payload Too Large";
    case 414:
      return "URI Too Long";
    case 415:
      return "Unsupported Media Type";
    case 416:
      return "Range Not Satisfiable";
    case 417:
      return "Expectation Failed";
    case 418:
      return "I'm a teapot";
    case 421:
      return "Misdirected Request";
    case 422:
      return "Unprocessable Content";
    case 423:
      return "Locked";
    case 424:
      return "Failed Dependency";
    case 426:
      return "Upgrade Required";
    case 428:
      return "Precondition Required";
    case 429:
      return "Too Many Requests";
    case 431:
      return "Request Header Fields Too Large";
    case 451:
      return "Unavailable For Legal Reasons";
    case 500:
      return "Internal Server Error";
    case 501:
      return "Not Implemented";
    case 502:
      return "Bad Gateway";
    case 503:
      return "Service Unavailable";
    case 504:
      return "Gateway Timeout";
    case 505:
      return "HTTP Version Not Supported";
    case 506:
      return "Variant Also Negotiates";
    case 507:
      return "Insufficient Storage";
    case 508:
      return "Loop Detected";
    case 510:
      return "Not Extended";
    case 511:
      return "Network Authentication Required";
    default:
      return;
  }
};

export const ContentTypes = Object.freeze({
  "json": "application/json",
  "application/json": "application/json",
  "default": "application/json",
  "x-www-form-urlencoded": "application/x-www-form-urlencoded",
  "application/x-www-form-urlencoded": "application/x-www-form-urlencoded",
  "other": "other",
});

const contentTypes = Object.keys(ContentTypes);

export const recognizedContentType = (contentType: string) => {
  return contentTypes.includes(contentType);
};

export const searchParamatize = (object: object) => {
  return new URLSearchParams(Object.entries(object)).toString();
};

export const Stringify = {
  "json": JSON.stringify,
  "application/json": JSON.stringify,
  "default": JSON.stringify,
  "x-www-form-urlencoded": searchParamatize,
  "application/x-www-form-urlencoded": searchParamatize,
  "other": (body: object | string) => String(body),
};

export const isJson = (headers: { [key: string]: string }) => {
  return Object.keys(headers).some((key) => {
    return key.toLowerCase().includes("content-type") &&
      (headers[key] || "")
        .toLowerCase()
        .includes("application/json");
  });
};
