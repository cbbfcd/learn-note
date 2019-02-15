# 浅谈前端模块化

前端模块化是前端工程化的基石。时下，大前端时代中对模块的运用更是无处不在。

何谓模块？且看 webpack 中定义：

> 在模块化编程中，开发者将程序分解成离散功能块(discrete chunks of functionality)，并称之为模块。
> 每个模块具有比完整程序更小的接触面，使得校验、调试、测试轻而易举。 精心编写的模块提供了可靠的抽象和封装界限，使得应用程序中每个模块都具有条理清楚的设计和明确的目的。

模块应该是职责单一、相互独立、低耦合的、高度内聚且可替换的离散功能块。

何谓模块化？

> 模块化是一种处理复杂系统分解成为更好的可管理模块的方式，它可以把系统代码划分为一系列职责单一，高度解耦且可替换的模块，系统中某一部分的变化将如何影响其它部分就会变得显而易见，系统的可维护性更加简单易得。

模块化是一种分治的思想，通过分解复杂系统为独立的模块实现细粒度的精细控制，对于复杂系统的维护和管理十分有益。模块化也是组件化的基石，是构成现在色彩斑斓的前端世界的前提条件。

## 为什么需要模块化

> 前端开发和其他开发工作的主要区别，首先是前端是基于多语言、多层次的编码和组织工作，其次前端产品的交付是基于浏览器，这些资源是通过增量加载的方式运行到浏览器端，如何在开发环境组织好这些碎片化的代码和资源，并且保证他们在浏览器端快速、优雅的加载和更新，就需要一个模块化系统，这个理想中的模块化系统是前端工程师多年来一直探索的难题。

特别是时下的前端已经今非昔比，各种前端框架和技术层出不穷，由以往的网页开发变成了系统、应用开发，代码也越发复杂，前端承担着越来越多的责任。对于代码的组织和维护，功能复用等问题，亟待一个基于工程化思考的解决方案。

为什么需要模块化，当然最主要还是咱们有需求但是咱确实没有。JavaScript 本身由于历史或者定位的问题，并没有提供该类解决方案，与之颇有渊源的 Java 却有一套 package 的机制，通过包、类来组织代码结构。

当然，我们现在也已经有了自己的且多种多样的模块化实现，本文主要还是基于 Node 中的实现探究 CommonJS 机制。

## 模块化简史

1. 最简单粗暴的方式

```js
function fn1(){
  // ...
}

function fn2(){
  // ...
}
```

通过 script 标签引入文件，调用相关的函数。这样需要手动去管理依赖顺序，容易造成命名冲突，污染全局，随着项目的复杂度增加维护成本也越来越高。

2. 用对象来模拟命名空间

```js
var output = {
  _count: 0,
  fn1: function(){
    // ...
  }
}
```

这样可以解决上面的全局污染的问题，有那么点命名空间的意思，但是随着项目复杂度增加需要越来越多的这样的对象需要维护，不说别的，取名字都是个问题。最关键的还是内部的属性还是可以被直接访问和修改。

3. 闭包

