export default class Flip {
  
  static get version(){
    return 'v-1.0.0'
  }

  static get doc(){
    return `
      The original flipjs has stopped maintenance.
      This library fixes some problems on the basis of the original and expands some of the ways that are suitable for modern browsers.
      core API（Support for chained calls now）:
        1. new Flip(config).play().last(className?).invert().play()
        2. new Flip(config).snapshot(cls?) === new Flip(config).play().last(className?).invert()
      config:
        duration: 300,
        delay: 0,
        easing: 'linear',
        play: 'WAAP',
        transformOrigin: '0 0',
        waap_fill: 'both',
        waap_iterationStart: '0.0',
        waap_iterations: '1',
        transform: true,
        opacity: true
        ...
      You can use the play to select the animation execution engine you need (a few built-in, you can also expand it yourself).

      How to customize and use the animation engine？
       - Referring to the built-in animation engine, you only need to write an object that contains the play() function.
      steps：
       1. write your player object that must have a play() function.
       2. look at what includes in 'this' variable， then you maybe will use it.
       3. first you must call "Flip.extends('yourPlayerName', yourPlayer)"
       4. then construct the instance with "new Flip(config)", the config must have a property named 'customPlay', like { customPlay: 'yourPlayerName' }
      finally, be happy!
    `
  }

  static extends(name, player){
    if(!this.playerCache) 
      this.playerCache = {}

    if(this.playerCache[name]) 
      throw new Error(`player ${name} already exists.`)

    if(!player.play) 
      throw new Error(`player must have a play() function.`)

    this.playerCache[name] = player
  }

  static group (flips) {

    if(!Array.isArray(flips))
      throw new Error(`group() expects an array of config obj.`)
    
    flips = flips.map(flip => new Flip(flip))

    return {

      get flips() {
        return flips
      },

      addClass(className) {
        flips.forEach(flip => flip.addClass(className))
      },

      removeClass(className) {
        flips.forEach(flip => flip.removeClass(className))
      },

      first() {
        flips.forEach(flip => flip.first())
      },

      last(lastClassName) {

        flips.forEach((flip, index) => {
          let cls = lastClassName

          if(Array.isArray(lastClassName))
            cls = lastClassName[index]
          
          if(typeof cls !== 'undefined')
            flip._target.classList.add(cls)
        })

        flips.forEach(flip => flip.last())
      },

      invert() {
        flips.forEach(flip => flip.invert())
      },

      play(startTime) {
        if(!startTime)
          startTime = window.performance.now()

        flips.forEach(flip => flip.play(startTime))
      }
    }
  }

  constructor(options = {}) {
    console.info(`This project is only for learning FLIP technology, please do not use it in production environment. `)
    
    const defaultOpts = {
      duration: 300,
      delay: 0,
      easing: 'linear',
      play: 'WAAP',
      customPlay: '',
      transformOrigin: '0 0',
      waap_fill: 'both',
      waap_iterationStart: '0.0',
      waap_iterations: '1',
      transform: true,
      opacity: true,
    }

    const opts = Object.assign({}, defaultOpts, options)
    
    if(!opts.target)
      throw new Error(`the target dom node must be provided.`)
    
    this._start = 0
    this._target = opts.target
   
    Object.keys(opts).forEach(key => {
      if(opts.hasOwnProperty(key)) this[`_${key}`] = opts[key]
    })
    
    const player = Flip.playerCache[opts.customPlay ? opts.customPlay : opts.play]

    if(!player)
      throw new Error(`unkown player ${opts.play}.`)

    if(!player.play)
      throw new Error(`player must have a play() function.`)
    
    // this binding
    this.cleanUpAndFire = this.cleanUpAndFire.bind(this)
    this.fire = this.fire.bind(this)
    
    let f
    Object.keys(player).forEach(fn => {
      f = player[fn]
      this[`_${fn}`] = f.bind(this)
    })

    
    this._first = {
      layout: null,
      opacity: 0
    }

    this._last = {
      layout: null,
      opacity: 0
    }

    this._invert = {
      x: 0, y: 0, sx: 1, sy: 1, a: 0, d: false
    }
  }

  // tools - get element style
  getStyle(element, name) {
    if(element.currentStyle)
      return element.currentStyle[name]
    else
      return getComputedStyle(element,false)[name]
  }

  // tool - add class
  addClass(cls) {
    if(typeof cls !== 'string') return
    this._target.classList.add(cls)
  }

  // tool - remove class
  removeClass(cls) {
    if(typeof cls !== 'string') return
    this._target.classList.remove(cls)
  }

  // tool -clean
  cleanUpAndFire() {
    
    this._target.style.transform = null
    this._target.style.transformOrigin = null
    this._target.style.willChange = null
    this._target.style.opacity = null

    this._first.layout = null
    this._first.opacity = 0

    this._last.layout = null
    this._last.opacity = 0

    this._invert.x = 0
    this._invert.y = 0
    this._invert.sx = 1
    this._invert.sy = 1
    this._invert.a = 0
    this._invert.d = false

    this.fire('flipComplete')
  }

  // tool - fire an event
  fire(evtName, detail=null, bubbles=true, cancelable=true) {
    const e = new CustomEvent(evtName, { detail, bubbles, cancelable })
    this._target.dispatchEvent(e)
  }

  // snapshot
  snapshot(lastClassName) {
    this.first()
    this.last(lastClassName)
    this.invert()
    return this
  }

  // F - first
  first() {
    this._first.layout = this._target.getBoundingClientRect()
    this._first.opacity = parseFloat(this.getStyle(this._target, 'opacity'))
    return this
  }

  // L - last
  last(lastClassName) {
    if(lastClassName) this.addClass(lastClassName)
    this._last.layout = this._target.getBoundingClientRect()
    this._last.opacity = parseFloat(this.getStyle(this._target, 'opacity'))
    return this
  }

  // I - invert
  invert() {
    let willchange = []

    if(!this._first.layout) 
      throw new Error(`U must call first() before invert()`)
    
    if(!this._last.layout) 
      throw new Error(`U must call last() before invert()`)

    const { layout: { left: fleft, top: ftop, width: fwidth, height: fheight }, opacity: fopacity } = this._first
    const { layout: { left: lleft, top: ltop, width: lwidth, height: lheight }, opacity: lopacity } = this._last

    Object.assign(this._invert, {
      x: fleft - lleft,
      y: ftop - ltop,
      sx: fwidth / lwidth,
      sy: fheight / lheight,
      a: lopacity - fopacity,
      d: true
    })

    if(this._transform) {
      this._target.style.transformOrigin = this._transformOrigin
      this._target.style.transform = `translate(${this._invert.x}px, ${this._invert.y}px) scale(${this._invert.sx}, ${this._invert.sy})`
      willchange.push('transform')
    }

    if(this._opacity) {
      this._target.style.opacity = fopacity
      willchange.push('opacity')
    }
    
    this._target.style.willChange = willchange.join(',')
    return this
  }

  // P - play
  play(startTime) {
    if(!this._invert.d)
      throw new Error('U must call invert() brfore play()')

    const ifThereHaveRes = this._play(startTime)
    return ifThereHaveRes
  }
}