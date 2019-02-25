import { h } from './h'
import { extend } from './util'

/**
 * 克隆虚拟节点，mixin 属性进去或者替换掉其 children,多传的参数都是作为 children.
 * @param {import('./vnode').VNode} vnode The virtual DOM element to clone
 * @param {object} props Attributes/props to add when cloning
 * @param {Array<import('./vnode').VNode>} [rest] Any additional arguments will be used as replacement
 *  children.
 */
export function cloneElement(vnode, props) {
  return h(
    vnode.nodeName,
    extend(extend({}, vnode.attributes), props),
    arguments.length > 2 ? [].slice.call(arguments, 2) : vnode.children
  )
}