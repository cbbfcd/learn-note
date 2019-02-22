'use strict'

import { assert } from './helper'

export default class FlipCore {

  constructor() {
    assert(new.target !== FlipCore, `FlipCore cannot be instantiated and can only be inherited.`)
  }

  static get version() {
    return 'v1.0.1'
  }

  static get players() {
    return this._cache
  }

  static extends(name, player) {
    if(!this._cache) this._cache = {}
    assert(!this._cache[name], `player ${name} already exists.`)
    assert(!!player.play, `player must have a play() function.`)
    this._cache[name] = player
  }
}