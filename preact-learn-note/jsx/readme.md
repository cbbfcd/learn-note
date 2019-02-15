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

```