export default {

  // every extension must have a play function
  play() {

    if(typeof this._easing !== 'string')
      throw new Error(`
        only support string easing value for now.
        reference: https://www.w3schools.com/jsref/prop_style_transitiontimingfunction.asp.
      `)

    const keyframes = [
      {
        transformOrigin: this._transformOrigin,
        transform: `
          translate(${this._invert.x}px, ${this._invert.y}px) 
          scale(${this._invert.sx}, ${this._invert.sy})
        `,
        opacity: this._first.opacity
      },
      {
        transformOrigin: this._transformOrigin,
        transform: 'none',
        opacity: this._last.opacity
      }
    ]

    const opts = {
      delay: this._delay,
      duration: this._duration,
      easing: this._easing,
      fill: this._waap_fill,
      iterationStart: this._waap_iterationStart,
      iterations: this._waap_iterations
    }

    // https://developer.mozilla.org/en-US/docs/Web/API/Web_Animations_API
    // https://developer.mozilla.org/en-US/docs/Web/API/Element/animate
    // https://zhuanlan.zhihu.com/p/27867539
    const _animate = this._target.animate(keyframes, opts)

    _animate.onfinish = () => {
      this.cleanUpAndFire()
    }

    return _animate
  }
}