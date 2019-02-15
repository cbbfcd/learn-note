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

  function h(){

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







