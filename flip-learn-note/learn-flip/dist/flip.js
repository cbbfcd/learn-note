(function (global, factory) {
  typeof exports === 'object' && typeof module !== 'undefined' ? module.exports = factory() :
  typeof define === 'function' && define.amd ? define(factory) :
  (global = global || self, global.flip = factory());
}(this, function () { 'use strict';

  // web animation api

  var WAAP = {

    // every extension must have a play function
    play() {

      if(typeof this._easing !== 'string')
        throw new Error(`
        waap player only support string easing value for now.
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
        easing: this._easing,
        fill: this._waap_fill,
        iterationStart: this._waap_iterationStart,
        iterations: this._waap_iterations
      };

      // https://developer.mozilla.org/en-US/docs/Web/API/Web_Animations_API
      // https://developer.mozilla.org/en-US/docs/Web/API/Element/animate
      // https://zhuanlan.zhihu.com/p/27867539
      const _animate = this._target.animate(keyframes, opts);

      _animate.onfinish = () => {
        this.cleanUpAndFire();
      };

      return _animate
    }
  };

  // requestAnimationFrame

  const clamp = (value, min = Number.NEGATIVE_INFINITY, max = Number.POSITIVE_INFINITY) => Math.min(max, Math.max(min, value));

  var RAF = {

    play(startTime) {

      if(this._easing === 'linear')
        this._easing = t => t;
      else if(typeof this._easing !== 'function')
        throw new Error('the raf player requires that easing be a function.')
      
      if(!startTime)
        this._start = window.performance.now() + this._delay;
      else
        this._start = startTime + this._delay;
      
      const update = () => {
        let time = (window.performance.now() - this._start) / this._duration;
        time = clamp(time, 0, 1);
        let remappedTime = this._easing(time);

        let _update = {
          x: this._invert.x * (1 - remappedTime),
          y: this._invert.y * (1 - remappedTime),
          sx: this._invert.sx + remappedTime * (1 - this._invert.sx),
          sy: this._invert.sy + remappedTime * (1 - this._invert.sy),
          a: this._first.opacity + remappedTime * this._invert.a
        };

        if(this._transform)
          this._target.style.transform = `
          translate(${_update.x}px, ${_update.y}px)
          scale(${_update.sx}, ${_update.sy})
        `;
        if(this._opacity)
          this._target.style.opacity = _update.a;
        
        if(time < 1)
          requestAnimationFrame(update);
        else
          this.cleanUpAndFire();
      };
        
      requestAnimationFrame(update);
    }
  };

  // css

  const once = (element, evtName, handler) => {
    let off;
    const proxy = (e) => {
      if(e.target !== element) return
      handler(element);
      off();
    };
    off = () => element.removeEventListener(evtName, proxy);
    element.addEventListener(evtName, proxy);

    return off
  };

  var CSS = {

    play() {
      
      if(typeof this._easing !== 'string') 
        throw new Error(`
        css player only support string easing value for now.
      `)

      const transtions = [];
      if(this._transform)
        transtions.push('transform');
      if(this._opacity)
        transtions.push('opacity');

      this._target.style.transitionProperty = transtions.join(',');
      this._target.style.transitionTimingFunction = this._easing;
      this._target.style.transitionDuration = `${this._duration}ms`;
      this._target.style.transitionDelay = `${this._delay}ms`;
      if(this._transform)
        this._target.style.transform = `
        translate(${this._invert.x}px, ${this._invert.y}px)
        scale(${this._invert.sx}, ${this._invert.sy})
      `;
      if(this._opacity)
        this._target.style.opacity = this._last.opacity;

      const cleanup = () => {
        this._target.style.transitionProperty = '';
        this._target.style.transitionTimingFunction = '';
        this._target.style.transitionDuration = '';
        this._target.style.transitionDelay = '';
        this.cleanUpAndFire();
      };

      once(this._target, 'transitionend', cleanup);

      requestAnimationFrame(() => {
        if(this._transform)
          this._target.style.transform = '';
        if(this._opacity)
          this._target.style.opacity = 0;
      });
    }
  };

  class Flip {
    
    static get version(){
      return '1.0.0'
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

    static group (flips) {

      if(!Array.isArray(flips))
        throw new Error(`group() expects an array of config obj.`)
      
      flips = flips.map(flip => new Flip(flip));

      return {

        get flips() {
          return flips
        },

        addClass(className) {
          flips.forEach(flip => flip.addClass(className));
        },

        removeClass(className) {
          flips.forEach(flip => flip.removeClass(className));
        },

        first() {
          flips.forEach(flip => flip.first());
        },

        last(lastClassName) {

          flips.forEach((flip, index) => {
            let cls = lastClassName;

            if(Array.isArray(lastClassName))
              cls = lastClassName[index];
            
            if(typeof cls !== 'undefined')
              flip._target.classList.add(cls);
          });

          flips.forEach(flip => flip.last());
        },

        invert() {
          flips.forEach(flip => flip.invert());
        },

        play(startTime) {
          if(!startTime)
            startTime = window.performance.now();

          flips.forEach(flip => flip.play(startTime));
        }
      }
    }

    constructor(options = {}) {
      console.warn(`This library is still in the continuous improvement phase, please do not use it in the production environment.`);
      
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
      };

      const opts = Object.assign({}, defaultOpts, options);
      
      if(!opts.target)
        throw new Error(`the target dom node must be provided.`)
      
      this._start = 0;
      this._target = opts.target;
     
      Object.keys(opts).forEach(key => {
        if(opts.hasOwnProperty(key)) this[`_${key}`] = opts[key];
      });
      
      const player = Flip.playerCache[opts.customPlay ? opts.customPlay : opts.play];

      if(!player)
        throw new Error(`unkown player ${opts.play}.`)

      if(!player.play)
        throw new Error(`player must have a play() function.`)
      
      // this binding
      this.cleanUpAndFire = this.cleanUpAndFire.bind(this);
      this.fire = this.fire.bind(this);
      
      let f;
      Object.keys(player).forEach(fn => {
        f = player[fn];
        this[`_${fn}`] = f.bind(this);
      });

      
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
    getStyle(element, name) {
      if(element.currentStyle)
        return element.currentStyle[name]
      else
        return getComputedStyle(element,false)[name]
    }

    // tool - add class
    addClass(cls) {
      if(typeof cls !== 'string') return
      this._target.classList.add(cls);
    }

    // tool - remove class
    removeClass(cls) {
      if(typeof cls !== 'string') return
      this._target.classList.remove(cls);
    }

    // tool -clean
    cleanUpAndFire() {
      
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

      this.fire('flipComplete');
    }

    // tool - fire an event
    fire(evtName, detail=null, bubbles=true, cancelable=true) {
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
      this._first.opacity = parseFloat(this.getStyle(this._target, 'opacity'));
      return this
    }

    // L - last
    last(lastClassName) {
      if(lastClassName) this.addClass(lastClassName);
      this._last.layout = this._target.getBoundingClientRect();
      this._last.opacity = parseFloat(this.getStyle(this._target, 'opacity'));
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

  // built-in extensions
  Flip.extends('WAAP', WAAP);
  Flip.extends('RAF', RAF);
  Flip.extends('CSS', CSS);

  return Flip;

}));
