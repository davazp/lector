import { createStore } from "redux";
import { getState } from "../lib/";

const initialState = { a: 10, b: 20 };

function reducer(state, action) {
  switch (action.type) {
    case "INCa":
      return Object.assign({}, state, { a: state.a + 1 });
    case "DECa":
      return Object.assign({}, state, { a: state.a - 1 });
    default:
      return state;
  }
}

test("getState reader resolves to the state", () => {
  const store = createStore(reducer, initialState);
  const context = { state: store.getState(), dispatch: store.dispatch };
  return expect(getState.run(context)).toBe(initialState);
});

// test("dispatch returns a reader that will dispatch the action", async () => {
//   const store = createStore(reducer, initialState);
//   await dispatch({ type: "INCa" })
//     .then(() => getState)
//     .then(state => {
//       expect(state).toEqual({ a: 11, b: 20 });
//     })
//     .run(store);
// });
