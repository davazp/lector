async-reader Tutorial
=====================

## The problem

If you have adopted a (almost) *purely functional* approach in
Javascript, weather it was a choice or a requirement of the
techonology you use, you will find some restrictions in how you can
write your code

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

This explicitness is usually desirable, but you can imagine how for
some information as configuration is problematic, as potentially every
piece of the system could depend on the configuration, so you could
end up with adding a config argument to every function in your
application.


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

Wrapping the function with in the Reader allows us to attach methods
to operate with this function.

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

The `.run` method allow us to execute the wrapped function with a
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

Of course this is not magic. In the naive approach, we would add a
`config` argument to `greet`. Now we don't need that extra argument,
but we have traded it for a different return type, *a reader*
everywhere. But having the reader as an abstraction allow us to attach
extra functionality to them, making them a bit more implicit.
