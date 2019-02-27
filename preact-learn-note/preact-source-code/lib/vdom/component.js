import { extend } from '../util'
import { FORCE_RENDER } from '../constants'

/**
 * 渲染组件，触发必要的生命周期事件并考虑高阶组件
 * @param {import('../component').Component} 要渲染的组件
 * @param {number} [renderMode] 渲染的模式，定义在 constants.js
 * @param {boolean} [mountAll] 是否立即挂载所有的组件
 * @param {boolean} [isChild] ?
*/
export function renderComponent(component, renderMode, mountAll, isChild) {
  if(component._disable) return

  let props = component.props,
      state = component.state,
      context = component.context,
      previousProps = component.prevProps || props,
      previousState = component.prevState || state,
      previousContext = component.prevContext || context,
      isUpdate = component.base,
      nextBase = component.nextBase,
      initialBase = isUpdate || nextBase,
      initialChildComponent = component._component,
      skip = false,
      snapshot = previousContext,
      rendered, inst, cbase

  // getDerivedStateFromProps 是静态方法，返回一个 state
  // https://reactjs.org/docs/react-component.html#static-getderivedstatefromprops
  // 通过实例的 constructor 拿到构造函数（就是 class）然后调用对应的静态方法, 和 React 一样的使用体验！
  if(component.constructor.getDerivedStateFromProps) {
    state = extend(extend({}, state), component.constructor.getDerivedStateFromProps(props, state))
    component.state = state
  }

  // if updating
  if(isUpdate) {
    component.props = previousProps
    component.state = previousState
    component.context = previousContext
    if(
      // https://reactjs.org/docs/react-component.html#shouldcomponentupdate
      // shouldcomponentupdate 返回 false 会跳过重新渲染
      renderMode !== FORCE_RENDER &&
      component.shouldComponentUpdate &&
      component.shouldComponentUpdate(props, state, context) === false
    ) {
      skip = true
    } else if(component.componentWillUpdate) {
      // https://reactjs.org/docs/react-component.html#unsafe_componentwillupdate
      component.componentWillUpdate(props, state, context)
    } 
    component.props = props
    component.state = state
    component.context = context
  }

  component.prevProps = component.prevState = component.prevContext = component.nextBase = null
  component._dirty = false

  if(!skip) {
    // 返回一个新的 v-node
    rendered = component.render(props, state, context)
    
  }
}