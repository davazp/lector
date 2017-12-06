import Promise from "bluebird";
import Reader, { ask } from "../lib";

test("identity reader returns the context", () => {
  const result = ask.run({ x: 10 });
  expect(result).toEqual({ x: 10 });
});

test("readers compose properly", () => {
  const x = ask.then(c => c.x);
  const y = x.then(x => x.y);
  const result = y.run({ x: { y: 2 } });
  expect(result).toBe(2);
});

test("readers .then method can return other readers", () => {
  const r = ask.then(c => Reader.of(c * c));
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

test("errors in the handlers will throw an exception", () => {
  const err = new Error("foo");
  const r = ask.then(() => {
    throw err;
  });
  expect(r.run).toThrow(err);
});

test("resolve nested readers properly", () => {
  function f1() {
    return ask.then(_ => 10);
  }

  function f2() {
    return ask.then(() => f1());
  }

  function f3() {
    return ask.then(() => f2());
  }

  return expect(f3().run()).toBe(10);
});

test("new Reader throws an exception if its argument is not a function", () => {
  function f() {
    return new Reader(3);
  }
  expect(f).toThrow(TypeError);
});

test(".then throws an exception if its argument is not a function", () => {
  function f() {
    return ask.then(3);
  }
  expect(f).toThrow(TypeError);
});
