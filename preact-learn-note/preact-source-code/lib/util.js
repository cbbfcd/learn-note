
// Object.assign 兼容性差的一逼啊
export function extend(obj, props) {
  for(let i in props) obj[i] = props[i]
  return obj
}