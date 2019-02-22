'use strict'

import { assert, addClass, getStyle, fire } from './helper'
import FlipCore from './flip-core'

export default class Flip extends FlipCore{
  
  constructor(options = {}) {
    super()

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
    
    assert(opts.target, `the target dom node must be provided.`)
    
    this._start = 0
    this._target = opts.target
   
    Object.keys(opts).forEach(key => {
      if(opts.hasOwnProperty(key)) this[`_${key}`] = opts[key]
    })
    
    const player = Flip._cache[opts.customPlay ? opts.customPlay : opts.play]

    assert(player, `unkown player ${opts.customPlay ? opts.customPlay : opts.play}.`)
    assert(player.play, `player must have a play() function.`)

    // this binding
    this.cleanUpAndFire = this.cleanUpAndFire.bind(this)
    
    let f
    Object.keys(player).forEach(fn => {
      f = player[fn]
      this[`_${fn}`] = f.bind(this)
    })
    
    this._first = { layout: null, opacity: 0 }
    this._last = { layout: null, opacity: 0 }
    this._invert = { x: 0, y: 0, sx: 1, sy: 1, a: 0, d: false }
  }

  cleanUpAndFire() {
    
    const targetStyle = this._target.style, first = this._first, last = this._last, invert = this._invert

    targetStyle.transform = null
    targetStyle.transformOrigin = null
    targetStyle.willChange = null
    targetStyle.opacity = null

    first.layout = null
    first.opacity = 0

    last.layout = null
    last.opacity = 0


    invert.x = 0
    invert.y = 0
    invert.sx = 1
    invert.sy = 1
    invert.a = 0
    invert.d = false

    fire(this._target, 'flipComplete')
  }

  snapshot(lastClassName) {
    return this.first().last(lastClassName).invert()
  }

  first() {
    this._first.layout = this._target.getBoundingClientRect()
    this._first.opacity = parseFloat(getStyle(this._target, 'opacity'))
    return this
  }

  last(lastClassName) {
    if(lastClassName) addClass(this._target, lastClassName)
    this._last.layout = this._target.getBoundingClientRect()
    this._last.opacity = parseFloat(getStyle(this._target, 'opacity'))
    return this
  }

  invert() {
    let willchange = []

    assert(this._first.layout, `please call first() before invert().`)
    assert(this._last.layout, `please call last() before invert().`)

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

  play(startTime) {
    assert(this._invert.d, `please call invert() brfore play().`)
    const ifThereHaveRes = this._play(startTime)
    return ifThereHaveRes
  }
}