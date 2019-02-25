// VNode
// 包含的属性：
// 1. nodeName, 
// 2. children, 
// 3. attributes, 
// 4. key
// 虚拟 DOM 可以包含不同的属性，但是核心还是要有节点名字、属性对象、子节点数组、key 则是有一些优化 diff 上的用途
export const VNode = function VNode() {}