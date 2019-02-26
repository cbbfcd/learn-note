// render 模式

// 不要 re-render
export const NO_RENDER = 0

// 同步的 re-render 一个组件及其 children
export const SYNC_RENDER = 1

// 同步的 re-render 一个组件及其 children, 尽管生命周期可能会试图阻止
export const FORCE_RENDER = 2

// 队列异步 re-render 组件及其子组件
export const ASYNC_RENDER = 3

export const ATTR_KEY = '__preactattr_'

// dom 属性是数字时不应该添加 px
export const IS_NON_DIMENSIONAL = /acit|ex(?:s|g|n|p|$)|rph|ows|mnc|ntw|ine[ch]|zoo|^ord/i