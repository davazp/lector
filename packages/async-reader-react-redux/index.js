import { connectAdvanced } from "react-redux";

import Reader from "async-reader";

function mapValues(object, fn) {
  const result = {};
  const keys = object.keys(object);
  for (let i = 0; i < keys.length; i++) {
    const key = keys[i];
    const value = object[key];
    result[key] = fn(value);
  }
  return result;
}

function createReaderSelectors(object, dispatch) {
  return mapValues(object, fn => {
    return state => {
      const context = { state, dispatch };
      return function() {
        const result = fn.apply(object, arguments);
        if (result instanceof Reader) {
          return result.run(context);
        } else {
          return result;
        }
      };
    };
  });
}

function withReaders(object) {
  return connectAdvanced(dispatch => {
    return createReaderSelectors(object, dispatch);
  });
}

export { withReaders };
