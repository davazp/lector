const assert = require("assert");
const Reader = require("../");
const { ask } = Reader;

describe("Reader", function() {
  it("identity reader returns the context", async function() {
    const result = await ask.run({ x: 10 });
    assert.deepEqual(result, { x: 10 });
  });

  it("readers compose properly", async function() {
    const x = ask.then(c => c.x);
    const y = x.then(x => x.y);
    const result = await y.run({ x: { y: 2 } });
    assert.equal(result, 2);
  });

  it("readers .then method can return other readers", async function() {
    const r = ask.then(c => Reader.of(c * c));
    const result = await r.run(10);
    assert.equal(result, 100);
  });
});
