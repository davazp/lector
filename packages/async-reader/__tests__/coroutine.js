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

test("returned readers in the generator function will be resolved automatically", () => {
  const r = Reader.do(function*() {
    return Reader.of("lisp");
  });
  const result = r.run();
  return expect(result).toBe("lisp");
});

test("yield returns the resolved value of the context", () => {
  const r = Reader.do(function*() {
    const ctx = yield ask;
    return ctx * ctx;
  });
  const result = r.run(10);
  return expect(result).toBe(100);
});

test("can yield a reader created with Reader.of", () => {
  const r = Reader.do(function*() {
    const value = yield Reader.of(3);
    return value;
  });
  const result = r.run();
  return expect(result).toBe(3);
});

test("yield can integrate with promises", async () => {
  function getValue() {
    return Promise.resolve(10);
  }

  const r = Reader.do(function*() {
    const ctx = yield ask;
    return getValue().chain(value => ctx * value);
  });

  const result = await r.run(10);
  return expect(result).toBe(100);
});

test("errors in the generator function will throw an exception", () => {
  const err = new Error("foo");

  const r = Reader.do(function*() {
    throw err;
  });

  return expect(r.run).toThrow(err);
});

test("errors in the yielded readers will throw an exception", () => {
  const err = new Error("foo");

  function f() {
    return new Reader(_ => {
      throw err;
    });
  }

  const r = Reader.do(function*() {
    yield f();
  });

  return expect(r.run).toThrow(err);
});

test("Reader.do should throw an error if the argument is not a function", () => {
  function f() {
    return Reader.do(3);
  }
  expect(f).toThrow(TypeError);
});

test("coroutine converts a generator function into a function creating a reader", () => {
  const f = coroutine(function*(name) {
    const context = yield ask;
    return context[name];
  });

  expect(f).toBeInstanceOf(Function);

  const result = f("x").run({ x: 10 });

  expect(result).toBe(10);
});

test("coroutine should throw an error if the argument is not a function", () => {
  function f() {
    return coroutine(3);
  }
  expect(f).toThrow(TypeError);
});
