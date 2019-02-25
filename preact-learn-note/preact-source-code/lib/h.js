import { VNode } from './vnode'
import options from './options'

const stack = []

const EMPTY_CHILDREN = []

// 这个函数如同 `createElement`，作用就是生成一个虚拟 DOM，可以在 babel 插件`transform-react-jsx`中配置 pragma 属性来替换成 h 函数
// 这也是为什么使用 JSX 的时候必须要 import React 的原因，因为 babel 需要使用 React.createElement.
// [@babel/plugin-transform-react-jsx](https://www.npmjs.com/package/@babel/plugin-transform-react-jsx)
// 同样可以参考 hyperapp 的 h 函数，其实大同小异，如出一辙。
// [hyperapp/h](https://github.com/jorgebucaran/hyperapp/blob/V2/src/index.js#L477)

/**
 * @example:
 * `<div id="foo" name="bar">Hello!</div>`
 * 其虚拟 DOM 可以通过如下函数生成：
 * `h('div', { id: 'foo', name : 'bar' }, 'Hello!');`
 * 
 * @param {string | function} nodeName 节点名，比如：'div', 'span' 等
 * @param {object | null} attributes 属性
 * @param {VNode[]} [rest] 其他参数被视为 children，可以无限嵌套的数组
 */
export function h(nodeName, attributes) {
  let children = EMPTY_CHILDREN, lastSimple, child, simple, i;

  // 多出的参数都倒序的放进栈中
  for(i = arguments.length; i-- > 2;) {
    stack.push(arguments[i])
  }

  // rest 参数优先
  if(attributes && attributes.children != null) {
    if(!stack.length) stack.push(attributes.children)
    delete attributes.children
  }

  // 处理 child，可能是数组、数字、对象、布尔、字符串等等等等。
  while(stack.length) {
    // 如果是数组 => Array.isArray((child = stack.pop()))
    // 扁平化处理
    if((child = stack.pop()) && child.pop !== undefined) {
      for( i = child.length; i-- ;) stack.push(child[i])
    }else {
      // 如果 child 是 boolean
      if(typeof child === 'boolean') child = null

      // 如果 nodeName 不是一个函数
      // 如果 nodeName 是函数，其实指的是 Component constructor 函数。也就是说
      if((simple = typeof nodeName !== 'function')) {
        if(child == null) child = ''
        else if(typeof child === 'number') child = String(child)
        else if(typeof child !== 'string') simple = false
      }

      // 若不是对象，多个字符串做拼接。这里的处理比 hyperapp 复杂一点。
      // h('span', {id: 'test'}, 1,2,'234', false, 'hello') => 其 children: ["12234hello"]
      if(simple && lastSimple) {
        children[children.length - 1] += child
      }else if(children === EMPTY_CHILDREN) {
        children = [child]
      }else {
        children.push(child)
      }

      lastSimple = simple
    }
  }

  // 构建vnode
  let p = new VNode()
  p.nodeName = nodeName
  p.children = children
  p.attributes = attributes == null ? undefined : attributes
  p.key = attributes == null ? undefined : attributes.key

  // 如果定义了 `vnode hook` 那么所有创建的 vnode 都要传给它
  if(options.vnode !== undefined) options.vnode(p)
  
  return p
}