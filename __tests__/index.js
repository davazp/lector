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
