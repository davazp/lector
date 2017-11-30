const Promise = require("bluebird");
const Reader = require("../");
const { ask, coroutine } = Reader;

test("identity reader returns the context", () => {
  return ask.run({ x: 10 }).then(result => {
    expect(result).toEqual({ x: 10 });
  });
});

test("readers compose properly", () => {
  const x = ask.then(c => c.x);
  const y = x.then(x => x.y);
  return y.run({ x: { y: 2 } }).then(result => {
    expect(result).toBe(2);
  });
});

test("readers .then method can return other readers", () => {
  const r = ask.then(c => Reader.of(c * c));
  return r.run(10).then(result => {
    expect(result).toBe(100);
  });
});

test("readers .prop method can access a property from the previous result", () => {
  const r = ask.prop("x").prop("y");
  return r.run({ x: { y: 42 } }).then(result => {
    expect(result).toBe(42);
  });
});

test("integrates with promises", () => {
  function f() {
    return ask.then(x => {
      return Promise.delay(50).return(x * x);
    });
  }

  return f()
    .run(10)
    .then(result => {
      expect(result).toBe(100);
    });
});

test("errors in the handlers will reject the promise", () => {
  const err = new Error("foo");
  const r = ask.then(() => {
    throw err;
  });
  return expect(r.run()).rejects.toBe(err);
});

test("resolve nested readers properly", () => {
  const err = new Error("foo");

  function f1() {
    return ask.then(_ => {
      return Promise.reject(err);
    });
  }

  function f2() {
    return ask.then(() => f1());
  }

  function f3() {
    return ask.then(() => f2());
  }

  return expect(f3().run()).rejects.toBe(err);
});

describe("coroutine", () => {
  test("it builds a proper reader", () => {
    const r = coroutine(function*() {
      return 10;
    });
    expect(r()).toBeInstanceOf(Reader);
  });

  test("reader will resolved to the returned value from the coroutine", () => {
    const r = coroutine(function*() {
      return "foo";
    });
    return r()
      .run()
      .then(result => {
        expect(result).toBe("foo");
      });
  });

  test("returned promises in the coroutine will be resolved automatically", () => {
    const r = coroutine(function*() {
      return Promise.resolve(20);
    });
    return r()
      .run()
      .then(result => {
        expect(result).toBe(20);
      });
  });

  test("returned readers in the coroutine will be resolved automatically", () => {
    const r = coroutine(function*() {
      return Reader.of("lisp");
    });
    return r()
      .run()
      .then(result => {
        expect(result).toBe("lisp");
      });
  });

  test("yield returns the resolved value of the context", () => {
    const r = coroutine(function*() {
      const ctx = yield ask;
      return ctx * ctx;
    });

    return r()
      .run(10)
      .then(result => {
        return expect(result).toBe(100);
      });
  });

  test("can yield a reader created with Reader.of", () => {
    const r = coroutine(function*() {
      const value = yield Reader.of(3);
      return value;
    });
    return r()
      .run()
      .then(result => {
        expect(result).toBe(3);
      });
  });

  test("yield will also wait for promises", () => {
    function getValue() {
      return Promise.resolve(10);
    }

    const r = coroutine(function*() {
      const ctx = yield ask;
      const value = yield getValue();
      return ctx * value;
    });

    return r()
      .run(10)
      .then(result => {
        return expect(result).toBe(100);
      });
  });

  test("errors in the generator function will reject the promise", () => {
    const err = new Error("foo");

    const r = coroutine(function*() {
      throw err;
    });

    return expect(r().run()).rejects.toBe(err);
  });

  test("reject promises will reject the resulting reader promise", () => {
    const err = new Error("foo");

    function f() {
      throw err;
    }

    const r = coroutine(function*() {
      yield f();
    });

    return expect(r().run()).rejects.toBe(err);
  });

  test("errors in the yielded readers will reject the promise", () => {
    const err = new Error("foo");

    function f() {
      return new Reader(_ => {
        throw err;
      });
    }

    const r = coroutine(function*() {
      yield f();
    });

    return expect(r().run()).rejects.toBe(err);
  });

  test("rejected promise in the yielded readers will reject the promise", () => {
    const err = new Error("foo");

    function f() {
      return new Reader(_ => Promise.reject(err));
    }

    const r = coroutine(function*() {
      yield f();
    });

    return expect(r().run()).rejects.toBe(err);
  });

  test("errors in readers can be handled", () => {
    const err = new Error("foo");

    function f() {
      return new Reader(_ => Promise.reject(err));
    }

    const r = coroutine(function*() {
      let result;
      try {
        yield f();
        result = 2;
      } catch (err) {
        result = 10;
      }
      return result;
    });

    return r()
      .run()
      .then(result => {
        expect(result).toBe(10);
      });
  });

  test("yield handles errors from nested readers", () => {
    const err = new Error("foo");

    function f() {
      return new Reader(_ => Promise.reject(err));
    }

    const r = coroutine(function*() {
      let result;
      try {
        yield f();
        result = 2;
      } catch (err) {
        result = 10;
      }
      return result;
    });

    return r()
      .run()
      .then(result => {
        expect(result).toBe(10);
      });
  });

  test("can catch errors from a returned reader", () => {
    const err = new Error("foo");

    function f() {
      return new Reader(_ => Promise.reject(err));
    }

    const r = coroutine(function*() {
      try {
        return f();
      } catch (err) {
        return 1234;
      }
    });

    return expect(r().run()).rejects.toBe(err);
  });

  test("can catch errors from a nested readers", () => {
    const err = new Error("foo");

    function f1() {
      return ask.then(_ => {
        return Promise.reject(err);
      });
    }

    function f2() {
      return ask.then(() => f1());
    }

    function f3() {
      return ask.then(() => f2());
    }

    const r = coroutine(function*() {
      try {
        return f3();
      } catch (err) {
        return 1234;
      }
    });

    return expect(r().run()).rejects.toBe(err);
  });
});
