class Reader {
  // run :: Context -> Promise<result>
  constructor(run) {
    this.run = run;
  }

  then(fn) {
    return new Reader(context => {
      return this.run(context).then(result => {
        const next = Reader.of(fn(result));
        return next.run(context);
      });
    });
  }

  prop(name) {
    return this.then(result => result[name]);
  }

  static of(x) {
    return x instanceof Reader ? x : new Reader(_ => Promise.resolve(x));
  }
}

function coroutine(fn) {
  return new Reader(context => {
    return new Promise((resolve, reject) => {
      const generator = fn();

      function resume({ value, done }) {
        if (done) {
          return resolve(value);
        }

        const reader = Reader.of(value);
        reader
          .run(context)
          .then(result => {
            resume(generator.next(result));
          })
          .catch(err => {
            try {
              resume(generator.throw(err));
            } catch (err) {
              reject(err);
            }
          });
      }

      resume(generator.next());
    });
  });
}

Reader.ask = new Reader(c => Promise.resolve(c));
Reader.coroutine = coroutine;

module.exports = Reader;
