var split = require('browser-split')
var ClassList = require('class-list')

// 不管是 node 还是浏览器环境都有 window 可以使用。
var w = typeof window === 'undefined' ? require('html-element') : window
var document = w.document

// https://developer.mozilla.org/en-US/docs/Web/API/Text
// document.createTextNode('aa') instanceof Text return true
var Text = w.Text 

function context(){

  // 用一个队列来存清除的函数
  var cleanupFuncs = []

  // 核心函数
  function h(){
    var args = [].slice.call(arguments), e = null

    function item(l) {
      var r
      function parseClass(string) {
        // mini parser 不能理解 css 转义字符。https://mathiasbynens.be/notes/css-escapes
        var m = split(string, /([\.#]?[^\s#.]+)/) // 这个正则表达式就是匹配'h1.classy'或者'div#page'这种结构
        
        // 'div#page'.split(/([\.#]?[^\s#.]+)/)
        // => ["", "div", "", "#page", ""]
        // TIPS: 正则表达式还是推荐老钱的正则课程
        if(/^\.|#/.test(m[1])) // 默认创建一个 div
          e = document.createElement('div')

        // 通过一个迭代来对匹配的数组进行操作，还是挺巧妙的。
        forEach(m, function(v) {
          var s = v.substring(1, v.length)
          if(!v) return
          if(!e) e = document.createElement(v)
          else if(v[0] === '.') ClassList(e).add(s)
          else if(v[0] === '#') e.setAttribute('id', s)
        })
      }

      if(l == null) // 这种情况不做任何操作
        ;
      else if('string' === typeof l) { // 这里要处理文本节点
        if(!e) 
          parseClass(l)
        else
          e.appendChild(r = document.createTextNode(l))
      }
      else if('number' === typeof l // 如果是数字、布尔、日期、正则，转字符串
        || 'boolean' === typeof l
        || l instanceof Date
        || l instanceof RegExp
      ) {
        e.appendChild(r = document.createTextNode(l.toString()))
      }
      else if(isArray(l)) { // 数组就递归
        forEach(l, item)
      }
      else if(isNode(l)) { // 节点直接append
        e.appendChild(r = l)
      }
      else if(l instanceof Text) { // 文本节点
        e.appendChild(r = l)
      }
      else if('object' === typeof l) { // 对象的话，遍历
        for(var k in l) {
          if('function' === typeof l[k]) {
            // 处理事件
            if(/^on\w+/.test(k)) {
              // IIFE 闭包
              (function(k, l){
                if(e.addEventListener){
                  e.addEventListener(k.substring(2), l[k], false)
                  cleanupFuncs.push(
                    function(){
                      e.removeEventListener(k.substring(2), l[k], false)
                    }
                  )
                }else { // fuck ie
                  e.attachEvent(k, l[k])
                  cleanupFuncs.push(
                    function(){
                      e.detachEvent(k, l[k])
                    }
                  )
                }
              })(k, l)
            } else {
              // observable listeners
              // 这里为什么要有这个其实可以从测试文件中看出一二。
              // 这里其实就是发布订阅模式的动态设置一些值，在测试案例中已经详细的展示了。还得参考[observable](https://github.com/dominictarr/observable)
              // https://github.com/hyperhype/hyperscript/blob/baf44a8eb44d7f7659aa656b90f7af1df76badaa/test/index.js#L101
              e[k] = l[k]()
              cleanupFuncs.push(
                l[k](function(v) {
                  e[k] = v
                })
              )
            }
          }
          // 处理样式
          else if(k === 'style') { 

          }
        }
      }
    }
  }

  h.cleanup = function () {
    
  }

  return h
}

// 这样导出支持 node 环境，并且将 context 函数挂在了 h 上
var h = module.exports = context()
h.context = context

// 工具函数：是不是节点, 不管是属性节点还是元素节点或者文本节点都包含节点名称、节点类型、节点值这些属性
function isNode(el){
  return el && el.nodeName && el.nodeType
}

// 工具函数：遍历
function forEach(arr, fn){
  if(arr.forEach) return arr.forEach(fn)
  for(var i = 0, len = arr.length; i < len; i++) fn(arr[i], i)
}

// 工具函数：是不是数组
function isArray(arr){
  return Object.prototype.toString.call(arr) === '[object Array]'
}







