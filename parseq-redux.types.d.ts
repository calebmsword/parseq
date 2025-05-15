/**
 * A requestor factory. Creates requestors that make one HTTP request.
 * This is a wrapper around XMLHttpRequest.
 *
 * @example
 * ```
 * const doPostRequest = httpRequestor({
 *   url: "endpoint/of/request",
 *   method: "POST",  // or "GET", "PUT", etc...
 *   headers: {
 *       Authorization: `Bearer ${ACCESS_TOKEN}`
 *   },
 *   body: { id: "1" , user: "username" }
 * });
 *
 * doPostRequest(({ value, reason }) => {
 *   if (value === undefined) {
 *     console.log("failure because", reason);
 *     return;
 *   }
 *
 *   console.log(
 *     value.statusCode,
 *     value.statusMessage,
 *     value.headers,
 *     // if response is JSON,
 *     // `value.data` will be an object.
 *     // Otherwise `value.data` must be
 *     // parsed manually.
 *     value.data);
 * });
 * ```
 *
 * For convenience, the request body is automatically parsed into a string if an
 * object is provided. This string will typically be a JSON string, but if you
 * specify a `contentType` of "x-www-form-urlencoded" or provide a header which
 * specifies the MIME content type, the request body will be automatically
 * stringified into a URL query parameter string. You can disable this automatic
 * parsing if you would like by setting `spec.autoParseRequest` to `false`. If
 * you do this, you will need to provide a string to the request body instead of
 * an object.
 *
 * If the response data is sent as JSON, it is automatically parsed into an
 * object. This behavior can be disabled by setting `spec.autoParseResponse` to
 * `false`.
 *
 * The cancellor for the requestor, by default, uses the `abort` method from
 * the XMLHttpRequest API. This means that the default cancellor will let the
 * server process your request, and whatever response is sent will simply be
 * ignored. If you would like more control over how the cancellor behaves, then
 * use `spec.customCancel`. See the following example.
 *
 * @example
 * ```
 * const getExpensiveRequest = httpRequestor({
 *     url: "endpoint/of/request",
 *
 *     // customCancel must be a function factory
 *     customCancel: (abortRequest, succeed, fail) => (reason) => {
 *
 *         // Suppose our server was designed such
 *         // that this particular expensive request
 *         // can be cancelled if another specific
 *         // request is made before the server
 *         // responds to the expensive request
 *         createAjaxRequestor({
 *             url: "endpoint/to/request/cancel"
 *         }).run();
 *
 *         // abortRequest simply calls
 *         // XMLHttpRequest.abort.
 *         // If server sends response before the
 *         // cancel request is received, calling
 *         // this function will still lead us to
 *         // ignore the response.
 *         // The receiver will NOT be called if you
 *         // execute abortRequest!!!
 *         abortRequest();
 *
 *         // You don't have to call abortRequest(),
 *         // for example, if you expect to receive
 *         // some sort of response from the server
 *         // if the cancel is sent in time.
 *
 *         // You have access to the receiver for
 *         // the requestor. Use this is you would
 *         // like to call the receiver even if
 *         // abortRequest is called.
 *         // If the receiver is already called by the
 *         // time cancel is run, then this function
 *         // will no-op
 *         fail(reason);
 *     }
 * });
 * ```
 *
 * @param {object} spec
 * Configures the returned requestor.
 * @param {string} [spec.url]
 * The endpoint of the request. This can include
 * passwords, hashes, ports, and query parameters.
 * @param {{ [key: string]: string }} [spec.params]
 * Represents query parameter keys and their values.
 * @param {string} [spec.method]
 * "GET", "POST", "PUT", "DELETE", etc. If none is
 * provided, then defaults to "GET".
 * @param {object} [spec.headers]
 * The provided object should map header keys to
 * their values.
 * @param {object|string} [spec.body]
 * If an object, then it is parsed into a
 * string based on the provided content type (either from the header or the
 * `spec.contentType`). If it is a string, then it is already parsed.
 * @param {string} [spec.contentType]
 * Determines how `value.body` is parsed into a
 * string. If  `"x-www-form-urlencoded"` or
 * `"application/x-www-form-urlencoded"`, `value.body` is transformed into the
 * format used by URL query parameters. If `"json"`, `"application/json"`, or
 * `"default"`, `value.body` is transformed into a string by JSON.stringify. If
 * no `contentType` is provided, then `"application/json"` is used by default.
 * Specifying the content-type in the header overrides this property completely.
 * @param {Function} [spec.customCancel]
 * A function factory. It takes a method
 * which destroys the request object represented by the requestor and returns a
 * new function. Use this if you would like to make a request to the server to
 * tell it to stop processing a request, since by default, the cancel function
 * simply ignores whatever response is sent by the server.
 * @param {boolean} [spec.autoParseRequest]
 * If false, requests will not be
 * automatically parsed. You must provide strings instead of objects as the
 * request body.
 * @param {boolean} [spec.autoParseResponse]
 * If false, responses will be sent to
 * the receiver as strings instead of objects. The receiver must manually parse
 * the response.
 * @param {Function} [spec.log]
 * Any errors will be sent to this function if it is
 * provided. This should be used for logging purposes. Currently, only errors
 * which occur during autoparsing with JSON.parse causes this function to be
 * called.
 * @returns {Requestor}
 * An HTTP/HTTPS requestor. The returned requestor can take an
 * optional `message` hash which can further configure the http request. See the
 * documentation for the `HttpMessage` type.
 *
 * The value sent to the receiver is a hash with four properties: `statusCode`,
 * `statusMessage`, `headers`, and `data`.
 */
