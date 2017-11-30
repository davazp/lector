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

describe("coroutine", () => {
  test("it builds a proper reader", () => {
    const r = coroutine(function*() {
      return 10;
    });
    expect(r).toBeInstanceOf(Reader);
  });

  test("yield returns the resolved value of the context", () => {
    const r = coroutine(function*() {
      const ctx = yield ask;
      return ctx * ctx;
    });

    return r.run(10).then(result => {
      return expect(result).toBe(100);
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

    return r.run(10).then(result => {
      return expect(result).toBe(100);
    });
  });

  test("errors in the generator function will reject the promise", () => {
    const err = new Error("foo");

    const r = coroutine(function*() {
      throw err;
    });

    return expect(r.run()).rejects.toBe(err);
  });

  test("reject promises will reject the resulting reader promise", () => {
    const err = new Error("foo");

    function f() {
      throw err;
    }

    const r = coroutine(function*() {
      yield f();
    });

    return expect(r.run()).rejects.toBe(err);
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

    return expect(r.run()).rejects.toBe(err);
  });

  test("rejected promise in the yielded readers will reject the promise", () => {
    const err = new Error("foo");

    function f() {
      return new Reader(_ => Promise.reject(err));
    }

    const r = coroutine(function*() {
      yield f();
    });

    return expect(r.run()).rejects.toBe(err);
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

    return r.run().then(result => {
      expect(result).toBe(10);
    });
  });
});
