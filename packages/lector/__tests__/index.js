import Promise from "bluebird";
import Reader, { ask } from "../lib";

test("identity reader returns the context", () => {
  const result = ask.run({ x: 10 });
  expect(result).toEqual({ x: 10 });
});

test("readers compose properly", () => {
  const x = ask.chain(c => c.x);
  const y = x.chain(x => x.y);
  const result = y.run({ x: { y: 2 } });
  expect(result).toBe(2);
});

test("readers .chain method can return other readers", () => {
  const r = ask.chain(c => Reader.of(c * c));
  const result = r.run(10);
  expect(result).toBe(100);
});

test("readers .prop method can access a property from the previous result", () => {
  const r = ask.prop("x").prop("y");
  const result = r.run({ x: { y: 42 } });
  expect(result).toBe(42);
});

test("integrates with promises", () => {
  function f() {
    return ask.chain(x => {
      return Promise.delay(50).return(x * x);
    });
  }

  return f()
    .run(10)
    .then(result => {
      expect(result).toBe(100);
    });
});

test(".then will throw an error if the argument is not a function", () => {
  function f() {
    return ask.then(23);
  }
  expect(f).toThrow(TypeError);
});

test(".then will throw an error when evaluated if the argument is not a promise", () => {
  const r = ask.then(() => 23);
  expect(r.run).toThrow(TypeError);
});

test(".then will return a reader evaluating to chained promise", () => {
  function f() {
    return ask.prop("ready").then(x => x + 1);
  }
  return f()
    .run({
      ready: Promise.resolve(42)
    })
    .then(result => {
      expect(result).toBe(43);
    });
});

test("errors in the handlers will throw an exception", () => {
  const err = new Error("foo");
  const r = ask.chain(() => {
    throw err;
  });
  expect(r.run).toThrow(err);
});

test("resolve nested readers properly", () => {
  function f1() {
    return ask.chain(_ => 10);
  }

  function f2() {
    return ask.chain(() => f1());
  }

  function f3() {
    return ask.chain(() => f2());
  }

  return expect(f3().run()).toBe(10);
});

test("new Reader throws an exception if its argument is not a function", () => {
  function f() {
    return new Reader(3);
  }
  expect(f).toThrow(TypeError);
});

test(".chain throws an exception if its argument is not a function", () => {
  function f() {
    return ask.chain(3);
  }
  expect(f).toThrow(TypeError);
});
