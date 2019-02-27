import options from './options'
import { defer } from './util'
import { renderComponent } from './vdom/component'

// 管理需要重新渲染的 dirty components 的队列
let items = []

/**
 * 将需要重新渲染的组件排队渲染
 * @param {import('./component').Component} 需要重新渲染的组件 
*/
export function enqueueRender(component) {
  if(
    !component._dirty && (component._dirty = true) && items.push(component) == 1
  ) {
    (options.debounceRendering || defer)(rerender)
  }
}

// 重新渲染所有排队的 dirty components
export function rerender() {
  let p
  while((p = items.pop())) {
    if(p._dirty) renderComponent(p)
  }
}