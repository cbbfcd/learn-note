import { extend, applyRef } from '../util'
import { FORCE_RENDER, SYNC_RENDER, NO_RENDER, ATTR_KEY } from '../constants'
import { getNodeProps } from './index'
import options from '../options'
import { enqueueRender } from '../render-queue'
import { createComponent, recyclerComponents } from './component-recycler'
import { diff, removeChildren } from './diff'
import { removeNode } from '../dom'

/**
 * 设置一个组件的`props`并且可能重新渲染组件
 * @param {import('../component').Component} component 需要设置 props 的组件
 * @param {object} props 新的`props`
 * @param {number} renderMode 渲染模式
 * @param {object} context 新的 `context`
 * @param {boolean} mountAll 是否立即挂载所有组件
*/
export function setComponentProps(component, props, renderMode, context, mountAll) {
  // 锁
  if(component._disable) return
  component._disable = true
  
  component.__ref = props.ref
  component.__key = props.key
  delete props.ref
  delete props.key

  // 兼容新旧版本的 React 生命周期
  if(typeof component.constructor.getDerivedStateFromProps === 'undefined') {
    if(!component.base || mountAll) {
      if(component.componentWillMount) component.componentWillMount()
    }else if(component.componentWillReceiveProps) {
      // https://reactjs.org/docs/react-component.html#unsafe_componentwillreceiveprops
      component.componentWillReceiveProps(props, context);
    }
  }

  // 更新组件的 context
  if(context && context !== component.context) {
    if(!component.prevContext)  component.prevContext = component.context
    component.context = context
  }

  // 更新组件的 props
  if(!component.prevProps) component.prevProps = props
  component.props = props

  // 锁在这儿中断
  component._disable = false

  // 当不是`NO_RENDER`模式的时候，触发重新渲染
  if(renderMode !== NO_RENDER) {
    // 同步更新
    if(renderMode === SYNC_RENDER || options.syncComponentUpdates !== false || !component.base) {
      renderComponent(component, SYNC_RENDER, mountAll)
    }else {
      // 异步队列更新
      enqueueRender(component)
    }
  }

  // 设置 ref
  applyRef(component.__ref, component)
}

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
    // 返回一个新的 v-node, 这里和 React 的区别是往 render 函数中注入了 props、state、context
    rendered = component.render(props, state, context)
    
    // 传递给子组件的上下文，可以通过（祖先）父组件更新
    if(component.getChildContext) {
      context = extend(extend({}, context), component.getChildContext())
    }

    // https://reactjs.org/docs/react-component.html#getsnapshotbeforeupdate
    if(isUpdate && component.getSnapshotBeforeUpdate) {
      snapshot = component.getSnapshotBeforeUpdate(previousProps, previousState)
    }

    let childComponent = rendered && rendered.nodeName, toUnmount, base

    // 如果 nodeName 是一个函数（h(nodeName, attributes)）
    // 对应 React 中的元素类型（组件类型）
    if(typeof childComponent === 'function') {
      // 设置高阶组件引用
      let childProps = getNodeProps(rendered)
      inst = initialChildComponent

      // 如果子组件存在就更新 props
      if(inst && inst.constructor === childComponent && childProps.key == inst.__key) {
        // 递归
        setComponentProps(inst, childProps, SYNC_RENDER, context, false)
      }else {
        toUnmount = inst

        component._component = inst = createComponent(childComponent, childProps, context)
        inst.nextBase = inst.nextBase || nextBase
        inst._parentComponent = component
        setComponentProps(inst, childProps, NO_RENDER, context, false)
        renderComponent(inst, SYNC_RENDER, mountAll, true)
      }
      base = inst.base
    }else {
      // 对应 React 中的 DOM 元素，非组件类型

      // cbase = component.base || component.nextBase
      cbase = initialBase

      // 销毁高阶组件的引用
      toUnmount = initialChildComponent
      
      if(toUnmount) {
        cbase = component._component = null
      }

      if(initialBase || renderMode === SYNC_RENDER) {
        if(cbase) cbase._component = null

        // diff, 返回一个真实节点存在 base
        base = diff(cbase, rendered, context, mountAll || !isUpdate, initialBase && initialBase.parentNode, true)
      }
    }

    // TODO

  }
}

/**
 * 从 DOM 中删除组件并回收它
 * @param {import('../component').Component} component The Component instance to unmount
*/
export function unmountComponent(component) {
  if(options.beforeUnmount) options.beforeUnmount(component)

  let base = component.base
  component._disable = true

  if(component.componentWillUnMount) component.componentWillUnMount()

  component.base = null

  // recursively tear down & recollect high-order component children:
  let inner = component._component
  if(inner) {
    unmountComponent(inner)
  }else if(base) {
    if(base[ATTR_KEY] != null) applyRef(base[ATTR_KEY].ref, null)
    component.nextBase = base

    removeNode(base)
    recyclerComponents.push(component)

    removeChildren(base)
  }

  applyRef(component.__ref, null)
}