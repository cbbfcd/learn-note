# webpack 4: import() and CommonJs

> 译者: 波比小金刚

> 翻译水平有限，如有错误请指出。

> 原文: https://medium.com/webpack/webpack-4-import-and-commonjs-d619d626b655

> ps: 最近开始整理所有的优质文章翻译集，当然如果你有好的文章请提 issue，我会找时间翻译出来。

---

> wepack4 中的一个重大改变就是针对引入非 ESM 模块（比如 CommonJS 模块）时，import() 行为的不同

事实上在使用 import() 的时候需要考虑很多场景。

但是，让我们从几个命名提示开始：

- Source: 包含 import() 表达式的模块
- Target: import() 表达式中请求的模块
- non-ESM: 没有设置 __esModule: true 的 CommonJS 或者 AMD 模块
- transpiled-ESM: 一个设置 __esModule: true 的 CommonJS 模块，因为它是从 ESM 转换而来的
- ESM: 一个普通的 EcmaScript 模块
- strict-ESM: 一个更严格的EcmaScript模块，比如 .mjs
- JSON: 一个 json 文件

需要考虑以下场景：

- (A) Source: non-ESM, transpiled-ESM or ESM
- (B) Source: strict-ESM (mjs)
- (1) Target: non-ESM
- (2) Target: transpiled-ESM (__esModule)
- (3) Target: ESM or strict-ESM (mjs)
- (4) Target: JSON

这里有一些容易理解的例子（和上边的对照起来）：

```js
// (A) source.js
import("./target").then(result => console.log(result));

// (B) source.mjs
import("./target").then(result => console.log(result));

// (1) target.js
exports.name = "name";
exports.default = "default";

// (2) target.js
exports.__esModule = true;
exports.name = "name";
exports.default = "default";

// (3) target.js or target.mjs
export const name = "name";
export default "default";

// (4) target.json
{ name: "name", default: "default" }
```

让我们从简单的开始：

> 探讨的内容实际就是 webpack4 中 import() 引入不同规范的模块的时候，其处理方式。

### A3 and B3: import(ESM)

> 就是引入一个 ESM 的情况

ESM 规范实际上覆盖了这些情况，他们是唯一的"规范"。

import() 将解析目标模块的命名空间对象。为了兼容性，会在其命名空间对象中增加一个 __esModule 标志，以供转换后的 imports 使用。

```js
{ __esModule: true, name: "name", default: "default" }
```

### A1: import(CJS)

> 比如引入一个 CommonJS 模块

我们导入一个 CommonJS 模块，webpack3 仅仅解析 module.exports 的值。而 webpack4 将会人为的为其创建一个命名空间对象，使得 import() 可以一致的解析这个命名空间对象。

CommonJs 模块的默认导出始终是 module.exports 的值，webpack 允许通过 import 从 CommonJS 模块获取属性，``` import { property } from 'cjs' ```，所以我们允许 import()

注意：这种情况下，```default``` 属性被默认的```default``` 隐藏。

```js
// webpack 3
{ name: "name", default: "default" }

// webpack 4
{ name: "name", default: { name: "name", default: "default" } }
```

### B1: import(CJS).mjs

> 在 strict-ESM 中引入 CommonJS 模块

在 strict-ESM 中，我们不允许通过 import 获取属性，只允许 non-ESM 的默认导出。

```js
{ default: { name: "name", default: "default" } }
```

### A2: import(transpiled-ESM)

> 引入一个设置 __esModule: true 的 CommonJS 模块

webpack 通过将 CJS 模块升级为 ESM 来支持 __esModule。

```js
{ __esModule: true, name: "name", default: "default" }
```

### B2: import(transpiled-ESM).mjs

> 在 strict-ESM 中引入 transpiled-ESM

在 strict-ESM 中 __esModule 不被支持。

你可以把它称为破坏，但至少它与 node.js 一致。

```js
{ default: { __esModule: true, name: "name", default: "default" } }
```

### A4 and B4: import(json)

> 引入 json

在导入 json 的时候，不管是不是 strict-ESM，都支持属性选择。json 将完整的对象作为 default 导出。

```js
{ name: "name", default: { name: "name", default: "default" } }
```

总结上边的情景，只有一种情况发生了改变。当导出对象的时候没有问题，但是 module.exports 与非对象一起使用的时候，你会遇到麻烦。

比如：

```js
module.exports = 42
```

你需要使用```default```属性：

```js
// webpack 3
42

// webpack 4
{ default: 42 }
```