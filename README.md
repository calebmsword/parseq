<!-- deno-fmt-ignore-file -->

# parseq-redux

A reimplementation of Douglas Crockford's [parseq](https://github.com/douglascrockford/parseq) as described in the 2018 book "How JavaScript Works".

This codebase is in an alpha state.

# Introduction

In parseq, individual tasks are represented as **requestors**.

```javascript
// the parseq library is mostly comprised of requestor factories
import { get$ } from './parsec.js';

// create a requestor which makes an HTTP get request
const getUser = get$('https://my-endpoint/api/users/0');

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

 > Never write a naked pass or fail.

 > Arbiters must never throw exceptions. Any exception thrown during execution of an arbiter must be propogated by the associated requestor as a failure.

 > Any code which gives an arbiter to an event listener or an asynchronous API may only be followed by any combination of the following kinds of code: 1) provision of another arbiter to an event listener, 2) a line of code which initiates the asynchronous request if it has not already been initiated, or 3) a statement that defines and/or returns a cancellor for that asynchronous request.

 > Front-facing code must always run requestors in "settleOnFutureTick" mode while libraries *can* run requestors in synchronous mode.
