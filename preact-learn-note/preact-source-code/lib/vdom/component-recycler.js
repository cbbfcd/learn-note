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

  // 如果是一个 class 的话，比如 class A {}, A 其实就是其构造函数，所有的类方法都是加到 A.prototype 上的。
  if(Ctor.prototype && Ctor.prototype.render) {
    // 创建新的组件
    inst = new Ctor(props, context)
    // 构造函数式继承，初始化 inst 中的 props 和 context
    Component.call(inst, props, context)
  }else {

  }
}