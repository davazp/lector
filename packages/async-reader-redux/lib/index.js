import { ask } from "async-reader";

const getState = ask.then(store => store.getState());
const getDispatch = ask.prop("dispatch");

function dispatch(action) {
  return getDispatch.then(dispatch => dispatch(action));
}

export { getState, dispatch };
