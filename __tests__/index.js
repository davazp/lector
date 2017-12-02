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

describe("Reader.props", () => {
  test("return a reader", () => {
    const r = Reader.props();
    expect(r).toBeInstanceOf(Reader);
  });

  test("resolves into a fresh object", () => {
    const obj = {};
    const r = Reader.props(obj);
    return expect(r.run()).resolves.not.toBe(obj);
  });

  test("non-reader property values are copied to the resulting object", () => {
    const x = { x: 1 };
    const obj = { value: x };
    const r = Reader.props(obj);
    return r.run().then(result => {
      expect(result.value).toBe(x);
    });
  });

  test("reader property values should be resolved", () => {
    const obj = { value: Reader.of(42) };
    const r = Reader.props(obj);
    return expect(r.run()).resolves.toEqual({ value: 42 });
  });

  test("reader property values should be resolved even if they are asynchronous", () => {
    const obj = { value: Promise.resolve(42) };
    const r = Reader.props(obj);
    return expect(r.run()).resolves.toEqual({ value: 42 });
  });

  test("All readers should be executed concurrently", () => {
    let n = 0;

    const r = new Reader(() => {
      setTimeout(() => {
        n = 0;
      });
      return n++;
    });

    const reader = Reader.props({
      r1: r,
      r2: r
    });

    return expect(reader.run()).resolves.toEqual({
      r1: 0,
      r2: 1
    });
  });

  test("The reader will be rejected if one of the property value readers fails", () => {
    const err = new Error("foo");
    const r = Reader.props({
      x: 10,
      y: Promise.reject(err)
    });
    return expect(r.run()).rejects.toBe(err);
  });

  test("The reader will be rejected with the first reader that fails", () => {
    const err1 = new Error("reader1");
    const err2 = new Error("reader1");

    const p1 = Promise.reject(err1);
    const p2 = Promise.delay(10).throw(err2);

    const r = Reader.props({
      x: p1,
      y: p2
    });

    const p1ready = p1.catch(() => null);
    const p2ready = p2.catch(() => null);

    // Wait until both promises are actually resolved
    return Promise.all([p1ready, p2ready]).then(() => {
      return expect(r.run()).rejects.toBe(err1);
    });
  });
});
