class Reader {

  // run :: Context -> Promise<result>
  constructor (run) {
    this.run = run
  }

  then (fn){
    return new Reader(context=>{
      return this.run(context).then(result=>{
        const next = Reader.of( fn(result) )
        return next.run(context)
      })
    })
  }

  static of (x) {
    return x instanceof Reader? x: new Reader(_=> Promise.resolve(x) )
  }

}

Reader.ask = new Reader(c => Promise.resolve(c) )
module.exports = Reader
