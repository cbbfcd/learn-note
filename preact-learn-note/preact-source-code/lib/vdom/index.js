import { extend } from '../util'

/**
 * 由 VNode 重构组件风格的 `props`
 * 确保`defaultProps`的默认/回退值：添加了内部属性 `defaultProps`
 * @param {import('../vnode').VNode} vnode
 * @returns {object}
*/
export function getNodeProps(vnode) {
  let props = extend({}, vnode.attributes)
  props.children = vnode.children

  let defaultProps = vnode.nodeName.defaultProps
  if(defaultProps !== undefined) {
    for(let i in defaultProps) {
      if(props[i] === undefined) {
        props[i] = defaultProps[i]
      }
    }
  }
  return props
}