const Reader = require("../");
const { ask } = Reader;

test("identity reader returns the context", async () => {
  const result = await ask.run({ x: 10 });
  expect(result).toEqual({ x: 10 });
});

test("readers compose properly", async () => {
  const x = ask.then(c => c.x);
  const y = x.then(x => x.y);
  const result = await y.run({ x: { y: 2 } });
  expect(result).toBe(2);
});

test("readers .then method can return other readers", async () => {
  const r = ask.then(c => Reader.of(c * c));
  const result = await r.run(10);
  expect(result).toBe(100);
});

test("readers .prop method can access a property from the previous result", async () => {
  const r = ask.prop("x").prop("y");
  const result = await r.run({ x: { y: 42 } });
  expect(result).toBe(42);
});
