# 加载和执行

这一部分的内容主要是探讨浏览器线程的阻塞。

核心在于我们要试图去了解浏览器的部分工作原理。

比如我们熟知的 Chrome 浏览器，就是一个多进程型的浏览器，打开的每一个标签页都是一个单独的进程。

在同一个进程中的多个线程是共享内存与资源的。一般来说，浏览器内核中会有如下常驻线程（其实就是几个大名鼎鼎的引擎所在的线程）：

1. GUI 渲染线程（呈现引擎所在线程 - webkit）：负责显示请求的内容。如果请求的内容是 HTML，它就负责解析并显示 HTML 和 CSS 内容，在回流重绘时触发。
2. JavaScript 引擎线程(JavaScript 引擎所在线程 - V8)：比如 V8，其功能就是解析和执行 JavaScript 代码。
3. 定时器触发线程
4. 事件触发线程
5. 异步 http 请求线程
6. ...

说这么一大圈的目的其实是为了能够从根本上去理解老生常谈的脚本阻塞问题的原由。那就是**负责渲染的线程和 JavaScript 引擎所在线程被设计为互斥的！**

> 这样设计的原由其实就是脚本执行和 DOM 解析并行的话可能导致冲突，比如 JS 修改 DOM。

也就是说当线程切换到 JavaScript 引擎线程的时候，渲染引擎所在的线程就被挂起了！GUI 更新会被保存在一个队列中等到 JavaScript 引擎空闲时立即被执行。

换成常见的说法就是 **script 脚本在执行的时候会阻塞 DOM 树解析、渲染、延迟 DOMContentLoaded 事件触发！**

而对应的资源，比如脚本、图片、样式表等，其加载过程是由一个单独的线程负责，与上文所说的渲染线程和 JavaScript 引擎线程是可以并行进行的，据说 Chrome 浏览器最大并发下载量是 6 个，如果是不同域名下的话可以成正比增加，但是要考虑到 DNS 解析的优化，需要找到一个平衡点，并且虽然是并发的下载，执行的时候还是按照原来的依赖顺序（JS 的执行要等待位于其前面的 CSS 和 JS 加载、执行完）。先加载完成的资源，如果其依赖还没加载、执行完，就只能等着。

> 因为加载线程是单独的，可以与渲染引擎并行，所以样式表、图片等资源文件的下载不会暂停 DOM 解析。浏览器会并行地下载这些文件，但通常会限制并发下载数。

但是，尽管浏览器已经有了这样的并发加载优化，**浏览器在加载脚本资源的时候依然还是会阻塞其他加载线程和渲染线程的**，所以就有第二种常见说法：

**script 脚本加载过程也是阻塞的源头之一！**

还有一个有趣的问题就是关于 CSS 的阻塞！

首先引用一些结论：

- 不会阻塞 DOM 树的解析
- 会阻塞 DOM 树的渲染
- 会阻塞后面 JS 语句的执行，间接影响了 DOMContentLoaded 事件的触发。
- 会阻塞图片的解码、绘制。

> CSS 属于 render blocking resource，无论外链或内联，都会阻塞渲染树的渲染（不会影响 DOM 解析）。一般情况下，CSS 会延迟脚本执行和 DOMContentLoaded 事件

