var webAnimationApi = {

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
    ];

    const opts = {
      delay: this._delay,
      duration: this._duration,
      easing: this._easing
    };

    // https://developer.mozilla.org/en-US/docs/Web/API/Web_Animations_API
    // https://developer.mozilla.org/en-US/docs/Web/API/Element/animate
    // https://zhuanlan.zhihu.com/p/27867539
    const _animate = this._target.animate(keyframes, opts);

    _animate.onfinish = () => {
      this._cleanUpAndFire();
    };

    return _animate
  }
};

class Flip {
  
  static get version(){
    return 'v-1.0.0'
  }

  static get doc(){
    return `
      hello world!
    `
  }

  static extends(name, player){
    if(!this.playerCache) 
      this.playerCache = {};

    if(this.playerCache[name]) 
      throw new Error(`player ${name} already exists.`)

    if(!player.play) 
      throw new Error(`player must have a play() function.`)

    this.playerCache[name] = player;
  }

  constructor(options = {}) {
    console.info(`This project is only for learning FLIP technology, please do not use it in production environment. `);
    
    const defaultOpts = {
      duration: 300,
      delay: 0,
      easing: 'linear',
      play: 'webAnimationApi',
      transformOrigin: '0 0 ',
      transform: true,
      opacity: true
    };

    const opts = Object.assign({}, defaultOpts, options);
    
    if(!opts.target)
      throw new Error(`the target dom node must be provided.`)
    
    this._start = 0;
    this._target = opts.target;
    this._duration = opts.duration;
    this._delay = opts.delay;
    this._easing = opts.easing;
    this._transform = opts.transform;
    this._opacity = opts.opacity;
    this._transformOrigin = opts.transformOrigin;
    const player = Flip.playerCache[opts.play];

    if(!player)
      throw new Error(`unkown player ${opts.play}.`)

    if(!player.play)
      throw new Error(`player must have a play() function.`)
    
    // this binding
    this._play = player.play.bind(this);
    
    this._first = {
      layout: null,
      opacity: 0
    };

    this._last = {
      layout: null,
      opacity: 0
    };

    this._invert = {
      x: 0, y: 0, sx: 1, sy: 1, a: 0, d: false
    };
  }

  // tools - get element style
  _getStyle(element, name) {
    if(element.currentStyle)
      return element.currentStyle[name]
    else
      return getComputedStyle(element,false)[name]
  }

  // tool - add class
  _addClass(cls) {
    if(typeof cls !== 'string') return
    this._target.classList.add(cls);
  }

  // tool - remove class
  _removeClass(cls) {
    if(typeof cls !== 'string') return
    this._target.classList.remove(cls);
  }

  // tool -clean
  _cleanUpAndFire() {
    
    this._target.style.transform = null;
    this._target.style.transformOrigin = null;
    this._target.style.willChange = null;
    this._target.style.opacity = null;

    this._first.layout = null;
    this._first.opacity = 0;

    this._last.layout = null;
    this._last.opacity = 0;

    this._invert.x = 0;
    this._invert.y = 0;
    this._invert.sx = 1;
    this._invert.sy = 1;
    this._invert.a = 0;
    this._invert.d = false;

    this._fire('flipComplete');
  }

  // tool - fire an event
  _fire(evtName, detail=null, bubbles=true, cancelable=true) {
    const e = new CustomEvent(evtName, { detail, bubbles, cancelable });
    this._target.dispatchEvent(e);
  }

  // snapshot
  snapshot(lastClassName) {
    this.first();
    this.last(lastClassName);
    this.invert();
    return this
  }

  // F - first
  first() {
    this._first.layout = this._target.getBoundingClientRect();
    this._first.opacity = parseFloat(this._getStyle(this._target, 'opacity'));
    return this
  }

  // L - last
  last(lastClassName) {
    if(lastClassName) this._addClass(lastClassName);
    this._last.layout = this._target.getBoundingClientRect();
    this._last.opacity = parseFloat(this._getStyle(this._target, 'opacity'));
    return this
  }

  // I - invert
  invert() {
    let willchange = [];

    if(!this._first.layout) 
      throw new Error(`U must call first() before invert()`)
    
    if(!this._last.layout) 
      throw new Error(`U must call last() before invert()`)

    const { layout: { left: fleft, top: ftop, width: fwidth, height: fheight }, opacity: fopacity } = this._first;
    const { layout: { left: lleft, top: ltop, width: lwidth, height: lheight }, opacity: lopacity } = this._last;

    Object.assign(this._invert, {
      x: fleft - lleft,
      y: ftop - ltop,
      sx: fwidth / lwidth,
      sy: fheight / lheight,
      a: lopacity - fopacity,
      d: true
    });

    if(this._transform) {
      this._target.style.transformOrigin = this._transformOrigin;
      this._target.style.transform = `translate(${this._invert.x}px, ${this._invert.y}px) scale(${this._invert.sx}, ${this._invert.sy})`;
      willchange.push('transform');
    }

    if(this._opacity) {
      this._target.style.opacity = fopacity;
      willchange.push('opacity');
    }
    
    this._target.style.willChange = willchange.join(',');
    return this
  }

  // P - play
  play(startTime) {
    if(!this._invert.d)
      throw new Error('U must call invert() brfore play()')

    const ifThereHaveRes = this._play(startTime);
    return ifThereHaveRes
  }
}

// extension
Flip.extends('webAnimationApi', webAnimationApi);

export default Flip;
export { Flip };
