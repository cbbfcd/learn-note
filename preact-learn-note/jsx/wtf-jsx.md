# WTF is JSX

> [原文](https://jasonformat.com/wtf-is-jsx/)

JSX 实际上非常的简单，花费一分钟阅读本文就可以全面的了解这个有趣的模板替代方案。

标题应该改为："与 JSX 双宿双飞"。


## 附注

你声明在文件或者函数开头用以向转换器（比如： Babel）指明应该在运行时为每个节点调用的函数名称。

比如下面的例子就是告诉 Babel 为每个节点注入一个 `h` 函数调用：

```js
/** @jsx h */
```

> 当然这个写在 `.babelrc` 文件中是最好的选择

```js
{
  "plugins": [
    ["transform-react-jsx", { "pragma":"h" }]
  ]
}
```

## 转译

如果你还没有使用 babel 之类的转译工具，那么你还等什么呢，赶紧用起来啊，ES6+ 爽的一 B 啊。

babel 除了完美支持 ES6+ 之外还能够提供开箱即用的 JSX 转译，不需要你做额外的任何工作。

例如：

Before:(the code you write)

```js
/** @jsx h */
let foo = <div id="foo">Hello!</div>; 
```

After:(the code you run)

```js
var foo = h('div', {id:"foo"}, 'Hello!');  
```

**JSX 只是一种完美的语法糖**

甚至有人用它构建整个项目：[hyperscript](https://github.com/hyperhype/hyperscript)

> [👀 hyperscript 学习笔记](./hyperscript.md)

## 实现 JSX Renderer

首先我们需要定义转换代码时需要调用的 `h` 函数。

```js
function h (nodeName, attributes, ...args) {
  let children = args.length ? [].concat(...args) : null;
  return { nodeName, attributes, children };
}
```

好的，这很容易。

现在我们可以通过 `h` 函数构造出一个嵌套的 JSON 对象（一颗树）：

```js
{
  nodeName: "div",
  attributes: {
    "id": "foo"
  },
  children: ["Hello!"]
}
```

所以我们只需要一个构造真实 DOM 结构的函数：

```js
function render(vnode) {  
    // Strings just convert to #text Nodes:
    if (vnode.split) return document.createTextNode(vnode);

    // create a DOM element with the nodeName of our VDOM element:
    let n = document.createElement(vnode.nodeName);

    // copy attributes onto the new node:
    let a = vnode.attributes || {};
    Object.keys(a).forEach( k => n.setAttribute(k, a[k]) );

    // render (build) and then append child nodes:
    (vnode.children || []).forEach( c => n.appendChild(render(c)) );

    return n;
}
```

现在其实已经完成了 Virtual DOM 技术中的重要环节，构建虚拟 DOM 以及映射到真实 DOM 结构，这样做的好处是为了避免大量 DOM 操作的昂贵开销。

我们只需要比较新旧两颗虚拟 DOM 树的不同（diff）然后映射到节点上完成视图更新，就可以实现最小代价达到目的。

## 使用 JSX

我们知道 JSX 被转换为 `h（）` 函数调用。 这些函数调用创建一个简单的“虚拟” DOM 树。 我们可以使用 `render（）`函数来创建匹配的“真实” DOM 树。 这是看起来像:

```js
// JSX -> VDOM:
let vdom = <div id="foo">Hello!</div>;

// VDOM -> DOM:
let dom = render(vdom);

// add the tree to <body>:
document.body.appendChild(dom); 
```

#### Partials, Iteration & Logic: No new Syntax

总的来说就是你不会有任何负担，JSX 支持所有 JS 中的特性。

```js
// Array of strings we want to show in a list:
let items = ['foo', 'bar', 'baz'];

// creates one list item given some text:
function item(text) {  
    return <li>{text}</li>;
}

// a "view" with "iteration" and "a partial":
let list = render(  
  <ul>
    { items.map(item) }
  </ul>
);
```

#### Putting it Together

```js
const ITEMS = 'hello there people'.split(' ');

// turn an Array into list items: 
let list = items => items.map( p => <li> {p} </li> );

// view with a call out ("partial") to generate a list from an Array:
let vdom = (  
    <div id="foo">
        <p>Look, a simple JSX DOM renderer!</p>
        <ul>{ list(ITEMS) }</ul>
    </div>
);

// render() converts our "virtual DOM" (see below) to a real DOM tree:
let dom = render(vdom);

// append the new nodes somewhere:
document.body.appendChild(dom);

// Remember that "virtual DOM"? It's just JSON - each "VNode" is an object with 3 properties.
let json = JSON.stringify(vdom, null, '  ');

// The whole process (JSX -> VDOM -> DOM) in one step:
document.body.appendChild(  
    render( <pre id="vdom">{ json }</pre> )
```

[codepen demo](https://codepen.io/developit/pen/aOYywe)