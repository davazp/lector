async-reader with React & Redux
===============================

**This document is work-in-progress**

Many web applications are built using [React](https://reactjs.org/)
and [Redux](https://github.com/reactjs/react-redux). This approach
encourages a functional style for the applications. Some parts of the
application will be completely pure and will not depend on the state,
but many others will.

This introduces the contextual problem: you will have to pass
explicitly the state of parts of the state to the functions you need,
and every function that directly or indirectly calls it.

The integration of Redux for react
([react-redux](https://github.com/reactjs/react-redux/blob/master/docs/api.md#provider-store))
solves this problem for *React Components*, by making the redux store
available as part of the
React [context](https://reactjs.org/docs/context.html), making it
available this way to every subcomponent immediately.

However, not all the code in your application is part of a React
component. For example, you could want to access the state or mutate
the store in your API layer, but `react-redux` can't help us in this
case.

`async-reader` provides the same implicit context functionality for
non-react code.


The `async-reader` library:

```javascript
// async-reader/react

import {ask} from 'async-reader'

// The main context is the store
export const store = ask

// The dispatch function defers the action until
// the reader is executed with a specific store.
export const dispatch = (action) => {
  return ask.then(store => {
    store.dispatch(action)
  })
}

// The state reader
export const state = store.then(store => store.getState())
```


Your API layer:
```javascript
import {state,  dispatch} from 'async-reader/redux'

const debugMode = state.prop('debugMode')

const request = coroutine(function*(uri, options){
  const debug = yield debugMode

  const extraHeaders = debug? {"X-DEBUG": "true"}: {}

  const effectiveOptions = {
    ...options,
    headers: {
      ...options.headers,
      ...extraHeaders
    } 
  }

  return fetch(uri, options)
})

export const fetchProduct = coroutine(function*(id){
  const product = yield request(`/api/product/{id}`)
  yield dispatch({type: UPDATE_PRODUCT, payload: product})
  return product
})
```


At the very end, you will have to pass your store to your API
layer. In React, as we mentioned, your components have access to the
store thanks to `react-redux`. We can take benefit of this to
integrate your API layer into your components:

```javascript
import {fetchProdut} from './api'
import { withReaders } from 'async-readers/react-redux'

const RefreshProduct = ({id, fetchProduct}) => {
  return <button onClick={fetchProduct(id)}></button>
}

export default withReaders({fetchProduct})(RefreshProduct)
```

Remember, this library eases sharing some context implicitly across
many functions in your application, but *you should not abuse this too
much*. It is usually a best design not to have too much state /
context in the first place.

For further information about the concepts behind `async-reader`,
please read the [tutorial](./TUTORIAL.md).
