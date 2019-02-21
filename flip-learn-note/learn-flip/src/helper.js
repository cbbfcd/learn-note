'use strict'

export const assert = (condition, msg) => {
  if(!condition)
    throw new Error(`[flipjs] ${msg}`)
}

export const clamp = (value, min = Number.NEGATIVE_INFINITY, max = Number.POSITIVE_INFINITY) => Math.min(max, Math.max(min, value))