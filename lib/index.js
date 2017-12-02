//
// ascyn-reader
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

// The Reader class
//
// A reader represents a asynchronous computation with access to some
// context.
//
class Reader {
  // run :: Context -> Promise<result>
  constructor(run) {
    if (typeof run !== "function") {
      throw new TypeError("Reader executor is not a function: " + run);
    }
    this.run = config => {
      try {
        return Promise.resolve(run(config));
      } catch (err) {
        return Promise.reject(err);
      }
    };
  }

  then(fn) {
    if (typeof fn !== "function") {
      throw new TypeError(
        "Reader.prototype.then argument must be a function: " + fn
      );
    }
    return new Reader(context => {
      return this.run(context).then(result => {
        const next = Reader.of(fn(result));
        return next.run(context);
      });
    });
  }

  prop(name) {
    return this.then(result => result[name]);
  }

  static of(x) {
    return x instanceof Reader ? x : new Reader(_ => x);
  }

  static props(object) {
    return new Reader(context => {
      return new Promise((resolve, reject) => {
        const result = {};
        const keys = Object.keys(object);
        let pending = keys.length;
        let isFulfilled = false;

        if (keys.length === 0) {
          resolve({});
        } else {
          // This code uses `isFulfilled` to prevent multiple calls to
          // `resolve` and `reject`
          //
          // It seems that, at least in bluebird and in v8 native
          // promises, it is allowed to call multiple times those
          // functions, however I have not been able to find a
          // reference in the specification
          //
          // If somebody can confirm, remove isFulfilled and simplify
          // the code below..
          keys.forEach(key => {
            const valueForKey = object[key];
            const reader = Reader.of(valueForKey);
            reader
              .run(context)
              .then(value => {
                result[key] = value;
                pending--;
                if (!isFulfilled && pending === 0) {
                  isFulfilled = true;
                  resolve(result);
                }
              })
              .catch(err => {
                // Avoid rejecting the promise multiple times
                if (!isFulfilled) {
                  isFulfilled = true;
                  reject(err);
                }
              });
          });
        }
      });
    });
  }
}

function coroutine(fn) {
  return function() {
    const generator = fn.apply(null, arguments);

    return new Reader(context => {
      function resume({ value, done }) {
        const reader = Reader.of(value);
        if (done) {
          return reader.run(context);
        } else {
          return reader
            .run(context)
            .then(result => resume(generator.next(result)))
            .catch(err => resume(generator.throw(err)));
        }
      }

      return resume(generator.next());
    });
  };
}

Reader.ask = new Reader(c => c);
Reader.coroutine = coroutine;

module.exports = Reader;
