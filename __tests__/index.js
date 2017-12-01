const Promise = require("bluebird");
const Reader = require("../");
const { ask } = Reader;

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

test(".run should never throw an exception", () => {
  const err = new Error(`foo`);
  const r = new Reader(_ => {
    throw err;
  });
  expect(r.run()).rejects.toBe(err);
});
