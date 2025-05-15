import fs from "node:fs";
import http from "node:http";
import https from "node:https";
import { Buffer } from "node:buffer";
import { URL as Url } from "node:url";

/**
 * An incomplete mock of XMLHttpRequest.
 *
 * With this, we can use XMLHttpRequest in Node in (most of) the same ways it
 * can be used in the browser:
 *
 * @example
 * ```
 * if (typeof globalThis.XMLHttpRequest !== "function")
 *     globalThis.XMLHttpRequest = MockXMLHttpRequest;
 *
 * // this will work like it does in the browser
 * const request = new XMLHttpRequest();
 * ```
 *
 * This class wraps usage of Node's `http.request` or `https.request` API (or
 * the `fs` module, if you use XMLHttpRequest to grab a local file).
 *
 * This mock was created to emulate the subset of the XMLHttpRequest API that
 * parseq uses and it should not be used for any other purpose. There are many
 * features in the browser specification for XMLHttpRequest that are missing or
 * incorrect. Let "request" represent an XMLHttpRequest instance:
 *  - request.responseXML is always null.
 *  - request.overrideMimeType() is not implemented.
 *  - request.upload is not present.
 *  - request.timeout is not present.
 *  - events are not passed a mock of the event object.
 *  - Cookies are not persisted between requests.
 *  - Synchronous behavior is NOT implemented.
 *  - Local file access encodes all files as UTF-8.
 *
 * This mock is nearly an exact copy of that from
 * https://github.com/driverdan/node-XMLHttpRequest. The differences from the
 * original implementation remove deprecated method calls, uses modern ES6+
 * syntax, and excludes the extremely insecure implementation of synchronous
 * http.request calls. The original repo uses the MIT license, so this is fine.
 *
 * I also consulted
 * https://developer.mozilla.org/en-US/docs/Web/API/XMLHttpRequest for much of
 * the documentation for this class.
 * 
 * If this were to be refactored to be Deno-only instead of Deno 2/Node
 * compliant, use the fetch API instead of the http/https functions from Node.
 * (We could introduce a #getDoRequest function that a subclass could override
 * to allow environment-specific subclasses.)
 */
class MockXMLHttpRequest {
  // properties ----------------------------------------

  /** Represents the UNSENT readystate. */
  static UNSENT: number = 0;

  /** Represents the OPENED readystate. */
  static OPENED: number = 1;

  /** Represents the HEADERS_RECEIVED readystate. */
  static HEADERS_RECEIVED: number = 2;

  /** Represents the LOADING readystate. */
  static LOADING: number = 3;

  /** Represents the DONE readystate. */
  static DONE: number = 4;

  /** Represents the UNSENT readystate. */
  UNSENT: number = 0;

  /** Represents the OPENED readystate. */
  OPENED: number = 1;

  /** Represents the HEADERS_RECEIVED readystate. */
  HEADERS_RECEIVED: number = 2;

  /** Represents the LOADING readystate. */
  LOADING: number = 3;

  /** Represents the DONE readystate. */
  DONE: number = 4;

  /** The current state of the request. */
  readyState: number = this.UNSENT;

  /**
   * Handler called once an opened request is sent.
   * This function is called, without arguments, every time `readyState`
   * changes value.
   */
  onreadystatechange: (() => void) | null = null;

  /** This is the text body sent by a server request. */
  responseText: string = "";

  /**
   * The `Document` containing the HTML/XML retrieved by the request.
   * This is the interface used by the DOM. This can be `null` if the request
   * is unsuccessful or the if the data can't be parsed as XML.
   */
  responseXML: Document | null = null;

  /** The status code of the request, or null if request is unfinished. */
  status: number | null = null;

  /**
   * The status message sent by the server.
   * Any response over an HTTP/2 will be an empty string since that protocol
   * does not support status messages.
   */
  statusText: string | null = "";

  /**
   * Whether cross-site Access-Control requests need credentials.
   * "Credentials" could include cookies or authorization headers, etc.
   */
  withCredentials: boolean = false;

  /**
   * Represents the request object.
   * This is the request object returned by `http.request` or `https.request`.
   */
  #request: any;

