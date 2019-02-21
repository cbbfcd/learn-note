'use strict'

export const assert = (condition, msg) => {
  if(!condition)
    throw new Error(`[flipjs] ${msg}`)
}