# JavaScript 如何工作: 引擎、运行时、调用栈概述

> 译者: 波比小金刚

> 翻译水平有限，如有错误请指出。

> 原文: https://blog.sessionstack.com/how-does-javascript-actually-work-part-1-b0bacc073cf

> ps: 最近开始整理所有的优质文章翻译集，当然如果你有好的文章请提 issue，我会找时间翻译出来。

---

JavaScript 越来越流行，在前端、后端、hybrid apps、嵌入式设备开发等方向上都有它活跃的身影。

这篇文章是 How JavaScript Works 系列的开篇，该系列的文章旨在深入挖掘 JavaScript 及其实际的工作原理。我们认为了解 JavaScript 的构建块及其共同作用，可以帮助我们写出更优雅、更高效的代码和应用。

正如 [GitHut stats](https://githut.info/) 所展示的一样，JavaScript 各方面的统计数据都是棒棒哒，顶多也就在个别统计项上落后了其他语言那么一丢丢。

![ GitHut stats][img01]

如果项目深度依赖 JavaScript，这意味着开发者需要对底层有极其深入的了解，并利用语言和生态提供的一切东西来构建出色的应用。

然而，事实上，很多开发者虽然每天都在使用 JavaScript，却对其背后发生的事情一无所知。

## 概述

几乎每个人都听说过 V8 引擎的概念，大多数人也都知道 JavaScript 是一门单线程语言或者知道它是基于回调队列的。

在这篇文章中，我们将详细的介绍这些概念并且解释 JavaScript 实际的运行方式，通过对这些细节的了解，你可以写出更好、无阻塞的应用。

如果你是一名 JavaScript 新手，这篇文章将帮助你理解为什么 JavaScript 和其它语言对比起来显得那么"奇怪"。

如果你是一名老司机，希望能够为你带来一些对 JavaScript 运行时的新思考。

## JavaScript 引擎

说起 JavaScript 引擎，不得不提的就是 Google 的 V8 引擎，Chrome 和 Nodejs 内部也是使用的 V8。这里有一个简单的视图：

![ simplified view for v8][img02]

引擎主要包含两个组件：

- Memory Heap: 内存分配发生的地方
- Call Stack: 代码执行时栈帧的位置

## 运行时

几乎所有的开发者都使用过浏览器中的 APIs （比如: setTimeout），然而，引擎并不提供这些 API。

那么，这些 API 从何而来？

事实上，这是一个很复杂的问题。

![ simplified view for runtime][img03]

所以，除了引擎之外还有很多内容，包括我们调用的浏览器提供的 Web APIs，比如：DOM, AJAX, setTimeout 等。

然后，还有大名鼎鼎的事件循环和回调队列。

## 调用栈

JavaScript 是一门单线程语言，只有一个 Call Stack，因此一次也就能做一件事。

Call Stack 是一种数据结构，记录程序的位置。如果我们进入函数，就把它放在堆栈的顶部，如果我们从函数返回，就将其从堆栈顶部弹出。

我们看一个例子：

```js
function multiply(x, y) {
    return x * y;
}

function printSquare(x) {
    var s = multiply(x, x);
    console.log(s);
}

printSquare(5);
```

引擎开始执行这段代码的时候，调用栈是空的，接着的步骤如下：

![call stack 01][img04]

对于调用栈中的每一个条目，我们叫做"栈帧"（Stack Frame）

这正是异常抛出时堆栈追踪的构造方式 - 基本上就是异常发生时调用栈的状态。

我们看看如下代码：

```js
function foo() {
    throw new Error('SessionStack will help you resolve crashes :)');
}

function bar() {
    foo();
}

function start() {
    bar();
}

start();
```

在浏览器执行（假设代码在 foo.js 文件），可以在控制台看到如下堆栈追踪信息：

![call stack 02][img05]

"爆栈" - 当达到调用栈的最大大小的时候发生。而且这很容易发生，比如下面的这段牛逼的递归调用代码：

```js
function foo() {
    foo();
}

foo();
```

当引擎开始执行这段代码的时候，首先调用函数 "foo"，但是这个函数接着递归的调用自己，并且没有终止条件。相同的函数不断的加到调用栈中，如下：

![call stack 03][img06]

当调用栈中函数的数量超过其阀值的时候，浏览器决定动手了。浏览器会抛出一个如下的异常信息！

![call stack 04][img07]

单线程上运行一个程序，对比在多线程环境下的运行简单很多，因为不需要处理多线程运行下的一些复杂场景，比如：死锁。

但是单线程也会很坑的，既然只有一个调用栈，那么执行一个很慢很慢的计算的时候，你就会崩溃了。

## 并发与事件循环

如果你的调用栈中存在一个需要大量时间处理的函数的时候，会发生什么？假如你想在浏览器端通过 JavaScript 进行复杂的图像转换。

你可能会问 - 这也算是一个问题？问题就是当调用栈有函数在执行的时候，浏览器实际上不能做别的任何操作 - 它会被阻止。
这意味着浏览器不能渲染，不能执行别的代码，它被卡住了。如果你需要流畅的 UI 体验，那就很糟糕了。

这还不是唯一的问题，一旦浏览器遇到很多很多的任务需要在调用栈中处理的时候，可能很长的一段时间内会停止响应。这个时候大多数浏览器就会采取行动，问你是否需要终止网页。

![event loop 01][img08]

这并不是最好的用户体验，是吧？

所以，我们如何处理繁重的代码而且不阻塞渲染或者不使浏览器停止响应呢，答案就是异步回调。

这将在本系列文章的第二部分详细阐述。


[img01]: https://cdn-images-1.medium.com/max/1600/1*Zf4reZZJ9DCKsXf5CSXghg.png
[img02]: https://cdn-images-1.medium.com/max/1600/1*OnH_DlbNAPvB9KLxUCyMsA.png
[img03]: https://cdn-images-1.medium.com/max/1600/1*4lHHyfEhVB0LnQ3HlhSs8g.png
[img04]: https://cdn-images-1.medium.com/max/1600/1*Yp1KOt_UJ47HChmS9y7KXw.png
[img05]: https://cdn-images-1.medium.com/max/1600/1*T-W_ihvl-9rG4dn18kP3Qw.png
[img06]: https://cdn-images-1.medium.com/max/1600/1*AycFMDy9tlDmNoc5LXd9-g.png
[img07]: https://cdn-images-1.medium.com/max/1600/1*e0nEd59RPKz9coyY8FX-uw.png
[img08]: https://cdn-images-1.medium.com/max/1600/1*WlMXK3rs_scqKTRV41au7g.jpeg