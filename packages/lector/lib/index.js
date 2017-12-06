//
// reader
//

// Copyright (C) 2017  David Vázquez Púa

// Permission is hereby granted, free of charge, to any person obtaining a copy
// of this software and associated documentation files (the "Software"), to deal
// in the Software without restriction, including without limitation the rights
// to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
// copies of the Software, and to permit persons to whom the Software is
// furnished to do so, subject to the following conditions:
// The above copyright notice and this permission notice shall be included in
// all copies or substantial portions of the Software.

// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
// IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
// FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
// AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
// LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
// OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
// THE SOFTWARE.

function _do(iterator) {
  return new Reader(context => {
    let { value, done } = iterator.next();
    while (!done) {
      const result = Reader.of(value).run(context);
      ({ value, done } = iterator.next(result));
    }
    return Reader.of(value).run(context);
  });
}

// The Reader class
//
// A reader represents a synchronous computation with access to some context.
//
class Reader {
  // run :: Context -> Promise<result>
  constructor(run) {
    if (typeof run !== "function") {
      throw new TypeError("Reader executor is not a function: " + run);
    }
    this.run = run;
  }

  chain(fn) {
    if (typeof fn !== "function") {
      throw new TypeError(
        "Reader.prototype.chain argument must be a function: " + fn
      );
    }
    return new Reader(context => {
      const next = Reader.of(fn(this.run(context)));
      return next.run(context);
    });
  }

  // Promises
  then(fn) {
    return this.chain(promise => {
      if (!(promise instanceof Promise)) {
        throw new TypeError(
          "Used .then on a reader that did not resolved into a promise" + fn
        );
      }
      return promise.then(value => fn(value));
    });
  }

  // Return a reader that resolves to the property `name` of the
  // resolved value of the current reader.
  prop(name) {
    return this.chain(result => result[name]);
  }

  static of(x) {
    return x instanceof Reader ? x : new Reader(_ => x);
  }

  // Execute the generator function FN.
  //
  // Each yielded value will be converted into a reader and resolved,
  // passing the resulting value back into the generator function.
  //
  // Errors are passed to the generator function as exceptions.
  //
  // Return a new reader that will resolved to a reader as returned by
  // the generator function.
  //
  static do(generatorFn) {
    if (typeof generatorFn !== "function") {
      throw new TypeError(
        "Reader.do argument is not a function: " + generatorFn
      );
    }
    const iterator = generatorFn();
    return _do(iterator);
  }
}

// The identity reader. Resolves to the context
const ask = new Reader(c => c);

function coroutine(fn) {
  if (typeof fn !== "function") {
    throw new TypeError("coroutine argument is not a function:" + fn);
  }
  return function() {
    const iterator = fn.apply(null, arguments);
    return _do(iterator);
  };
}

export default Reader;

export { ask, coroutine };
