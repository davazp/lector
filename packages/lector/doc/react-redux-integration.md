Using lector with React & Redux
=====================================

**This document is work-in-progress**

Many web applications are built using [React](https://reactjs.org/)
and [Redux](https://github.com/reactjs/react-redux), an approach that
encourages a functional style. Some parts of the application will be
completely pure and will not depend on the state, but many others
will.

This introduces the contextual problem: you will have to pass
explicitly the state (or parts of the state) to the functions you
need, and every function that directly or indirectly calls it.

The integration of Redux for react
([react-redux](https://github.com/reactjs/react-redux/blob/master/docs/api.md#provider-store))
solves this problem for *React Components*, by making the redux store
available as part of the
React [context](https://reactjs.org/docs/context.html), so every
subcomponent can access it without having to add a property for it.

However, not all the code in your application is part of a React
component. You could want to access the state or dispatch an action in
your API layer, but `react-redux` can't help us in this
case. `lector` provides the same implicit context functionality
for non-react code.


The `lector` library

```javascript
// lector/react

import { ask } from "lector";

// The main context is the store
export const store = ask;

// The dispatch function defers the action until
// the reader is executed with a specific store.
export const dispatch = action => {
  return ask.chain(store => {
    store.dispatch(action);
  });
};

// The state reader
export const state = store.chain(store => store.getState());
```


Your API layer
```javascript
import { state, dispatch } from "lector-redux";

const debugMode = state.prop("debugMode");

const request = coroutine(function*(uri, options) {
  const debug = yield debugMode;

  const extraHeaders = debug ? { "X-DEBUG": "true" } : {};

  const effectiveOptions = {
    ...options,
    headers: {
      ...options.headers,
      ...extraHeaders
    }
  };

  return fetch(uri, options);
});

export const fetchProduct = coroutine(async function*(id) {
  const product = await request(`/api/product/{id}`);
  yield dispatch({ type: UPDATE_PRODUCT, payload: product });
  return product;
});
```


At the very end, you will have to pass the store somehow to your API
layer, of course. In React, as we mentioned, your components already
have access to the store thanks to `react-redux`. We can take benefit
of this to integrate your API layer into your components

```javascript
import { fetchProdut } from "./api";
import { withReaders } from "lectors/react-redux";

const RefreshProduct = ({ id, fetchProduct }) => {
  return <button onClick={fetchProduct(id)} />;
};

export default withReaders({ fetchProduct })(RefreshProduct);
```

Remember, this library eases sharing some context implicitly across
many functions in your application, but *you should not abuse this too
much*. It is usually a best design not to have too much state /
context in the first place.

For further information about the concepts behind `lector`,
please read the [tutorial](./tutorial.md).
