<!-- deno-fmt-ignore-file -->

### parseq-redux

A reimplementation of Douglas Crockford's [parseq](https://github.com/douglascrockford/parseq) as described in the 2018 book "How JavaScript Works".

This codebase is in an alpha state.

### Creating Requestors: The Golden Rules
 
  > Requestors must only call their receiver once.
  
  > Requestors must catch all errors and propogate them as failures.

  > Requestors must never explicitly throw errors and instead must propogate failures.

  > Never write a naked pass or fail.
  
  > Any code which passes a callback which performs a pass or fail to an event listener or an asynchronous API may only be followed by any combination of the following kinds of code: 1) provision of another callback which performs a pass/fail to an event listener, 2) a line of code which initiates the asynchronous request, 3) or a statement that defines and/or returns a cancellor.

  > All callbacks must be wrapped in try-catches to ensure aysnchronous callbacks propogate exceptions as failures.

  > Front-facing code must always run requestors in "runOnFutureTick" mode while libraries *can* run requestors in synchronous mode.