![神图镇楼](https://www.zhoulujun.cn/zhoulujun/uploadfile/images/2018/0518/20180518141736595715677.jpg)

从上图可以看出 CSS 的加载解析过程与 DOM 的解析过程是并行的，所以不会影响到 DOM 的解析过程，但是合并成 Render Tree 是需要先构建好 CSSOM 的，所以会阻塞 DOM 树的渲染。

JS 的执行，需要等待位于它前面的 CSS 加载（如果是外联的话）、执行完成，因为 JS 可能会依赖位于它前面的 CSS 计算出来的样式。

## DOMContentLoaded

> 它的触发时机是：加载完页面，解析完所有标签（不包括执行 CSS 和 JS），并如规范中所说的设置 interactive 和执行每个静态的script标签中的JS，然后触发。

> 当初始的 HTML 文档被完全加载和解析完成之后，DOMContentLoaded 事件被触发，而无需等待样式表、图像和子框架的完成加载。

> 如果页面中没有 script 标签，DOMContentLoaded 事件并没有等待 CSS 文件、图片加载完成。

> 如果页面中静态的写有 script 标签，DOMContentLoaded 事件需要等待 JS 执行完才触发。而 script 标签中的 JS 需要等待位于其前面的 CSS 的加载完成。 

也就是说脚本、脚本之前的 CSS 是会延迟 DOMContentLoaded 事件触发的！其他的都不会啦～

## defer & async

一图胜千言！

![defer&async](https://image-static.segmentfault.com/215/179/2151798436-59da4801c6772_articlex)

**相同点**

- 加载文件时不阻塞页面渲染
- 对于 inline 的 script（内联脚本）无效
- 使用这两个属性的脚本中不能调用 document.write 方法
- 有脚本的 onload 的事件回调

**不同点**

- html4.0 中定义了 defer；html5.0 中定义了 async
- 兼容性
- defer 不会改变 script 中代码执行顺序，而多个 async-script 的执行顺序是不确定的。
- 每一个 async 属性的脚本都在它下载结束之后立刻执行，同时会在 window 的 load 事件之前执行。所以就有可能出现脚本执行顺序被打乱的情况；每一个 defer 属性的脚本都是在页面解析完毕之后，按照原本的顺序执行，同时会在 document 的 DOMContentLoaded 之前执行。

> 如果 script 标签中包含 defer，那么这一块脚本将不会影响 HTML 文档的解析，而是等到 HTML 解析完成后才会执行。而 DOMContentLoaded 只有在 defer 脚本执行结束后才会被触发。即：整个 document 解析完毕且 defer-script 也加载完成之后（这两件事情的顺序无关），会执行所有由 defer-script 加载的 JavaScript 代码，然后触发 DOMContentLoaded 事件。defer 不会改变 script 中代码执行顺序

> 如果 script 标签中包含 async，则 HTML 文档构建不受影响，不需要等待 async-script 执行。但是，async-script 加载完成后，就会立即执行！如果页面还是没有解析完成，就会停下来（阻塞页面）等此脚本执行完毕再继续解析。async-script 可能在 DOMContentLoaded 触发之前或之后执行，但一定在 load 触发之前执行。而且：多个 async-script 的执行顺序是不确定的。

## 解决方案

1. 对于 CSS 可以采用媒体查询

```js
<!-- 始终阻塞渲染 -->
<link href="style.css" rel="stylesheet">

<!-- 打印内容时使用，不阻塞渲染 -->
<link href="print.css" rel="stylesheet" media="print">

<!-- 只有满足条件时阻塞渲染 -->
<link href="other.css" rel="stylesheet" media="(min-width: 40em)">
```

2. 动态注入外链脚本。

3. 动态注入外链样式表。

⚠️ 注意这里都得是外联的，才会无阻塞，如果是动态注入内联得依旧是阻塞的。

动态创建得元素默认是 async 的！

```js
var script=document.createElement("script");
console.log(script.async);//true
```

4. defer async

5. 脚本放在 body 最下边

6. XMLHttpRequest：Http请求也是另一个线程来处理，与渲染和执行线程并行。

## readyState

主要是三个不同的阶段

1. loading
2. interactive
3. complete

第二阶段，可交互阶段，大多情况就是 DOMContentLoaded 触发时间。

更多还是参考MDN。

## 参考

[1. 浏览器的工作原理：新式网络浏览器幕后揭秘](https://www.html5rocks.com/zh/tutorials/internals/howbrowserswork/#The_browser_high_level_structure)</br>
[2. 进程与线程](https://imweb.io/topic/58e3bfa845e5c13468f567d5)</br>
[3. DOMContentLoaded MDN](https://developer.mozilla.org/zh-CN/docs/Web/Events/DOMContentLoaded)</br>
[4. 从浏览器多进程到JS单线程，JS运行机制最全面的一次梳理](http://www.dailichun.com/2018/01/21/js_singlethread_eventloop.html)</br>
[5. css加载会造成阻塞吗？](https://juejin.im/post/5b88ddca6fb9a019c7717096)</br>
[6. JS、CSS以及img对DOMContentLoaded事件的影响](http://www.alloyteam.com/2014/03/effect-js-css-and-img-event-of-domcontentloaded/#prettyPhoto)</br>
[7. 页面渲染](https://tate-young.github.io/2018/02/10/html-how-browsers-work.html#%E9%98%BB%E5%A1%9E%E6%B8%B2%E6%9F%93)</br>
[8. 你不知道的 DOMContentLoaded](https://zhuanlan.zhihu.com/p/25876048)</br>
[9. readyState MDN](https://developer.mozilla.org/zh-CN/docs/Web/API/Document/readyState)</br>
