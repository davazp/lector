async-reader
===========

[![Build Status](https://travis-ci.org/davazp/async-reader.svg?branch=master)](https://travis-ci.org/davazp/async-reader)

async-reader is a library to deal with asynchronous *readers*:
computations with access to some read-only context.

**This package is experimental and it is under active development. Expect backward-incompatible changes**.

## [Introduction to async-readers](./doc/tutorial.md)
## [Using async-reader with React and Redux](./doc/react-redux-integration.md)

## Installation

You can install this package with

```shell
npm install async-reader
```

## Overview

You define *readers* by chaining them with other readers

```javascript
import { ask, coroutine } from "async-reader";

const getVersion = ask.then(context => context.version);

const f = coroutine(function*() {
  const version = yield getVersion;

  if (version === 1) {
    console.log("hello");
  } else {
    console.log("bye");
  }

  return version;
});
```

The `ask` reader is a built-in reader that just returns the whole
context. You can define a derived reader by calling `.then`, which
will be called with the return value of the previous reader.

If you return a *Promise* or another *Reader*, the resolved value of
those will be passed to the next reader.

Finally, you can provide the context to the function at the top of
your stack:

```javascript
f().run({version: 2})
```
