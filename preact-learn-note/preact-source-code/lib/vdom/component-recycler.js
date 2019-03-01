import { Component } from '../component'

// 保留一些组件以重复使用
export const recyclerComponents = []

/**
 * 生成一个组件，规范纯函数组件和类组件的差异(PFC & Class)
 * @param {*} Ctor 要创建的组件的构造函数
 * @param {*} props 组件的初始 props
 * @param {*} context 组件的初始 context
*/
export function createComponent(Ctor, props, context) {
  let inst, i = recyclerComponents.length

  // 如果是 class（PFC 没有 render）
  if(Ctor.prototype && Ctor.prototype.render) {
    // 创建新的组件
    inst = new Ctor(props, context)
    // 构造函数式继承，初始化 inst 中的 props 和 context
    Component.call(inst, props, context)
  }else {
    /**
     * 如果是 PFC，就创建一个新的组件，让其 constructor 不再指向 `f Component`，而是 Ctor 本身
     * render 函数也是直接使用 Ctor，并返回一个 v-node
     * 这样是为了统一，不管是 PFC 还是 class 组件，都可以通过 render 返回 v-node。
     * @example
     * const Button = ({text}) => <button>{text}</button>
    */
    inst = new Component(props, context)
    inst.constructor = Ctor
    inst.render = doRender
  }

  while(i--){
    // 这里就是性能优化的地方了。
    // 如果有组件重复使用的就不用再去麻烦了，从队列中取出来用就好了。不管是 PFC 还是 class
    if(recyclerComponents[i].constructor === Ctor) {
      // 取出可以重复使用的渲染的组件实例(nextBase)，赋值给这个新的 inst 
      inst.nextBase = recyclerComponents[i].nextBase
      recyclerComponents.splice(i, 1)
      return inst
    }
  }

  return inst
}

// PFC 组件是无状态的
function doRender(props, state, context) {
  return this.constructor(props, context)
}