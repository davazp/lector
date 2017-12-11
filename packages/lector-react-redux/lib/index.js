import { connectAdvanced } from "react-redux";
import Reader from "lector";

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

const bindReaderFunction = (context, fn) => {
  return function() {
    const reader = Reader.of(fn.apply(null, arguments));
    return reader.run(context);
  };
};

const readerSelectorsFactory = object => dispatch => state => {
  return mapValues(object, value => {
    const context = { state, dispatch };
    if (value instanceof Function) {
      return bindReaderFunction(context, value);
    } else {
      return value;
    }
  });
};

function connectReaders(object) {
  return connectAdvanced(readerSelectorsFactory(object));
}

export { connectReaders };
