
// 递归次数统计，用来追踪 diff cycle
export let diffLevel = 0

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
  
}