async-reader Tutorial
=====================

## The problem

If you have adopted a (almost) *purely functional* approach in
Javascript, whether it was a choice or a requirement of the technology
you use, you will find some restrictions on how you can write your
code

Let's say you have a function that return the current user, like the
below

```javascript
const config = {
  language: 'es'
}

// Return current language
function getLanguage () {
  return config.language
}
```

Suppose now that configuration is no longer constant. For example, you
could want to process this in requests in a server, and each user has
a different configuration.

As a pure function, `getLanguage` will have to return the value every
time you call it, as it has no arguments. So we have to add a `config`
argument to it. Not only that, every function that called
`getLanguage` need to have that configuration to pass it, or we will
have to add this argument to them as well, and to all the pile of
functions on top of them.

This explicitness is usually desirable, but you can imagine how this
could be problematic for configuration, as potentially every piece of
the system could depend on the configuration, so you could end up with
adding a config argument to every function in your application.


## Asynchronous readers

*Readers* originated in the purely functional languages as a method to
alliviate this.

First, let's reconigze that we try to build computations that depend
on a context. We also want those computations to be asynchronous for
convenience in Javascript, so we just define *Reader* as a class that
wraps functions of the form `Context -> Promise<value>`:

```javascript
const getLanguage = new Reader(context => {
  return Promise.resolve(context.currentLanguage)
})
```

Wrapping the function with the Reader allows us to attach methods to
operate with this function.

## Composing readers

Now you could want to build a function that greets the user, depending
on the current language. You could write that like

```javascript
const greet = name => {
  return new Reader(context => {
    return getLanguage.run(context).then(language=>{
      switch (language) {
        case 'en':
          return `Hi ${name}!`
        case 'es':
          return `Hola ${name}!`
        default:
          return `${name}!`
      } 
    })
  })
}
```

The `.run` method allows us to execute the wrapped function with a
provided configuration.

At this point is when we can take benefit of the wrapper *Reader*
class, and define some methods to make this easier. Similarly to
promises, we can use the `.then` method to build a new reader, as a
function of the returned value of another reader. So our example
becomes:

```javascript
const greet = name => {
  return getLanguage.then(language=>{
    switch (language) {
      case 'en':
        return `Hi ${name}!`
      case 'es':
        return `Hola ${name}!`
      default:
        return `${name}!`
    } 
  })
}
```

Now, something important happened: *config* does not appear in the
definition of `greet` anymore.

Of course, this is not magic. In the naive approach, we would add a
`config` argument to `greet`. Now we don't need that extra argument,
but we have traded it for a different return type, *a reader*
everywhere. But having the reader as an abstraction allows us to
attach extra functionality to them, making them a bit more implicit.


There is still some limitation in this approach:

```javascript
const greet = name => {
  return getLanguage.then(language=>{
    //
    // What if we need some other configuration in here?
    // ^^^
  }) 
}
```

again, as with promises, we can just return a new Reader from within
the .then function:

```javascript
const greet = name => {
  return getLanguage.then(language=>{
    return getUserPreferences().then(preferences=>{
      if (preferences.greet){
         // ....
      }
    })
  }) 
}
```


## Similarity with promises

You should have noticed by now that readers are pretty similar to
promises. They both wrapped a value, and you have a `.then` method to
derive new instances from old ones.  There are other types with this
structure, we refer to all of them as *monads*.

We can exploit the similarity with Promises a little bit.  In the
previous example, you saw how we were forced to nest our readers
within other readers. This makes the code unnecessarily hard to read.

In Javascript, promises improved this nested over callbacks, but it
was still definitely a problem until the `async/await` syntax was
introduced.

Unfortunately, the `async/await` syntax works only with promises, not
with any monad, but there is a more general functionality that was
used to simulate the same behaviour before async functions that we can
use: *generators*.

Using generators and the `coroutine` function from `async-reader`, we
can rewrite our last example like:

```javascript
const greet = coroutine(function*(name){
  const language = yield getLanguage
  const preferences = yield getUserPreferences()

  if (preferences.greet){
    // ....
  }
})
```

making our code structure flatter, then improving then the
readability.


## Hiding parts of the context

Note a few important points:

  - You don't need access to the *Reader* class to call a function
    that returns a reader.

  - If you *have access to Reader*, you have access to the *whole*
    context, not just part of it.

You can use this to build a collection of useful functions that give
you readers for different parts of the context and hiding the Reader
class.

For example, if you just export the `getLanguage` and, let's say,
`getVersion` functions from a module, all the built abstractions in
the application can only access those pieces of information, even if
the context can potentially contain much more.

The benefit is, accessing new pieces of information now is as easy as
exporting a new reader, and letting any function to use it. So you
don't need to change all your stack of functions to add an extra
argument.

## Finishing

Organizing your code like this, building functions that return readers
on top of other functions that return readers, allow us to write in a
very familiar way code that have implicit access to a *context*.

Calling the top function of this pile will give you a reader, and then
you will have to call the `.run()` method to pass the context, but you
will only have to do that in a single place.
