import { connectAdvanced } from "react-redux";
import Reader from "async-reader";

function mapValues(object, fn) {
  const result = {};
  const keys = Object.keys(object);
  for (let i = 0; i < keys.length; i++) {
    const key = keys[i];
    const value = object[key];
    result[key] = fn(value);
  }
  return result;
}

const readerSelectorsFactory = object => dispatch => state => {
  return mapValues(object, value => {
    const context = { state, dispatch };
    if (value instanceof Function) {
      const fn = value;
      return function() {
        const reader = Reader.of(fn.apply(null, arguments));
        return reader.run(context);
      };
    } else {
      return value;
    }
  });
};

function connectReaders(object) {
  return connectAdvanced(readerSelectorsFactory(object));
}

export { connectReaders };
