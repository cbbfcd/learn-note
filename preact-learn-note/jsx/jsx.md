# 关于 JSX

JSX 只是一种语法糖，经过 babel 之类的转译器神奇的一番操作之后我们就看见了魔法的诞生。

想想我们最常习惯的写法：

```jsx
// xx.jsx
import React from 'react'

// ...
const vdom = <div id='root'><span>hello wolrd</span>this is a text</div>

console.log(vdom)
```

得到的输出结构如下（忽略一些无关的属性）：

```js
{
  key: null,
  ref: null,
  type: "div",
  props: {
    id: "root",
    children: [
      {
        key: null,
        ref: null,
        type: "span",
        props: {
          children: "hello world"
        }
      },
      "this is a text"
    ]
  }
}
```
上面毫无疑问是一颗虚拟 DOM 树，无论何种实现方式（不管是 React.createElement 或者是 Preact.h）都必须包含几个必要的特征：

1. 节点名称（随意你叫 name、type、tagName...)
2. 属性 (props, attrs...)
3. children
4. key (这个倒不是必须的，也可以包含在 props 里面)
5. ...

那么魔法来自于 babel，怎么实现的呢？

其实就是 babel 在转译 jsx 文件的时候，遇到

```jsx
const vdom = <div id='root'><span>hello wolrd</span>this is a text</div>
```
就会这样处理：

```jsx
const vdom = React.createElement(
  'div', 
  {
    id: 'root', 
    children: [
      React.createElement('span', { children: 'hello world' }),
      'this is a text'
    ]
  }
)
```

默认是使用 `React.createElement` 但是可以通过配置替换这个函数： `/** jsx h/` 或者在 `.babelrc` 文件中指定。

再深入了解，我们就得研究一下 [babel-plugin-transform-react-jsx](https://github.com/babel/babel/tree/master/packages/babel-plugin-transform-react-jsx)

```js
// https://github.com/babel/babel/blob/master/packages/babel-plugin-transform-react-jsx/src/index.js
import { declare } from "@babel/helper-plugin-utils";
import jsx from "@babel/plugin-syntax-jsx";
import helper from "@babel/helper-builder-react-jsx";
import { types as t } from "@babel/core";

export default declare((api, options) => {
  api.assertVersion(7);

  const THROW_IF_NAMESPACE =
    options.throwIfNamespace === undefined ? true : !!options.throwIfNamespace;

  const PRAGMA_DEFAULT = options.pragma || "React.createElement"; // 这里说明默认是使用 React.createElement
  const PRAGMA_FRAG_DEFAULT = options.pragmaFrag || "React.Fragment";

  const JSX_ANNOTATION_REGEX = /\*?\s*@jsx\s+([^\s]+)/;
  const JSX_FRAG_ANNOTATION_REGEX = /\*?\s*@jsxFrag\s+([^\s]+)/;

  // returns a closure that returns an identifier or memberExpression node
  // based on the given id
  const createIdentifierParser = (id: string) => () => {
    return id
      .split(".")
      .map(name => t.identifier(name))
      .reduce((object, property) => t.memberExpression(object, property));
  };

  const visitor = helper({
    pre(state) {
      const tagName = state.tagName;
      const args = state.args;
      if (t.react.isCompatTag(tagName)) {
        args.push(t.stringLiteral(tagName));
      } else {
        args.push(state.tagExpr);
      }
    },

    post(state, pass) {
      state.callee = pass.get("jsxIdentifier")();
    },

    throwIfNamespace: THROW_IF_NAMESPACE,
  });

  visitor.Program = {
    enter(path, state) {
      const { file } = state;

      let pragma = PRAGMA_DEFAULT;
      let pragmaFrag = PRAGMA_FRAG_DEFAULT;
      let pragmaSet = !!options.pragma;
      let pragmaFragSet = !!options.pragmaFrag;

      if (file.ast.comments) {
        for (const comment of (file.ast.comments: Array<Object>)) {
          const jsxMatches = JSX_ANNOTATION_REGEX.exec(comment.value);
          if (jsxMatches) {
            pragma = jsxMatches[1];
            pragmaSet = true;
          }
          const jsxFragMatches = JSX_FRAG_ANNOTATION_REGEX.exec(comment.value);
          if (jsxFragMatches) {
            pragmaFrag = jsxFragMatches[1];
            pragmaFragSet = true;
          }
        }
      }

      state.set("jsxIdentifier", createIdentifierParser(pragma));
      state.set("jsxFragIdentifier", createIdentifierParser(pragmaFrag));
      state.set("usedFragment", false);
      state.set("pragmaSet", pragmaSet);
      state.set("pragmaFragSet", pragmaFragSet);
    },
    exit(path, state) {
      if (
        state.get("pragmaSet") &&
        state.get("usedFragment") &&
        !state.get("pragmaFragSet")
      ) {
        throw new Error(
          "transform-react-jsx: pragma has been set but " +
            "pragmafrag has not been set",
        );
      }
    },
  };

  visitor.JSXAttribute = function(path) {
    if (t.isJSXElement(path.node.value)) {
      path.node.value = t.jsxExpressionContainer(path.node.value);
    }
  };

  return {
    name: "transform-react-jsx",
    inherits: jsx,
    visitor,
  };
});
```

所以我们可以自己动手写出这样一个 babel 插件。[见这里](./simple-babel-transform-jsx-plugin/readme.md)