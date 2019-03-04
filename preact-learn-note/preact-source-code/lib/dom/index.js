
/**
 * 如果已连接，则从其父节点中删除子节点
 * @param {*} node 
*/
export function removeNode(node) {
  let parentNode = node.parentNode
  if(parentNode) parentNode.removeChild(node)
}