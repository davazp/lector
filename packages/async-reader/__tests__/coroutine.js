import Promise from "bluebird";
import Reader, { ask, coroutine } from "../lib";

test("it builds a proper reader", () => {
  const r = Reader.do(function*() {
    return 10;
  });
  expect(r).toBeInstanceOf(Reader);
});

test("reader will resolved to the returned value from the generator function function will be resolved automatically", async () => {
  const r = Reader.do(function*() {
    return Promise.resolve(20);
  });
  const result = await r.run();
  return expect(result).toBe(20);
});

test("returned readers in the generator function will be resolved automatically", async () => {
  const r = Reader.do(function*() {
    return Reader.of("lisp");
  });
  const result = await r.run();
  return expect(result).toBe("lisp");
});

test("yield returns the resolved value of the context", async () => {
  const r = Reader.do(function*() {
    const ctx = yield ask;
    return ctx * ctx;
  });
  const result = await r.run(10);
  return expect(result).toBe(100);
});

test("can yield a reader created with Reader.of", async () => {
  const r = Reader.do(function*() {
    const value = yield Reader.of(3);
    return value;
  });
  const result = await r.run();
  return expect(result).toBe(3);
});

test("yield will also wait for promises", async () => {
  function getValue() {
    return Promise.resolve(10);
  }

  const r = Reader.do(function*() {
    const ctx = yield ask;
    const value = yield getValue();
    return ctx * value;
  });

  const result = await r.run(10);
  return expect(result).toBe(100);
});

test("errors in the generator function will reject the promise", () => {
  const err = new Error("foo");

  const r = Reader.do(function*() {
    throw err;
  });

  return expect(r.run()).rejects.toBe(err);
});

test("reject promises will reject the resulting reader promise", async () => {
  const err = new Error("foo");

  function f() {
    throw err;
  }

  const r = Reader.do(function*() {
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

  const r = Reader.do(function*() {
    yield f();
  });

  return expect(r.run()).rejects.toBe(err);
});

test("rejected promise in the yielded readers will reject the promise", () => {
  const err = new Error("foo");

  function f() {
    return new Reader(_ => Promise.reject(err));
  }

  const r = Reader.do(function*() {
    yield f();
  });

  return expect(r.run()).rejects.toBe(err);
});

test("errors in readers can be handled", async () => {
  const err = new Error("foo");

  function f() {
    return new Reader(_ => Promise.reject(err));
  }

  const r = Reader.do(function*() {
    let result;
    try {
      yield f();
      result = 2;
    } catch (err) {
      result = 10;
    }
    return result;
  });

  const result = await r.run();
  return expect(result).toBe(10);
});

test("yield handles errors from nested readers", async () => {
  const err = new Error("foo");

  function f() {
    return new Reader(_ => Promise.reject(err));
  }

  const r = Reader.do(function*() {
    let result;
    try {
      yield f();
      result = 2;
    } catch (err) {
      result = 10;
    }
    return result;
  });

  const result = await r.run();
  return expect(result).toBe(10);
});

test("can catch errors from a returned reader", () => {
  const err = new Error("foo");

  function f() {
    return new Reader(_ => Promise.reject(err));
  }

  const r = Reader.do(function*() {
    try {
      return f();
    } catch (err) {
      return 1234;
    }
  });

  return expect(r.run()).rejects.toBe(err);
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

  const r = Reader.do(function*() {
    try {
      return f3();
    } catch (err) {
      return 1234;
    }
  });

  return expect(r.run()).rejects.toBe(err);
});

test("Reader.do should throw an error if the argument is not a function", () => {
  function f() {
    return Reader.do(3);
  }
  expect(f).toThrow(TypeError);
});

test("coroutine converts a generator function into a function creating a reader", async () => {
  const f = coroutine(function*(name) {
    const context = yield ask;
    return context[name];
  });

  expect(f).toBeInstanceOf(Function);

  const result = await f("x").run({ x: 10 });

  expect(result).toBe(10);
});

test("coroutine should throw an error if the argument is not a function", () => {
  function f() {
    return coroutine(3);
  }
  expect(f).toThrow(TypeError);
});
