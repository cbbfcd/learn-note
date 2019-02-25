// 配置
// 包括：
// 1. {boolean} [syncComponentUpdates] -> 默认为 true, 如果 true，那么 props 改变就会触发同步组件更新
// 2. {(vnode: VNode) => void} [vnode] -> 处理所有创建的 VNode
// 3. {(component: Component) => void} [afterMount] -> 组件挂载后调用的 Hook
// 4. {(component: Component) => void} [afterUpdate] -> 组件最新一次渲染，DOM 更新之后调用的 Hook
// 5. {(component: Component) => void} [beforeUnmount] -> 组件卸载之前立即调用的 Hook
// 6. {(rerender: function) => void} [debounceRendering] -> 无论何时请求重新渲染，都会调用 Hook。可用于去抖动。
// 7. {(event: Event) => Event | void} [event] -> 在任何 Preact事件侦听器之前调用 Hook。返回值（如果有）会替换掉浏览器默认提供给事件侦听器的 event

const options = {}

export default options