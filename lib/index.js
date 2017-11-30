class Reader {
  // run :: Context -> Promise<result>
  constructor(run) {
    this.run = config => {
      return Promise.resolve(run(config));
    };
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
  return function() {
    const generator = fn.apply(null, arguments);

    return new Reader(context => {
      function resume({ value, done }) {
        const reader = Reader.of(value);
        if (done) {
          return reader.run(context);
        } else {
          return reader
            .run(context)
            .then(result => resume(generator.next(result)))
            .catch(err => resume(generator.throw(err)));
        }
      }

      try {
        return resume(generator.next());
      } catch (err) {
        return Promise.reject(err);
      }
    });
  };
}

Reader.ask = new Reader(c => Promise.resolve(c));
Reader.coroutine = coroutine;

module.exports = Reader;
