'use strict'

export const assert = (condition, msg) => {
  if(!condition)
    throw new Error(`[flipjs] ${msg}`)
}

export const clamp = (value, min = Number.NEGATIVE_INFINITY, max = Number.POSITIVE_INFINITY) => Math.min(max, Math.max(min, value))

export const addClass = (target, cls) => {
  assert(typeof cls === 'string', `className must be string type.`)
  target.classList.add(cls)
}

export const removeClass = (target, cls) => {
  assert(typeof cls === 'string', `className must be string type.`)
  target.classList.remove(cls)
}

export const getStyle = (target, name)  => {
  if(target.currentStyle)
    return target.currentStyle[name]
  else
    return getComputedStyle(target,false)[name]
}

export const fire = (target, evtName, detail = null, bubbles = true, cancelable = true) => {
  const e = new CustomEvent(evtName, { detail, bubbles, cancelable })
  target.dispatchEvent(e)
}