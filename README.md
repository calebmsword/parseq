<!-- deno-fmt-ignore-file -->

# parseq-redux

A reimplementation of Douglas Crockford's [parseq](https://github.com/douglascrockford/parseq) as described in the 2018 book "How JavaScript Works".

This codebase is in an alpha state.

# Introduction

In parseq, individual tasks are represented as **requestors**.

```javascript
// the parseq library is mostly comprised of requestor factories
import { get } from './parsec.js';

// create a requestor which makes an HTTP get request
const getUser = get('https://my-endpoint/api/users/0');

// nothing happens until we run the requestor
getUser.run({
  success(user) {
    console.log(user);
  },
  error(reason) {
    console.log("Failure!\n", reason);
  }
});
```

Complex tasks are represented with requestor composition: 

```javascript
import {
  httpGet,
  mapToHttpGet,
  sequence,
  wait
} from './parsec.js';

const displayAvatar = sequence([
  httpGet('https://my-endpoint/api/users/0'),
  mapToHttpGet((user) => ({ url: `https://api.github.com/users/${user.name}` })),
  map((githubUser) => {
    let img = document.createElement('img');
    img.src = githubUser.avatar_url;
    document.body.append(img);

    return [img, githubUser];
  }),
  wait(3000),
  map(([img, githubUser]) => {
    img.remove();
    return githubUser;
  })
]);

displayAvatar.run({
  success(githubUser) {
    console.log(`Avatar displayed for user ${githubUser.username}`);
  }
});
```

# Creating Requestors: The Golden Rules

 > Never write a naked `pass` or `fail`.

Any subsequent calls to `pass` or `fail` after either `pass` or `fail` has been called are *ignored*. This can lead to *unreported exceptions* if you perform cleanup after calling `pass` or `fail` and throw an unexpected exception during the process, since requestors propogate all uncaught exceptions to the `fail` callback.

A `pass` or `fail` invocation without a `return` statement is referred to as a **naked pass** or **naked fail**. To avoid this situation, ensure that your requestor immediately completes after a call to `pass` or `fail` by following it immediately with a `return` statement.  The Emperor was a fool when he wore no clothes--let us learn from his mistake.

We make exceptions for this rule when `pass` or `fail` is used as an arbiter, since the callback immediately ceases execution upon the `pass` or `fail` invocation.

 > Arbiters must never throw exceptions. Any exception thrown during execution of an arbiter must be propogated by the associated requestor as a failure.

 We use the term **arbiter** to refer to any callback function declared within a requestor. Arbiters are a source of exception unsafety--if an exception is thrown in the arbiter and the callback is executed after an asynchronous operation, the exception cannot be caught. This can be disastrous if this prevents future requestors (which run after the current requestor settles) from freeing resources. Requestors must always catch their exceptions, which means that arbiters must report their own exceptions as failures to their containing requestor.

 Use the `arbiter` helper function to wrap callbacks in an exception-safe manner.

 > Any code which gives an arbiter to an event listener or an asynchronous API may only be followed by any combination of the following kinds of code: 1) provision of another arbiter to an event listener, 2) a line of code which initiates the asynchronous request if it has not already been initiated, or 3) a statement that defines and/or returns a cancellor for that asynchronous request.

It is good practice to have the final code written in a requestor which performs an asynchronous task be the provision of arbiters to the asychronous API. If an uncaught exception is thrown after an arbiter is provided to an asychronous API, the requestor will fail, and yet we will still have an arbiter that is pointlessly executed in the future, a waste of CPU resources.

We can reduce the possibility of such a thing happening if we delay the provision of arbiters as late as possible in our requestor implementations.

 > Front-facing code must always run requestors in "settleOnFutureTick" mode while libraries *can* run requestors in synchronous mode.

By default, the success and error callbacks provided to a requestor run are executed on a future tick of the event loop. This can be avoided by setting the `settleOnFutureTick` property to `false` in the spec object given to a requestor's run method.

There are many reasons why this default behavior is usually preferred:
 
 - It is possible for requestors to their receiver synchronously. A dubiously-designed requestor could even be conditionally asynchronous! It is good to be certain whether a callback is executed asynchronously or not--with this default behavior, we know that the requestor we run will always execute our callbacks asynchronously.
 - It possible for a requestor to swallow exceptions thrown by the success or error callbacks, meaning that uncaught exceptions from the success or error callback can go unreported if we do not run a requestor in `settleOnFutureTick` mode. When this happens, it can be extremely difficult to debug.

However, this can accrue signficant performance costs if we make a requestor factory which composes a large number of requestors. As such, we encourage those creating custom requestor factories for libraries to consider setting `settleOnFutureTick` to `false`.
