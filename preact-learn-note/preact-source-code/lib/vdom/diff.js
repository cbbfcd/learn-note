import { ATTR_KEY } from '../constants'
import options from '../options'

// 已挂载且正在等待 componentDidMount 的组件的队列
export const mounts = []

// 递归次数统计，用来追踪 diff cycle
export let diffLevel = 0

// Global flag indicating if the diff is currently within an SVG
let isSvgMode = false

// Global flag indicating if the diff is performing hydration
let hydrating = false

// 调用排队的 componentDidMount 生命周期方法
export function flushMounts(){
  let c
  // 先进先出
  while ((c = mounts.shift())) {
    if(options.afterMount) options.afterMount(c)
    if(c.componentDidMount) c.componentDidMount()
  }
}

/**
 * Apply differences in a given vnode (and it's deep children) to a real DOM Node
 * @param {import('../dom').PreactElement} dom 一个真实 dom 节点
 * @param {*} vnode v-node
 * @param {*} context 当前的上下文
 * @param {*} mountAll 是否立即挂载所有组件
 * @param {*} parent ?
 * @param {*} componentRoot ?
 * @returns {import('../dom').PreactElement} The created/mutated element 
*/
export function diff(dom, vnode, context, mountAll, parent, componentRoot) {
  // 这里 diffLevel 为 0 表示初始进入 diff（不是 subiff ）
  if(!diffLevel++) {
    // 首次启动差异时，检查我们是在 diffing an SVG 或者 within an SVG
    // ownerSVGElement 返回不为空表示是 within an svg，返回 null 表示当前节点就是 SVG 节点.
    // 所以 isSvgMode 为真表示 parent 是一个 SVG 或者 within an SVG.
    isSvgMode = parent != null && parent.ownerSVGElement !== undefined

    // hydration is indicated by the existing element to be diffed not having a prop cache
    // 通过一个状态标志来确定是不是 hydration
    hydrating = dom != null && !(ATTR_KEY in dom)
  }
  // 核心的 diff 算法方法
  let ret = idiff(dom, vnode, context, mountAll, componentRoot)

  // 如果是新的父元素则追加
  if(parent && ret.parent !== parent) parent.appendChild(ret)

  // difflevel 减少到 0 表示我们正在退出 diff
  if(!--diffLevel) {
    hydrating = false
    // 调用排队的componentDidMount生命周期方法
    if(!componentRoot) flushMounts()
  }

  return ret
}

/**
 * Internals of `diff()`, separated to allow bypassing `diffLevel` / `mount`flushing.
*/
export function idiff(dom, vnode, context, mountAll, componentRoot){
  let out = dom,
      prevSvgMode = isSvgMode

  // 空值（null，undefined，booleans）呈现为空文本节点
  if(vnode == null || typeof vnode === 'boolean') vnode = ''

  
}