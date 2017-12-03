const Reader = require(".");
const { ask } = Reader;
const { connectAdvanced } = require("react-redux");

// Reader creators

const getState = ask.prop("state");
const getDispatch = ask.prop("dispatch");

function dispatch(action) {
  return getDispatch.then(dispatch => dispatch(action));
}

// Connect reader creators with React components

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
      const context = { getState: () => state, dispatch };
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

module.exports = {
  withReaders,
  getState,
  dispatch
};