  /**
   * Contains the response result.
   * This is the response object passed to the callback in `http.request` or
   * `https.request`.
   */
  #response: {
    aborted?: boolean;
    complete?: boolean;
    connection?: object;
    headers?: { [key: string]: string | string[] | undefined };
    headersDistinct?: { [key: string]: string[] | undefined };
    httpVersion?: string;
    httpVersionMajor?: number;
    httpVersionMinor?: number;
    rawHeaders?: string[];
    rawTrailers?: string[];
    socket?: object;
    statusCode?: number;
    statusMessage?: string;
    trailers?: { [key: string]: string | undefined };
    trailersDistinct?: { [key: string]: string[] | undefined };
    url?: string;
  } = {};

  /** A hash representing internal settings for this request. */
  #settings: {
    method?: string;
    async?: boolean;
    user?: string;
    password?: string;
    url?: string;
  } = {};

  /** Whether or not forbidden headers should be excluded from requests. */
  #disableHeaderCheck: boolean = false;

  /** Maps headers to their values. */
  #headers: { [key: string]: number | boolean | string } = {};

  /**
   * A case-insensitive collection of contained headers.
   * Specifically, this maps *lowercased* header names to their values.
   */
  #headersCase: any = {};

  /**
   * The default HTTP headers to use if none are provided.
   * This object maps header names to their values.
   */
  #defaultHeaders: { [key: string]: string } = {
    "User-Agent": "node-XMLHttpRequest",
    "Accept": "*/*",
  };

  /**
   * HTTP headers the user cannot set.
   * Note that user-agent is allowed even though it is banned in the spec.
   */
  #forbiddenRequestHeaders: string[] = [
    "accept-charset",
    "accept-encoding",
    "access-control-request-headers",
    "access-control-request-method",
    "connection",
    "content-length",
    "content-transfer-encoding",
    "cookie",
    "cookie2",
    "date",
    "expect",
    "host",
    "keep-alive",
    "origin",
    "referer",
    "te",
    "trailer",
    "transfer-encoding",
    "upgrade",
    "via",
  ];

  /** HTTP methods that XMLHttpRequest is not allowed to send. */
  #forbiddenRequestMethods: string[] = [
    "TRACE",
    "TRACK",
    "CONNECT",
  ];

  /** Indicates whether `send` has been called. */
  #sendFlag: boolean = false;

  /** Used internally. Indicates whether an error has occurred. */
  #errorFlag: boolean = false;

  /** Used as a map events to event handlers. */
  #listeners: { [key: string]: (() => void)[] } = {};

  // methods ----------------------------------------

  /**
   * Open the connection.
   * @param {String} method
   * "GET", "POST", etc.
   * @param {String} url
   * The endpoint for the request.
   * @param {Boolean} async
   * Whether or not the request is asynchronous. Currently, all requests are
   * asynchronous no matter the value the user chooses.
   * @param {String} user
   * Username for basic authentication.
   * @param {String} password
   * Password for basic authentication.
   */
  open(
    method: string,
    url: string,
    async: boolean,
    user: string,
    password: string,
  ) {
    // Don't allow synchronous XMLHttpRequest (we never use it in repo)
    async = true;

    this.abort();
    this.#errorFlag = false;

    if (!this.#isAllowedHttpMethod(method)) {
      throw new Error("SecurityError: Request method not allowed");
    }

    if (typeof url !== "string") {
      url = String(url);
    }

    this.#settings = {
      method,
      url,
      async,
      user,
      password,
    };

    this.#setState(this.OPENED);
  }

  /**
   * Sets a header for the request, or appends the value if already set.
   * @param {String} header
   * Header name
   * @param {String} value
   * Header value
   */
  setRequestHeader(header: string, value: string) {
    if (this.readyState !== this.OPENED) {
      throw new Error(
        "INVALID_STATE_ERR: setRequestHeader can only be " +
          "called when state is OPEN",
      );
    }

    if (!this.#isAllowedHttpHeader(header)) {
      return console.warn(`Refused to set unsafe header "${header}"`);
    }

    if (this.#sendFlag) {
      throw new Error("INVALID_STATE_ERR: send flag is true");
    }

    header = this.#headersCase[header.toLowerCase()] || header;
    this.#headersCase[header.toLowerCase()] = header;
    this.#headers[header] = this.#headers[header]
      ? `${this.#headers[header]}, ${value}`
      : value;
  }

  /**
   * Gets header from server response.
   * @param {String} header
   * Name of header to get.
   * @returns {string|null}
   * Header value, or null if it doesn't exist or if the response has not yet
   * been received.
   */
  getResponseHeader(header: string): string | null {
    if (
      typeof header === "string" &&
      this.readyState > this.OPENED &&
      this.#response &&
      this.#response.headers &&
      this.#response.headers[header.toLowerCase()] &&
      !this.#errorFlag
    ) {
      return String(this.#response.headers[header.toLowerCase()]) || null;
    }

    return null;
  }

  /**
   * Get all response headers.
   * @returns {String}
   * All response headers separated by CR + LF ("\r\n").
   */
  getAllResponseHeaders(): string {
    if (this.readyState < this.HEADERS_RECEIVED || this.#errorFlag) {
      return "";
    }

    let result = "";

    Object.keys(this.#response.headers as object).forEach((header) => {
      if (header !== "set-cookie" && header !== "set-cookie2") {
        result += `${header}: ${(this.#response.headers || {})[header]}\r\n`;
      }
    });

    return result.substring(0, result.length - 1);
  }

  /**
   * Sends the request to the server.
   * @param {string | null} data
   * Optional data to send as the request body.
   */
  send(data: string | null) {
    if (this.readyState !== this.OPENED) {
      throw new Error(
        "INVALID_STATE_ERR: connection must be opened " +
          "before send() is called",
      );
    }

    if (this.#sendFlag) {
      throw new Error("INVALID_STATE_ERR: send has already been called");
    }

    let ssl = false;
    let local = false;
    const url = new URL(this.#settings.url || "");
    let host;

    switch (url.protocol) {
      case "https:":
        ssl = true;
        host = url.hostname;
        break;
      case "http:":
        host = url.hostname;
        break;
      case "file:":
        local = true;
        break;
      case undefined:
      case null:
      case "":
        host = "localhost";
        break;
      default:
        throw new Error("Protocol not supported.");
    }

    // Fetch local filestystem (file://)
    if (local) {
      if (this.#settings.method !== "GET") {
        throw new Error("XMLHttpRequest: Only GET method is supported");
      }

      // currently, synchronous behavior is not implemented
      if (this.#settings.async === false) return;

      fs.readFile(url.pathname, "utf-8", (error, data) => {
        if (error !== null && error !== undefined) {
          this.#handleError(error as Error);
        }

        this.status = 200;
        this.responseText = data;
        this.#setState(this.DONE);
      });
    }

    // default to 443 for https, 80 for http
    const port = url.port || (ssl ? 443 : 80);

    // includes query string if present
    const uri = url.pathname + (url.search ? url.search : "");

    // Include default headers if not already provided
    Object.keys(this.#defaultHeaders).forEach((header) => {
      if (!this.#headersCase[header.toLowerCase()]) {
        this.#headers[header] = this.#defaultHeaders[header];
      }
    });

    // Set basic authentication if provided
    if (this.#settings.user) {
      if (typeof this.#settings.password === "undefined") {
        this.#settings.password = "";
      }

      const authBuffer = Buffer.from(
        `${this.#settings.user}:${this.#settings.password}`,
      );

      this.#headers.Authorization = `Basic ${authBuffer.toString("base64")}`;
    }

    if (this.#settings.method === "GET" || this.#settings.method === "HEAD") {
      data = null;
    } else if (data) {
      this.#headers["Content-Length"] = Buffer.isBuffer(data)
        ? data.length
        : Buffer.byteLength(data);
      if (!this.#headers["Content-Type"]) {
        this.#headers["Content-Type"] = "text/plain;charset=UTF-8";
      }
    } else if (this.#settings.method === "POST") {
      // Required by buggy servers that don't satisfy specifications.
      this.#headers["Content-Length"] = 0;
    }

    const options = {
      host,
      port,
      path: uri,
      method: this.#settings.method,
      headers: this.#headers,
      agent: false,
      withCredentials: this.withCredentials,
    };

    this.#errorFlag = false;

    const doRequest = ssl ? https.request : http.request;

    this.#sendFlag = true;

    this.#dispatchEvent("readystatechange");

    // deno-lint-ignore no-this-alias
    const self = this;
    this.#request = doRequest(
      options as object,
      function responseHandler(response) {
        self.#response = response;

        // check for redirect
        // @TODO Prevent looped redirects
        if ([301, 302, 303, 307].includes(response.statusCode as number)) {
          self.#settings.url = response.headers.location;
          const url = new Url(self.#settings.url || "");

          // outside scope uses this variable, so update it
          host = url.hostname;

          const newOptions = {
            hostname: url.hostname,
            port: url.port,
            path: url.pathname,
            method: response.statusCode === 303 ? "GET" : self.#settings.method,
            headers: self.#headers,
            withCredentials: self.withCredentials,
          };

          self.#request = doRequest(newOptions as object, responseHandler)
            .on("error", self.#handleError);
          self.#request.end();

          // @TODO Check if an XHR event needs to be fired here
          return;
        }

        response.setEncoding("utf8");

        self.#setState(self.HEADERS_RECEIVED);
        self.status = response.statusCode || null;

        response.on("data", (chunk) => {
          if (chunk) {
            self.responseText += chunk;
          }
          if (self.#sendFlag) {
            self.#setState(self.LOADING);
          }
        });

        response.on("end", () => {
          if (self.#sendFlag) {
            self.#setState(self.DONE);
            self.#sendFlag = false;
          }
        });

        response.on("error", self.#handleError);
      },
    ).on("error", this.#handleError);

    if (typeof data === "string") {
      this.#request.write(data);
    }

    this.#request.end();

    this.#dispatchEvent("loadstart");
  }

  /**
   * Aborts the request.
   * This sets the readyState to UNSENT and status code to 0.
   */
  abort() {
    if (this.#request) {
      this.#request.abort();
      this.#request = null;
    }

    this.#headers = this.#defaultHeaders;
    this.status = 0;
    this.responseText = "";
    this.responseXML = null;

    this.#errorFlag = true;

    if (
      this.readyState !== this.UNSENT &&
      (this.readyState !== this.OPENED || this.#sendFlag) &&
      this.readyState !== this.DONE
    ) {
      this.#sendFlag = false;
      this.#setState(this.DONE);
    }
    this.readyState = this.UNSENT;
    this.#dispatchEvent("abort");
  }

  /** Returns true if the specified header is allowed, false otherwise. */
  #isAllowedHttpHeader(header: string): boolean {
    return this.#disableHeaderCheck ||
      (typeof header === "string" &&
        this.#forbiddenRequestHeaders.every((forbidden) =>
          forbidden.toLowerCase() !== header.toLowerCase()
        ));
  }

  /** Returns true if the provided method is allowed, false otherwise. */
  #isAllowedHttpMethod(method: string): boolean {
    return typeof method === "string" &&
      this.#forbiddenRequestMethods.every((forbidden) =>
        forbidden.toLowerCase() !== method.toLowerCase()
      );
  }

  /** Changes `readyState` and calls `onreadystatechange`. */
  #setState(state: number) {
    if (this.readyState === state && state !== this.LOADING) return;

    this.readyState = state;

    if (
      this.#settings.async ||
      this.readyState < this.OPENED ||
      this.readyState === this.DONE
    ) {
      this.#dispatchEvent("readystatechange");
    }

    if (this.readyState === this.DONE && !this.#errorFlag) {
      this.#dispatchEvent("load");
      // @TODO figure out InspectorInstrumentation::didLoadXHR(cookie)
      this.#dispatchEvent("loadend");
    }
  }

  /**
   * Dispatch an event.
   * This includes the "on" method and any events attached with
   * `addEventListener`.
   */
  #dispatchEvent(event: string) {
    if (typeof (this as { [key: string]: any })[`on${event}`] === "function") {
      (this as { [key: string]: any })[`on${event}`]();
    }

    if (event in this.#listeners && Array.isArray(this.#listeners[event])) {
      this.#listeners[event].forEach((listener) => listener.call(this));
    }
  }

  /** Deals with any internal error. */
  #handleError(error: Error) {
    this.status = 0;
    this.statusText = error.message;
    this.responseText = error.stack || "";
    this.#errorFlag = true;
    this.#setState(this.DONE);
    this.#dispatchEvent("error");
  }
}

export default MockXMLHttpRequest;
