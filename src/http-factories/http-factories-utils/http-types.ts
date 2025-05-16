import { Logger } from "../../types.d.ts";
import { ContentTypes } from "./http-misc.ts";

export type ContentType = keyof typeof ContentTypes;

type JsonPrimitives = boolean | number | string | undefined | null;

type JsonObject = {
  [key: string | number]: JsonPrimitives | JsonPrimitives[] | JsonObject;
};

/**
 * Represents an object which can be serialized into JSON.
 */
export type Json = JsonObject | JsonObject[];

/**
 * The factory function which can be passed to `http`.
 */
export type CustomCancellorFactory = (
  abortRequest: () => void,
  fail?: (reason?: unknown) => void,
) => (reason?: unknown) => void;

/**
 * A function which logs an error.
 */
export type Log = (error: Error | unknown) => void;

// Huge thanks to @types/node.
export type IncomingHttpHeaders = {
  [key: string]: string | undefined;
  accept?: string | undefined;
  "accept-language"?: string | undefined;
  "accept-patch"?: string | undefined;
  "accept-ranges"?: string | undefined;
  "access-control-allow-credentials"?: string | undefined;
  "access-control-allow-headers"?: string | undefined;
  "access-control-allow-methods"?: string | undefined;
  "access-control-allow-origin"?: string | undefined;
  "access-control-expose-headers"?: string | undefined;
  "access-control-max-age"?: string | undefined;
  "access-control-request-headers"?: string | undefined;
  "access-control-request-method"?: string | undefined;
  age?: string | undefined;
  allow?: string | undefined;
  "alt-svc"?: string | undefined;
  authorization?: string | undefined;
  "cache-control"?: string | undefined;
  connection?: string | undefined;
  "content-disposition"?: string | undefined;
  "content-encoding"?: string | undefined;
  "content-language"?: string | undefined;
  "content-length"?: string | undefined;
  "content-location"?: string | undefined;
  "content-range"?: string | undefined;
  "content-type"?: string | undefined;
  cookie?: string | undefined;
  date?: string | undefined;
  etag?: string | undefined;
  expect?: string | undefined;
  expires?: string | undefined;
  forwarded?: string | undefined;
  from?: string | undefined;
  host?: string | undefined;
  "if-match"?: string | undefined;
  "if-modified-since"?: string | undefined;
  "if-none-match"?: string | undefined;
  "if-unmodified-since"?: string | undefined;
  "last-modified"?: string | undefined;
  location?: string | undefined;
  origin?: string | undefined;
  pragma?: string | undefined;
  "proxy-authenticate"?: string | undefined;
  "proxy-authorization"?: string | undefined;
  "public-key-pins"?: string | undefined;
  range?: string | undefined;
  referer?: string | undefined;
  "retry-after"?: string | undefined;
  "sec-websocket-accept"?: string | undefined;
  "sec-websocket-extensions"?: string | undefined;
  "sec-websocket-key"?: string | undefined;
  "sec-websocket-protocol"?: string | undefined;
  "sec-websocket-version"?: string | undefined;
  "set-cookie"?: string | undefined;
  "strict-transport-security"?: string | undefined;
  tk?: string | undefined;
  trailer?: string | undefined;
  "transfer-encoding"?: string | undefined;
  upgrade?: string | undefined;
  "user-agent"?: string | undefined;
  vary?: string | undefined;
  via?: string | undefined;
  warning?: string | undefined;
  "www-authenticate"?: string | undefined;
};

