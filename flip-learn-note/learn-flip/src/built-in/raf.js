// requestAnimationFrame
'use strict'

const clamp = (value, min = Number.NEGATIVE_INFINITY, max = Number.POSITIVE_INFINITY) => Math.min(max, Math.max(min, value))

export default {

  play(startTime) {

    if(this._easing === 'linear')
      this._easing = t => t
    else if(typeof this._easing !== 'function')
      throw new Error('the raf player requires that easing be a function.')
    
    if(!startTime)
      this._start = window.performance.now() + this._delay
    else
      this._start = startTime + this._delay
    
    const update = () => {
      let time = (window.performance.now() - this._start) / this._duration
      time = clamp(time, 0, 1)
      let remappedTime = this._easing(time)

      let _update = {
        x: this._invert.x * (1 - remappedTime),
        y: this._invert.y * (1 - remappedTime),
        sx: this._invert.sx + remappedTime * (1 - this._invert.sx),
        sy: this._invert.sy + remappedTime * (1 - this._invert.sy),
        a: this._first.opacity + remappedTime * this._invert.a
      }

      if(this._transform)
        this._target.style.transform = `
          translate(${_update.x}px, ${_update.y}px)
          scale(${_update.sx}, ${_update.sy})
        `
      if(this._opacity)
        this._target.style.opacity = _update.a
      
      if(time < 1)
        requestAnimationFrame(update)
      else
        this.cleanUpAndFire()
    }
      
    requestAnimationFrame(update)
  }
}