最广泛使用的还是 [IIFE](https://developer.mozilla.org/zh-CN/docs/Glossary/%E7%AB%8B%E5%8D%B3%E6%89%A7%E8%A1%8C%E5%87%BD%E6%95%B0%E8%A1%A8%E8%BE%BE%E5%BC%8F)。

```js
var module = (function(){
  var _count = 0;
  var fn1 = function (){
    // ...
  }
  var fn2 = function fn2(){
    // ...
  }
  return {
    fn1: fn1,
    fn2: fn2
  }
})()

module.fn1();
module._count; // undefined
```

这样就拥有独立的词法作用域，内存中只会存在一份 copy。这不仅避免了外界访问此 ```IIFE``` 中的变量，而且又不会污染全局作用域，通过 ```return``` 暴露出公共接口供外界调用。这其实就是现代模块化实现的基础。

4. 更多

还有基于闭包实现的松耦合拓展、紧耦合拓展、继承、子模块、跨文件共享私有对象、基于 new 构造的各种方式，这种方式在现在看来都不再优雅，请参考文末引文，就不一一赘述了。

```js
// 松耦合拓展
// 这种方式使得可以在不同的文件中以相同结构共同实现一个功能块，且不用考虑在引入这些文件时候的顺序问题。
// 缺点是没办法重写你的一些属性或者函数，也不能在初始化的时候就是用module的属性。
var module = (function(my){
  // ...
  return my
})(module || {})

// 紧耦合拓展（没有传默认参数）
// 加载顺序不再自由，但是可以重载
var module = (function(my){
  var old = my.someOldFunc
  
  my.someOldFunc = function(){
    // 重载方法，依然可通过old调用旧的方法...
  }

  return my
})(module)
```

## CommonJS

CommonJS 是以在浏览器环境之外构建 JavaScript 生态系统为目标而产生的项目，比如在服务器和桌面环境中。

出发点是为了解决 JavaScript 的痛点：

1. 无模块系统（ES6 解决了这个问题）
2. 包管理
3. 标准库太少
4. ...

CommonJS 模块的特点如下:

1. 所有代码都运行在模块作用域，不会污染全局作用域。
2. 模块可以多次加载，但是只会在第一次加载时运行一次，然后运行结果就被缓存了，以后再加载，就直接读取缓存结果。要想让模块再次运行，必须清除缓存。
3. 模块加载的顺序，按照其在代码中出现的顺序。
4. 在 Node.js 模块系统中，每个文件都视为独立的模块。

CommonJS 规范本身涵盖了模块、二进制、Buffer、文件系统、包管理等内容，而 Node 正是借鉴了 CommonJS 规范的模块系统，自身实现了一套非常易用的模块系统。
CommonJS 对模块的定义可分为三部分：模块引用（```require```）、模块定义（```exports```、```module.exports```）、模块标识（```require```参数）。

> CommonJS 的使用方式就不在此赘述了。

我们既然通过 Node 来学习模块化编程，首先我们先要了解 Node 中的模块。

### Node 中的模块类型

> 接下来的内容需要不断的在源码中找寻整个模块加载流程执行的相关逻辑，请务必结合[源码](https://github.com/nodejs/node)阅读。

1. 核心模块

  * built-in 模块：src 目录下的 C/CPP 模块。
  * native 模块：lib 目录下的模块，部分 native 模块底层调用了 built-in 模块，比如 buffer 模块，其内存分配是在 C/CPP 模块中实现的。

2. 第三方模块：保存在 ```node_modules``` 目录下的非 Node 自带模块

3. 文件模块：比如 ```require('./utils')```，特点就是有绝对或者相对路径的文件路径

盗图一张:

![module][module-img]

### 执行 ```node index.js```

大概执行流程是 ```/src/node_main.cc``` --> ```/src/node.cc``` --> 执行```node::LoadEnvironment()```

```c
// Bootstrap internal loaders
loader_exports = ExecuteBootstrapper(env, "internal/bootstrap/loaders", &loaders_params, &loaders_args);
if (loader_exports.IsEmpty()) {
  return;
}

if (ExecuteBootstrapper(env, "internal/bootstrap/node", &node_params, &node_args).IsEmpty()) {
  return;
}
```

这里出现了 ```internal/bootstrap/loaders```。我们看看该文件的头部注释内容：

```js
// This file creates the internal module & binding loaders used by built-in
// modules. In contrast, user land modules are loaded using
// lib/internal/modules/cjs/loader.js (CommonJS Modules) or
// lib/internal/modules/esm/* (ES Modules).
//
// This file is compiled and run by node.cc before bootstrap/node.js
// was called, therefore the loaders are bootstraped before we start to
// actually bootstrap Node.js. It creates the following objects:
//
// C++ binding loaders:
// - process.binding(): the legacy C++ binding loader, accessible from user land
//   because it is an object attached to the global process object.
//   These C++ bindings are created using NODE_BUILTIN_MODULE_CONTEXT_AWARE()
//   and have their nm_flags set to NM_F_BUILTIN. We do not make any guarantees
//   about the stability of these bindings, but still have to take care of
//   compatibility issues caused by them from time to time.
// - process._linkedBinding(): intended to be used by embedders to add
//   additional C++ bindings in their applications. These C++ bindings
//   can be created using NODE_MODULE_CONTEXT_AWARE_CPP() with the flag
//   NM_F_LINKED.
// - internalBinding(): the private internal C++ binding loader, inaccessible
//   from user land because they are only available from NativeModule.require().
//   These C++ bindings are created using NODE_MODULE_CONTEXT_AWARE_INTERNAL()
//   and have their nm_flags set to NM_F_INTERNAL.
//
// Internal JavaScript module loader:
// - NativeModule: a minimal module system used to load the JavaScript core
//   modules found in lib/**/*.js and deps/**/*.js. All core modules are
//   compiled into the node binary via node_javascript.cc generated by js2c.py,
//   so they can be loaded faster without the cost of I/O. This class makes the
//   lib/internal/*, deps/internal/* modules and internalBinding() available by
//   default to core modules, and lets the core modules require itself via
//   require('internal/bootstrap/loaders') even when this file is not written in
//   CommonJS style.
//
// Other objects:
// - process.moduleLoadList: an array recording the bindings and the modules
//   loaded in the process and the order in which they are loaded.
```

这个文件的注释内容说明了文件是用于初始化的时候构建 process 绑定加载 C++ 模块，以及 NativeModule 用来加载内建模块（ ```lib/**/*.js``` 和 ```deps/**/*.js``` ）。
内建模块以二进制形式编译进了 node 中，所以其加载速度很快，没有 I/O 开销。这里的 NativeModule 就是一个迷你版的模块系统（CommonJS）实现。

也提到了对于非内置模块的加载文件定义在 ```lib/internal/modules/cjs/loader.js (CommonJS Modules)``` 或者 ```lib/internal/modules/esm/* (ES Modules)```。

> 因为 node 启动的时候先执行环境加载，所以 ```internal/bootstrap/loaders``` 会先执行，创建 process 和 NativeModule，这也就是为什么在 ```lib/internal/modules/cjs/loader.js``` 文件头部直接就可以 直接使用 ```require()``` 的原因，也就是这里是使用的 ```NativeModule.require``` 去加载的内置模块。

#### ```Module.runMain()```

再回过头看看 ```internal/bootstrap/node``` 中内容：

函数执行流程：```startup()``` --> ```startExecution()``` --> ```executeUserCode()``` --> ```CJSModule.runMain()```;

这里的 ```CJSModule``` 就是从 ```lib/internal/modules/cjs/loader.js``` 通过 ```NativeModule.require``` 导入的 ```Module``` 对象。我们看看里面定义的 ```runMain()``` 方法：

[```Module.runMain()``` -- 源码点这里](https://github.com/nodejs/node/blob/master/lib/internal/modules/cjs/loader.js#L758)

```js
// internal/bootstrap/node.js
const CJSModule = NativeModule.require('internal/modules/cjs/loader');
// ...
CJSModule.runMain();


// internal/modules/cjs/loader
// bootstrap main module.
// 就是执行入口模块（主模块）
Module.runMain = function() {
  // 加载主模块 - 命令行参数.
  if (experimentalModules) {
    // 懒加载 ESM
    if (asyncESM === undefined) lazyLoadESM(); 
    asyncESM.loaderPromise.then((loader) => {
      return loader.import(pathToFileURL(process.argv[1]).pathname);
    })
    .catch((e) => {
      decorateErrorStack(e);
      console.error(e);
      process.exit(1);
    });
  } else {
    Module._load(process.argv[1], null, true);
  }
  // 处理第一个 tick 中添加的任何 nextTicks
  process._tickCallback();
};
```

我们关注这一句执行代码：```Module._load(process.argv[1], null, true);```

这里的 ```process.argv[1]``` 就是我们标题的 ```index.js```，也就是说执行 ```node index.js``` 文件的过程，其本质就是去 ```Module._load(index.js)``` 这个文件的过程。

那么，我们接着从 ```Module._load()``` 开始！

#### ```Module._load()```

在接着顺着这个执行线路梳理前，我们先要知道是如何定义 Module 对象的：

[```Module``` -- 源码点这里](https://github.com/nodejs/node/blob/master/lib/internal/modules/cjs/loader.js#L105)

```js
// Module 定义（类）
function Module(id, parent) {
  this.id = id; // 模块的识别符，通常是带有绝对路径的模块文件名
  this.exports = {}; // 表示模块对外输出的值。
  this.parent = parent; // 返回一个对象，表示调用该模块的模块。
  updateChildren(parent, this, false); // 更新函数
  this.filename = null; // 模块的文件名，带有绝对路径。
  this.loaded = false; // 返回一个布尔值，表示模块是否已经完成加载。
  this.children = []; // 返回一个数组，表示该模块要用到的其他模块。
}
```

👌，接着继续进入 ```_load``` 方法：

[```Module._load()``` -- 源码点这里](https://github.com/nodejs/node/blob/master/lib/internal/modules/cjs/loader.js#L524)

```js
// 检查对请求文件的缓存.
// 1. 如果缓存了该模块: 直接返回 exports 对象.
// 2. 如果是 native 模块: 调用并返回 `NativeModule.require()`.
// 3. 否则就创建一个新的 module，缓存起来，并返回其 exports. 
// 参数说明：分别是 *模块名称*, *父级模块（调用这个模块的模块）*, *是不是主入口文件（node index.js 中的 index.js 就是主入口文件， require('./index.js') 就不是）*
Module._load = function(request, parent, isMain) {
  if (parent) {
    debug('Module._load REQUEST %s parent: %s', request, parent.id);
  }

  // * 解析文件的路径
  var filename = Module._resolveFilename(request, parent, isMain);

  var cachedModule = Module._cache[filename];
  if (cachedModule) {
    updateChildren(parent, cachedModule, true);
    return cachedModule.exports;
  }

  if (NativeModule.nonInternalExists(filename)) {
    debug('load native module %s', request);
    return NativeModule.require(filename);
  }

  // Don't call updateChildren(), Module constructor already does.
  var module = new Module(filename, parent);

  if (isMain) {
    process.mainModule = module;
    module.id = '.';
  }

  Module._cache[filename] = module;

  // * 尝试加载该模块
  tryModuleLoad(module, filename);

  return module.exports;
};
```

模块的引入包含三个过程：

1. 路径解析
2. 文件定位
3. 编译执行

所以，在 ```Module._load()``` 函数中我们需要关注两个重要的方法调用：```Module._resolveFilename(request, parent, isMain)```， ```tryModuleLoad(module, filename)```

##### ```Module._resolveFilename()```

这个函数对应的就是上边提到的文件路径解析、定位的过程，我们梳理一下：

[```Module._resolveFilename()``` -- 源码](https://github.com/nodejs/node/blob/master/lib/internal/modules/cjs/loader.js#L569)

```js
// 省略部分代码
// 过程
// 1. 自带模块里面有的话 返回文件名
// 2. 算出所有这个文件可能的路径放进数组（_resolveLookupPaths）
// 3. 在可能路径中找出真正的路径并返回（_findPath）
Module._resolveFilename = function(request, parent, isMain, options) {
  if (NativeModule.nonInternalExists(request)) {
    return request;
  }

  var paths;

  if (typeof options === 'object' && options !== null &&
      Array.isArray(options.paths)) {
    const fakeParent = new Module('', null);

    paths = [];

    for (var i = 0; i < options.paths.length; i++) {
      const path = options.paths[i];
      fakeParent.paths = Module._nodeModulePaths(path);
      const lookupPaths = Module._resolveLookupPaths(request, fakeParent, true);

      for (var j = 0; j < lookupPaths.length; j++) {
        if (!paths.includes(lookupPaths[j]))
          paths.push(lookupPaths[j]);
      }
    }
  } else {
    paths = Module._resolveLookupPaths(request, parent, true);
  }

  // look up the filename first, since that's the cache key.
  var filename = Module._findPath(request, paths, isMain);
  if (!filename) {
    // eslint-disable-next-line no-restricted-syntax
    var err = new Error(`Cannot find module '${request}'`);
    err.code = 'MODULE_NOT_FOUND';
    throw err;
  }
  return filename;
};
```

这里需要关注的是两个函数：

1. ```Module._resolveLookupPaths(request, parent, true)``` : 获取文件所有可能路径
2. ```Module._findPath(request, paths, isMain)``` : 根据文件可能路径定位文件绝对路径，包括后缀补全（.js, .json, .node）等都在此方法中执行，最终返回文件绝对路径

[```Module._resolveLookupPaths```](https://github.com/nodejs/node/blob/master/lib/internal/modules/cjs/loader.js#L419)

找出所有可能的路径，其实也就是分几种情况去推测，最终返回一个可能路径的结果集。

1. 路径不是相对路径, 可能是 Node 自带的模块
2. 路径不是相对路径, 可能是全局安装的包，就是 ```npm i webpack -g```
3. 没有调用者的话，可能是项目 node_module 中的包。
4. 否则根据调用者(parent)的路径算出绝对路径。

[```Module._findPath```](https://github.com/nodejs/node/blob/master/lib/internal/modules/cjs/loader.js#L239)。

此分析过程其实就是每种情况都试一次，整个过程如下(盗图)所示：

![process1](http://efe.baidu.com/blog/nodejs-module-analyze/process1.png)

##### ```tryModuleLoad()```

这个函数对应的就是上面提到的编译执行的过程，我们梳理一下：

```js
// 通过 module.load 函数加载模块，失败就删除该模块的缓存。
function tryModuleLoad(module, filename) {
  var threw = true;
  try {
    module.load(filename);
    threw = false;
  } finally {
    if (threw) {
      delete Module._cache[filename];
    }
  }
}
```
这里通过 ```Module.prototype.load``` 加载模块的，我们继续看看其实现：

```js
// 省略部分代码
Module.prototype.load = function(filename) {
  debug('load %j for module %j', filename, this.id);

  assert(!this.loaded);
  this.filename = filename;
  this.paths = Module._nodeModulePaths(path.dirname(filename));

  var extension = findLongestRegisteredExtension(filename);
  Module._extensions[extension](this, filename);
  this.loaded = true;

  // ...
};
```

这里的 ```extension``` 其实就是文件后缀，```native extension``` 包含 ```.js```, ```.json```, ```.node```。其定义的顺序也就意味着查找的时候也是 ```.js -> .json -> .node``` 的顺序。
通过对象查找表的方式分发不同后缀文件的处理方式也利于后续的可拓展性。我们接着看：

```js
// Native extension for .js
Module._extensions['.js'] = function(module, filename) {
  var content = fs.readFileSync(filename, 'utf8');
  module._compile(stripBOM(content), filename);
};


// Native extension for .json
Module._extensions['.json'] = function(module, filename) {
  var content = fs.readFileSync(filename, 'utf8');
  try {
    module.exports = JSON.parse(stripBOM(content));
  } catch (err) {
    err.message = filename + ': ' + err.message;
    throw err;
  }
};


// Native extension for .node
Module._extensions['.node'] = function(module, filename) {
  return process.dlopen(module, path.toNamespacedPath(filename));
};
```

其中 ```.json``` 类型的文件加载方法是最简单的，直接读取文件内容，然后 ```JSON.parse``` 之后返回对象即可。

再来看一下加载第三方 C/C++ 模块（.node 后缀）。直观上来看，很简单，就是调用了 ```process.dlopen``` 方法。

我们重点关注对 ```.js``` 文件的处理：

执行了 ```module._compile()``` 函数，我们进入该函数：

[```Module.prototype._compile() -- 源码```](https://github.com/nodejs/node/blob/master/lib/internal/modules/cjs/loader.js#L674)

```js
Module.wrap = function(script) {
  return Module.wrapper[0] + script + Module.wrapper[1];
};

Module.wrapper = [
  '(function (exports, require, module, __filename, __dirname) { ',
  '\n});'
];

// 省略部分代码
Module.prototype._compile = function(content, filename) {
  // ...

  // 把模块的内容用一个 IIFE 包起来从而有独立的词法作用域，传入了 exports, require, module 参数
  // 这也就是我们在模块中可以直接使用  exports, require, module 的原因。
  var wrapper = Module.wrap(content);

  // 生成 require 函数
  var require = makeRequireFunction(this);

  // V8 处理字符串源码，相当于 eval
  var compiledWrapper = vm.runInThisContext(wrapper, {
    filename: filename,
    lineOffset: 0,
    displayErrors: true,
    importModuleDynamically: experimentalModules ? async (specifier) => {
      if (asyncESM === undefined) lazyLoadESM();
      const loader = await asyncESM.loaderPromise;
      return loader.import(specifier, normalizeReferrerURL(filename));
    } : undefined,
  });

  //...

  // 直接调用包装好的函数，传入需要的参数。
  result = compiledWrapper.call(this.exports, this.exports, require, this, filename, dirname);

  return result;
}

// makeRequireFunction 定义在 lib/internal/modules/cjs/helpers.js
function makeRequireFunction(mod) {
  const Module = mod.constructor;

  // 深度机制
  function require(path) {
    try {
      exports.requireDepth += 1;
      return mod.require(path);
    } finally {
      exports.requireDepth -= 1;
    }
  }

  function resolve(request, options) {
    validateString(request, 'request');
    return Module._resolveFilename(request, mod, false, options);
  }

  require.resolve = resolve;

  function paths(request) {
    validateString(request, 'request');
    return Module._resolveLookupPaths(request, mod, true);
  }

  resolve.paths = paths;

  require.main = process.mainModule;

  // 支持拓展.
  require.extensions = Module._extensions;

  require.cache = Module._cache;

  return require;
}
```

至此，编译执行的过程结束，其实我们上面展示的都属于文件模块的加载流程，对内置模块的加载流程大体相似，可在 ```NativeModule``` 模块定义的源码看出一二。

###### ```require()```

我们通过上面的 ```require``` 的工厂函数可以知道，在 ```require('./index')``` 的时候，其实调用的是 ```Module.prototype.require```

```js
Module.prototype.require = function(id) {
  validateString(id, 'id');
  if (id === '') {
    throw new ERR_INVALID_ARG_VALUE('id', id, 'must be a non-empty string');
  }
  return Module._load(id, this, /* isMain */ false);
};
```

所以，我们每次执行 ``` require ``` 之后得到的返回值其实就是执行完编译加载后返回的 ```module.exports```。

整个过程中我们已经走了一遍 Node 对 CommonJS 实现，盗图一张：

![CommonJS](https://raw.githubusercontent.com/Qbian61/Qbian61.github.io/master/resource/nodejs-module/nodejs-require.jpg)

#### 手写 CommonJS

对上面的整个加载过程熟悉之后，我们大概了解了 Node 对 CommonJS 的实现，所以可以很容易的手写一个简易版的 CommonJS：

```js
const path = require('path')
const fs = require('fs')
const vm = require('vm')

// 定义Module
function Module(id){
  this.id = id
  this.filename = id
  this.exports = {}
  this.loaded = false
}

// 定义拓展与解析规则
Module._extensions = Object.create(null)

Module._extensions['.json'] = function(module){
  return Module.exports = JSON.parse(fs.readFileSync(module.filename, 'utf8'))
}

Module._extensions['.js'] = function(module){
  Module._compile(moudle)
}

// 包装函数
Module.wrap = function(script) {
  return Module.wrapper[0] + script + Module.wrapper[1];
};

Module.wrapper = [
  '(function (exports, require, module, __filename, __dirname) { ',
  '\n});'
];

// 编译执行
Module._compile = function(module){
  const content = fs.readFileSync(module.filename, 'utf8'), filename = module.filename;
  const wrapper = Module.wrap(content)

  const compiledWrapper = vm.runInThisContext(wrapper, {
    filename: filename,
    lineOffset: 0,
    displayErrors: true,
  })

  const result = compiledWrapper.call(module.exports, module.exports, require, module, filename, dirname);

  return result
}

// 缓存
Module._cache = Object.create(null)

Module.prototype.load = function(filename){
  let extname = path.extname(filename)
  Module._extensions[extname](this);
  this.loaded = true;
}

// 加载
Module._load = function(filename) {
  const cacheModule = Module._cache[filename]
  
  if(cacheModule){
    return cacheModule.exports
  }

  let module = new Module(filename)
  Module._cache[filename] = module

  module.load(filename)

  return module.exports
}

// 简单的路径解析
Module._resolveFilename = function(path) {
  let p = path.resolve(path)
  if(!/\.\w+$/.test(p)){
    let arr = Object.keys(Module._extensions)
    arr.forEach(item => {
      let file = `${p}${item}`
      try{
        fs.accessSync(file)
        return file
      }catch(e){
        // ...
      }
    })
  }else{
    return p
  }
}

// require 函数
function require(path){
  const filename = Module._resolveFilename(path)
  return Module._load(filename)
}
```

## 参考

[1. 模块](https://webpack.docschina.org/concepts/modules/)

[2. 模块系统](https://github.com/seajs/seajs/issues/240)

[3. JS 模块化发展史](https://cherryblog.site/JavaScript-modular-programming2JSmodulardevelopmenthistory.html)

[4. Web前端模块化发展历程](http://prefer-tyl.site/2017/06/27/front-page-modular-history/)

[5. 模块化简史](https://leohxj.gitbooks.io/front-end-database/javascript-modules/modules-intro.html)

[6. 前端开发的模块化和组件化的定义，以及两者的关系？](https://www.zhihu.com/question/37649318)

[7. JavaScript模块化编程简史（2009-2016）](https://yuguo.us/weblog/javascript-module-development-history/)

[8. 汤姆大叔博客 -- 模块](http://www.cnblogs.com/TomXu/archive/2011/12/30/2288372.html)

[9. CommonJS规范](http://javascript.ruanyifeng.com/nodejs/module.html)

[10. wiki - CommonJS](http://wiki.commonjs.org/wiki/CommonJS)

[11. Node 文档 -- 模块](http://nodejs.cn/api/modules.html)

[12. Node 全局变量 -- 寸志](https://zhuanlan.zhihu.com/p/25916585)

[13. JS 模块加载](https://zhuanlan.zhihu.com/p/26477995)

[14. 图说 ESM](https://segmentfault.com/a/1190000014318751#articleHeader2)

[15. 浅析当下的 Node.js CommonJS 模块系统](https://zhuanlan.zhihu.com/p/38382637)

[module-img]: https://upload-images.jianshu.io/upload_images/3481435-504d3d2e39fc9dea.png?imageMogr2/auto-orient/strip%7CimageView2/2/w/1000/format/webp