// Huge thanks to @types/node.
export type OutgoingHttpHeaders = {
  [key: string]: string | undefined;
  accept?: string | undefined;
  "accept-charset"?: string | undefined;
  "accept-encoding"?: string | undefined;
  "accept-language"?: string | undefined;
  "accept-ranges"?: string | undefined;
  "access-control-allow-credentials"?: string | undefined;
  "access-control-allow-headers"?: string | undefined;
  "access-control-allow-methods"?: string | undefined;
  "access-control-allow-origin"?: string | undefined;
  "access-control-expose-headers"?: string | undefined;
  "access-control-max-age"?: string | undefined;
  "access-control-request-headers"?: string | undefined;
  "access-control-request-method"?: string | undefined;
  age?: string | undefined;
  allow?: string | undefined;
  authorization?: string | undefined;
  "cache-control"?: string | undefined;
  "cdn-cache-control"?: string | undefined;
  connection?: string | undefined;
  "content-disposition"?: string | undefined;
  "content-encoding"?: string | undefined;
  "content-language"?: string | undefined;
  "content-length"?: string | undefined;
  "content-location"?: string | undefined;
  "content-range"?: string | undefined;
  "content-security-policy"?: string | undefined;
  "content-security-policy-report-only"?: string | undefined;
  cookie?: string | undefined;
  dav?: string | undefined;
  dnt?: string | undefined;
  date?: string | undefined;
  etag?: string | undefined;
  expect?: string | undefined;
  expires?: string | undefined;
  forwarded?: string | undefined;
  from?: string | undefined;
  host?: string | undefined;
  "if-match"?: string | undefined;
  "if-modified-since"?: string | undefined;
  "if-none-match"?: string | undefined;
  "if-range"?: string | undefined;
  "if-unmodified-since"?: string | undefined;
  "last-modified"?: string | undefined;
  link?: string | undefined;
  location?: string | undefined;
  "max-forwards"?: string | undefined;
  origin?: string | undefined;
  pragma?: string | undefined;
  "proxy-authenticate"?: string | undefined;
  "proxy-authorization"?: string | undefined;
  "public-key-pins"?: string | undefined;
  "public-key-pins-report-only"?: string | undefined;
  range?: string | undefined;
  referer?: string | undefined;
  "referrer-policy"?: string | undefined;
  refresh?: string | undefined;
  "retry-after"?: string | undefined;
  "sec-websocket-accept"?: string | undefined;
  "sec-websocket-extensions"?: string | undefined;
  "sec-websocket-key"?: string | undefined;
  "sec-websocket-protocol"?: string | undefined;
  "sec-websocket-version"?: string | undefined;
  server?: string | undefined;
  "set-cookie"?: string | undefined;
  "strict-transport-security"?: string | undefined;
  te?: string | undefined;
  trailer?: string | undefined;
  "transfer-encoding"?: string | undefined;
  "user-agent"?: string | undefined;
  upgrade?: string | undefined;
  "upgrade-insecure-requests"?: string | undefined;
  vary?: string | undefined;
  via?: string | undefined;
  warning?: string | undefined;
  "www-authenticate"?: string | undefined;
  "x-content-type-options"?: string | undefined;
  "x-dns-prefetch-control"?: string | undefined;
  "x-frame-options"?: string | undefined;
  "x-xss-protection"?: string | undefined;
};

/**
 * The type of object which can be used as the `spec` argument to `httpGet`,
 * `httpPost`, `httpPut`, and `httpDelete`.
 */
export type SpecificHttpSpec = {
  url?: string;
  params?: { [key: string]: string };
  headers?: OutgoingHttpHeaders;
  body?: Json | string;
  contentType?: ContentType;
  customCancel?: CustomCancellorFactory;
  autoParseRequest?: boolean;
  autoParseResponse?: boolean;
  log?: Log;
};

/**
*  - `pathname`: string. Appends the url path. Should start with a "/".
*  - `params`: object. Represents query parameter keys and their values.
Appends any params provided by the factory.
*  - `body`: Json|string. The request body. If provided, this will
override any value given to the factory.
*  - `headers`: object. Additional headers to use in the request. These
* are concantentated with any headers provided from the factory `spec`.
*  - `contentType`: String. See documentation for `spec.contentType`.
* Specifying the content-type in the header overrides this property completely.
*  - `autoParseRequest`: Boolean. See `spec.autoParseRequest`
* documentation. This will override the value provided in the factory.
*  - `autoParseResponse`: Boolean. See `spec.autoParseResponse`
* documentation. This will override the value provided in the factory.
*  - `customCancel`: Function. A function factory. If provided, this
* `customCancel` will override that provided by the factory. See
* `spec.customCancel` documentations.
*/
export type HttpMessage = {
  pathname?: string;
  params?: { [key: string]: string };
  body?: Json | string;
  headers?: OutgoingHttpHeaders;
  contentType?: ContentType;
  autoParseRequest?: boolean;
  autoParseResponse?: boolean;
  customCancel?: CustomCancellorFactory;
};

/**
 * A successful {@link Result} from
 * `http`/`httpGet`/`httpPost`/`httpPut`/`httpDelete` will have a `value` of the
 * following type.
 * @template T
 * The type of the `data` property. It must be JSON serializable.
 */
export type HttpValue<T> = {
  data: T;
  headers: IncomingHttpHeaders;
  code?: number;
  status?: string;
};

export type HttpSpec = {
  url?: string;
  params?: {
    [key: string]: string;
  };
  headers?: OutgoingHttpHeaders;
  body?: Json | string;
  contentType?: ContentType;
  customCancel?: CustomCancellorFactory;
  autoParseRequest?: boolean;
  autoParseResponse?: boolean;
  logger?: Logger;
};
