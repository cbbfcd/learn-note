
// Object.assign 兼容性差的一逼啊
export function extend(obj, props) {
  for(let i in props) obj[i] = props[i]
  return obj
}

// 调用或更新 ref，具体取决于它是函数还是对象引用
export const applyRef = (ref, value) => {
  if(ref) {
    if(typeof ref === 'function') ref(value)
    else ref.current = value
  }
}

// 尽快的调用异步函数
// 使用 Promise 来安排回调（如果可用），否则就降级到 setTimeout
export const defer = typeof Promise == 'function' ? Promise.resolve().then.bind(Promise.resolve()) : setTimeout