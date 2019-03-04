import { ATTR_KEY } from '../constants'
import options from '../options'
import { unmountComponent } from './component'
import { applyRef } from '../util';
import { removeNode } from '../dom';

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

  // string 或者 数字
  if(typeof vnode === 'string' || typeof vnode === 'number') {

    // https://developer.mozilla.org/zh-CN/docs/Web/API/Text/splitText
    // 如果已经是 Text node
    // https://developer.mozilla.org/zh-CN/docs/Web/API/Node/nodeValue
    if(dom && dom.splitText !== undefined && dom.parentNode && (!dom._component || componentRoot)) {
      if(dom.nodeValue != vnode) {
        // 文本节点直接更新其 nodeValue 就可以。
        dom.nodeValue = vnode
      }
    }else {
      // 它不是Text节点：将其替换并回收旧元素
      out = document.createTextNode(vnode)
      if(dom) {
        // https://developer.mozilla.org/zh-CN/docs/Web/API/Node/replaceChild
        if(dom.parentNode) dom.parentNode.replaceChild(out, dom)
        recollectNodeTree(dom, true)
      }
    }

    out[ATTR_KEY] = true

    return out
  }
}

/**
 * 递归地回收（或只是卸载）节点及其后代
 * @param {import('../dom').PreactElement}
 * @param {boolean} [unmountOnly=false] 如果 true, 只触发卸载，跳过删除
 * 
*/
export function recollectNodeTree(node, unmountOnly) {
  let component = node._component
  if(component) {
    // 如果节点由 Component 拥有，则卸载该组件（最终在此处重新递归)
    unmountComponent(component)
  }else {
    // 如果节点的 VNode 具有 ref 函数，则在此处使用 null 调用它
    // 这是 React 规范的一部分，并且非常适合未设置的引用
    if(node[ATTR_KEY] != false) applyRef(node[ATTR_KEY].ref, null)

    if(unmountOnly === false || node[ATTR_KEY] == null) {
      removeNode(node)
    }

    removeChildren(node)
  }
}

/**
 * Recollect/unmount all children
 * - we use .lastChild here because it causes less reflow than .firstChild
 * - it's also cheaper than accessing the .childNodes Live NodeList
*/
export function removeChildren(node) {
  node = node.lastChild
  while(node) {
    // https://developer.mozilla.org/zh-CN/docs/Web/API/Node/previousSibling
    let next = node.previousSibling
    recollectNodeTree(node, true)
    node = next
  }
}