import { FORCE_RENDER } from './constants'
import { extend } from './util'
import { enqueueRender } from './render-queue'
import { renderComponent } from './vdom/component'


/**
 * Compoent 构造函数
 * 提供 `setState()`, `forceUpdate()` 出发重新渲染
 * @typedef {object} Component
 * @param {object} props 初始 props
 * @param {object} context 来自于父组件的 getChildContext 的上下文
 * 
 * @example
 * class MyFoo extends Component {
 *   render(props, state) {
 *     return <div />
 *   }
 * }
*/
export function Component(props, context) {
  this._dirty = true
  this.context = context
  this.props = props
  this.state = this.state || {}
  this._renderCallbacks = []
}

// 类似于 class 中定义的方法，其实质也是添加到原型上的
// 让每个继承 Component 的组件内部都可以使用 `setState`, `forceUpdate`, `render`
extend(Component.prototype, {

  /**
   * 更新组件的 state, 并且安排重新渲染
   * @param {object} state 如果是字典就会被浅 merge 进当前的 state 中，如果是一个返回字典的函数，那么该函数的参数是当前的 state 和 props
   * @param {() => void} callback 组件的 state 更新之后触发的回调函数
   * @example
   *  this.setState({}, callback)
   *  this.setState((currentState, currentProps) => ({}), callback)
  */
  setState(state, callback) {
    if(!this.prevState) this.prevState = this.state
    this.state = extend(
      extend({}, this.state),
      typeof state === 'function' ? state(this.state, this.props) : state
    )
    if(callback) this._renderCallbacks.push(callback)
    enqueueRender(this)
  },

  /**
   * 立即执行组件的同步重新渲染
   * @param {() => void} callback 组件重新渲染之后调用的回调 
  */
  forceUpdate(callback) {
    if(callback) this._renderCallbacks.push(callback)
    renderComponent(this, FORCE_RENDER)
  },

  /**
   * 接收`props`, `state` 参数，返回一个新的 v-node
   * @param {object} props 从父级组件|元素接收的 Props(eg: JSX attributes)
   * @param {object} state 组件当前的 state
   * @param {object} context 上下文对象，是最近的祖先组件 getChildContext() 的返回值
   * @returns {import('./vnode').VNode | void}
  */
  render() {}
})

