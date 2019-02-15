# JavaScript 如何工作: 深入 V8 引擎 + 编写优质代码的 5 个技巧

> 译者: 波比小金刚

> 翻译水平有限，如有错误请指出。

> 原文: https://blog.sessionstack.com/how-javascript-works-inside-the-v8-engine-5-tips-on-how-to-write-optimized-code-ac089e62b12e

> ps: 最近开始整理所有的优质文章翻译集，当然如果你有好的文章请提 issue，我会找时间翻译出来。

---

第二篇文章的重点将会深入 V8 引擎内部，并且分享一些编写优质 JavaScript 代码的最佳实践。

## 概述

JavaScrip 引擎是执行 JavaScript 代码的程序或解释器。JavaScript 引擎可以由标准的解释器实现，或者通过 [JIT](https://en.wikipedia.org/wiki/JIT) 编译器（以某种形式将 JavaScript 代码编译成字节码）。

如下列表展示了流行的 JavaScript 引擎：

- [V8](https://en.wikipedia.org/wiki/Chrome_V8) -- 开源、Google出品、C++
- [Rhino](https://en.wikipedia.org/wiki/Rhino_%28JavaScript_engine%29) -- 开源、Mozilla 基金会出品、Java
- [SpiderMonkey](https://en.wikipedia.org/wiki/SpiderMonkey) -- Firefox
- [JavaScriptCore](https://en.wikipedia.org/wiki/WebKit#JavaScriptCore) -- 开源、Apple
- [KJS](https://en.wikipedia.org/wiki/KJS_(software)) -- 最初是由 Harri Porten 为 Konqueror Web 浏览器开发的
- [Chakra (JScript9)](https://en.wikipedia.org/wiki/Chakra_%28JScript_engine%29) -- Internet Explorer
- [Chakra (JavaScript)](https://en.wikipedia.org/wiki/Chakra_%28JavaScript_engine%29) -- Microsoft Edge
- [Nashorn](https://en.wikipedia.org/wiki/Nashorn_%28JavaScript_engine%29) -- Oracle的开源项目
- [JerryScript](https://en.wikipedia.org/wiki/JerryScript) -- 轻量级、loT

## V8 的诞生

V8 是 Google 的开源项目，由 C++ 编写，除了 Chrome 使用了 V8 之外，还有大名鼎鼎的 Nodejs!

![v8][img01]

V8 设计之初的目的是为了提升浏览器执行 JavaScript 代码的性能。为了获取速度，V8 并没有采用标准的解释器，而是通过把 JavaScript 代码编译成效率更高的机器码。
V8 和很多现代 JavaScript 引擎（比如：SpiderMonkey、Rhino）一样，通过 JIT 编译器把 JavaScript 代码编译成机器码。这里的主要区别就是 V8 不会产生任何的字节码或者中间代码。

## V8 有两个编译器

截止最近的 5.9 版本，V8 使用了两个编译器：

* full-codegen -- 一个简单而快速的编译器，可以生成简单但相对较慢的机器代码。
* Crankshaft -- 更复杂（JIT）的优化编译器，可以生成高度优化的代码。 

V8 引擎内部使用多个线程：

* 主线程如你所想：拉取你的代码、编译、然后执行。
* 还有一个单独的线程用于编译，因此主线程可以继续执行，而前者正在优化代码。
* 一个 Profiler 线程将告诉 runtime 哪些方法耗时太长，以便 Crankshaft 对其进行优化。
* 一些线程用于 GC

首次执行 JavaScript 代码的时候，full-codegen 登场，直接将解析后的 JavaScript 翻译为机器码而不需要任何的转换。这使得 V8 可以非常快速的开始执行机器代码。

注意！V8 不使用中间字节码，意味着它不需要解释器。

当代码运行一段时间后，profiler 线程也已经收集到了足够的数据以表示哪些方法需要被优化。

接下来，Crankshaft 从另一个线程开始进行优化，它翻译 JavaScript AST，然后用更高级的 [SSA](https://en.wikipedia.org/wiki/Static_single_assignment_form)来表示（V8 中叫做 Hydrogen）。
并且尝试优化 Hydrogen 图，大多数优化都是在这个级别完成的。

> 下面是译者的注释。

整个过程分别在两个线程执行，不阻塞主线程，一方面通过 FC 直接编译出机器码，一方面通过 Crankshaft 对热点函数进行优化。

不产生中间代码或者字节码的原因据说可能是 Google 觉得通过编译前端把 AST 翻译为中间代码还不如直接让编译后端将其翻译成机器码，一步到位。

## 内联

第一个优化点就是提前内联尽可能多的代码。内联的过程其实就是用调用函数的函数主体替换[调用函数点(call site)](https://en.wikipedia.org/wiki/Call_site) （调用函数所在的代码行）。

正是这个简单的步骤使得如下图的优化更有意义：

![step][img02]

> 下面是译者的注释。

简明扼要的说函数调用点(call site)其实就是一行代码的调用。

```java
// 未优化前 2 个 call site
a = sqr(b)
c = sqr(b)

// 同一个 call site 调用 3 次，因为是动态语言，调用函数在运行时选择，所以这里函数调用进行了3次选择
for (i in 1..3) {  
    a.call(i)  
}
```

这段 Groovy 代码在高版本引入 Call Site 优化之后会就同一个 Call Site 的方法选择结果缓存起来，如果下一次调用时的参数类型一样，则调用该缓存起来的方法，否则重新选择。

异曲同工，V8 中的内联缓存（下边会说）也是与 Call Site 密切相关的。

V8 的内联缓存实际上就是针对具有相同属性的 JavaScript 对象的通用属性访问优化，目的是跳过昂贵的属性信息查找（过程）。这比每次查找属性要快得多。

请务必阅读[这篇文章](https://zhuanlan.zhihu.com/p/38202123)

现在你大概可以理解 V8 在背后对上图所示过程进行的优化了。

## 隐藏类(Hidden Class)

JavaScript 是基于原型的语言：所以*类*和对象不是用克隆的过程创建的，JavaScript 也是一门动态语言，意味着对象在实例化之后可以轻松的增加或者移除属性。

大多数 JavaScript 解释器用类似于字典的数据结构（基于散列函数）来存储对象的属性值在内存的位置信息。
这种结构使得在 JavaScript 中检索属性的值比起在非动态类型语言（比如 Java、C#），需要更高的计算成本！
在 Java 中，所有的对象属性都是在编译之前由固定的对象布局决定的，并且无法在运行时新增或者删除（C#具有动态类型）。
结果就是，属性值（或者指向这些属性的指针）可以作为连续的缓冲（buffer）存储在内存中，并且每个缓冲区之间有固定的偏移量（fixed-offset）。
可以根据属性的类型轻松的确定该偏移的长度，而在属性类型也可以在运行时改变的 JavaScript 中，这是不可能的。

> 译者注：这里的连续缓冲的方式，我个人觉得就是指一段连续的内存空间，通过 offset 的值对应不同的属性，那么对属性的检索就变成了类似数组中的查找(O(1))，效率就很快了。

由于使用字典（结构）在内存中寻找对象属性的位置十分低效，V8 使用了不同的方式代替：隐藏类(Hidden Class)。
Hidden Class 的工作方式类似于上边提到的 Java 中的固定对象布局（classes），除非它们是运行时创建的，我们来看看它们实际上是什么样的：

```js
function Point(x, y) {
    this.x = x;
    this.y = y;
}

var p1 = new Point(1, 2);
```

一旦 "new Point(1, 2)" 被调用，V8 就会创建一个叫做 "C0" 的隐藏类(Hidden Class)

![point][img03]

尚未为 Point 定义任何属性，所以 C0 为空。

一旦第一个语句 "this.x = x" 执行（在 Point 函数内）。V8 将会基于 "C0" 创建第二个隐藏类，叫做 "C1"。
"C1" 描述了在内存中的哪个位置（相对于对象指针）可以找到属性 "x"，在这种情况下，"x" 被存在偏移 0 的位置（offset 0），这意味着如果把内存中的一个 point 对象视为连续缓冲（buffer），
在偏移为 0 的位置就对应着属性 "x"。V8 也会通过 "class transition" 来更新 "C0"，这里 "class transition" 的作用其实就是声明如果属性 "x" 加到了 point 对象上，那么隐藏类(Hidden Class)就应该切换到 "C1"，所以如下图所示，隐藏类现在是 "C1"：

![point-x][img04]

> 每次将新属性添加到对象，旧的隐藏类就会通过转换路径更新为新的隐藏类。隐藏类转换非常重要，因为它们允许同样方式创建的对象之间共享隐藏类。如果两个对象共享一个隐藏类，并且相同的属性被加到它们中，那么转换(transition) 将要确保两个对象都要接收到新的、相同的隐藏类及附带的优化代码。

在执行 "this.y = y" 的时候，上述过程将会被重复（同样，在 Point 函数内，this.x = x 之后）

一个新的隐藏类 "C2" 被创建，一个 "class transition" 被添加到 "C1" 来声明如果属性 "y" 被添加到 Point 对象（此时已包含属性 "x"），那么隐藏类应该切换到 "C2"。
并且point 对象的隐藏类被更新到 "C2":

![point-y][img05]

隐藏类转换（就是上边的 class transition）取决于属性添加到对象的顺序，我们可以看看下面的代码片段：

```js
function Point(x, y) {
    this.x = x;
    this.y = y;
}
var p1 = new Point(1, 2);
p1.a = 5;
p1.b = 6;
var p2 = new Point(3, 4);
p2.b = 7;
p2.a = 8;
```
现在，假设对于 p1 和 p2 都是用的相同的隐藏类和转换。那么，对于 p1 首先添加的是属性 "a"， 然后是 "b"，对于 p2 则是相反的顺序。
最终会在不同的转换路径作用下会产生不同的隐藏类。**那么这种情况下，以相同的顺序初始化对象属性就会优化很多，因为可以重用隐藏类。**

## 内联缓存（Inline caching）

V8 中另一种优化动态类型语言的技术叫做，内联缓存(Inline caching)。

内联函数关注的是对相同方法的调用趋向于发生在相同类型的对象上，如果想要深入了解的话请细细品味下边的拓展阅读部分。

> V8 的内联缓存实际上就是针对具有相同属性的 JavaScript 对象的通用属性访问优化，目的是跳过昂贵的属性信息查找（过程）。这比每次查找属性要快得多。

我们这里只会讨论内联缓存的一般概念。

所以，它是怎么工作的？V8 维护着一个关于当前函数调用时作为参数传入的对象的类型的缓存，并且使用该缓存信息来预测未来可能被作为参数传入的对象的类型。
如果 V8 能够做出很好的预测，那么我们就可以绕过昂贵的属性查找过程，而使用之前查找对象隐藏类存储的信息。

所以，隐藏类和内联缓存的概念有何关联？每当对一个特定的对象调用方法时，V8 引擎会执行一次对对象隐藏类的查找以确定访问特定属性的偏移量(offset)。
当同一方法成功调用两次后两者拥有相同的隐藏类，V8 会忽略掉隐藏类的查找，并且只是将属性的偏移量添加到对象指针自身。
对于该方法未来所有的调用，V8 引擎会假定其隐藏类未发生改变，并使用先前查找存储的属性偏移量直接跳到内存中该特定属性的存储地址。这大大提高了执行速度。

内联缓存也是为什么同类型对象要共享隐藏类是如此重要的原因。如果你创建两个同类型对象但是拥有不同的隐藏类（如我们之前的例子），V8 将无法使用内联缓存进行优化，因为即使是同一类型的对象，
但是不同的隐藏类意味着会为其对象属性分配不同的偏移量。

![inline-cache][img06]

> 这两个对象基本相同，但“a”和“b”属性是按不同顺序创建的。

## 编译到机器码

一旦 Hydrogen 图被优化，Crankshaft 将会降低其级别，称之为 Lithium。大多数 Lithium 实现都是特定于体系结构的。寄存器分配发生在此级别。

最后，Lithium 被编译成机器码。然后，触发 OSR：堆栈替换。当我们开始编译并且优化一个明显的耗时方法，我们可能正在运行它，V8 会慢慢的执行它来重启一个优化的版本，V8 会切换我们拥有的所有上下文（堆栈、寄存器），以便我们在执行过程中切换的优化版本。这是一项非常复杂的任务，请记住，在其它优化中，V8 已经在初始阶段内联了代码。V8 不是唯一能做到这一点的引擎。

当然，这里还有一种叫做去优化的保护机制。当 V8 不能准确预测的情况下恢复到非优化代码（优雅回退）。

## GC

对于 GC，V8 使用传统的标记清除算法清理老生代内存。在标记阶段会阻塞 JavaScript 执行。
为了控制 GC 的成本并使执行更加稳定，V8 使用了增量标记的方式：不是遍历整个堆内存，只是标记部分堆内存中的可能的对象，然后恢复主线程的执行。下一次的遍历接着从上一次停止的地方继续，所谓增量即是如此。这样就可以最大限度的降低因为 GC 任务执行带来的阻塞开销。而且清理阶段也是在单独的线程执行。

## Ignition and TurboFan

2017 年发布的 V8 5.9 中，引入了 pipeline，pipeline 的引入带来了对 JavaScript 应用更大的性能提升和显著的内存节省。

新引入的 pipeline 建立在 [Ignition](https://v8.dev/docs)、V8 的解释器、[TurboFan](https://v8.dev/docs/turbofan) 之上。

你可以点击[这里](https://v8.dev/blog/launching-ignition-and-turbofan)查看 V8 团队关于这个主题的介绍博客。

自从 V8 的 5.9 版本问世以来，full-codegen 和 Crankshaft （自2010年以来，V8采用的技术）已经废掉了。因为 V8 需要与时俱进，随着 JavaScript 语言的演进而不断的优化。

这也意味着 V8 目前拥有更简单、更易于维护的架构。

![Ignition and TurboFan][img07]

这些改进只是一个开始，新的 Ignition 和 TurboFan pipeline 为进一步的优化铺平了道路，这些优化在未来几年会提升 JavaScript 性能并缩小其在 Chrome 和 Node 中所占的空间。

好，接下来是一些总结的最佳实践：

## 最佳实践部分

1. 对象属性排序：始终以相同的顺序实例化对象属性，以共享隐藏类和随后的优化代码。

2. 动态属性：在实例化之后为一个对象添加属性会强制改变隐藏类，并且减慢为之前隐藏类优化的代码执行速度，最好的方式还是在构造函数中分配好所有的属性。

3. 方法：相同的方法重复执行比执行一次多个不同方法更快（因为内联缓存）

4. 数组：避免使用 key 不是递增数字的稀疏数组。稀疏数组是 hash table 结构，这种结构中的元素访问代价更高。此外，不要提前设置大的数组，应该根据具体场景，惰性增加。也不要随意删除数组中的元素，这样容易造成稀疏。

5. 标记值：V8 用 32bits 表示对象或者数字。它使用一个 bit 来表示它是一个对象（flag = 1）还是一个称为 SMI（SMall Integer）的整数（flag = 0），对于剩下的 31 位。 如果数值大于 31 位，V8 将对该数字进行处理，将其变为双精度并创建一个新对象以将数字放入其中。 所以尝试尽可能使用 31 位带符号的数字，以避免对 JS 对象进行昂贵的装箱操作。


## 拓展阅读

[1. 深入浅出 JIT 编译器](https://www.ibm.com/developerworks/cn/java/j-lo-just-in-time/index.html)

[2. JavaScript Just-in-time (JIT) 工作原理](https://zhuanlan.zhihu.com/p/25669120)

[3. a closer look at crankshaft, v8's optimizing compiler](https://wingolog.org/archives/2011/08/02/a-closer-look-at-crankshaft-v8s-optimizing-compiler)

[4. v8 full-codegen](http://leeight.github.io/blog/2014/06/v8-full-codegen/)

[5. 内联缓存](https://zh.wikipedia.org/wiki/%E5%86%85%E8%81%94%E7%BC%93%E5%AD%98)

[6. justjavac 的专栏](https://zhuanlan.zhihu.com/v8core)

[7. JavaScript 引擎基础：Shapes 和 Inline Caches](https://zhuanlan.zhihu.com/p/38202123)

[8. Optimizing dynamic JavaScript with inline caches](https://github.com/sq/JSIL/wiki/Optimizing-dynamic-JavaScript-with-inline-caches)

[img01]: https://cdn-images-1.medium.com/max/1600/1*AKKvE3QmN_ZQmEzSj16oXg.png
[img02]: https://cdn-images-1.medium.com/max/1600/0*RRgTDdRfLGEhuR7U.png
[img03]: https://cdn-images-1.medium.com/max/1600/1*pVnIrMZiB9iAz5sW28AixA.png
[img04]: https://cdn-images-1.medium.com/max/1600/1*QsVUE3snZD9abYXccg6Sgw.png
[img05]: https://cdn-images-1.medium.com/max/1600/1*spJ8v7GWivxZZzTAzqVPtA.png
[img06]: https://cdn-images-1.medium.com/max/1600/1*iHfI6MQ-YKQvWvo51J-P0w.png
[img07]: https://cdn-images-1.medium.com/max/1600/0*pohqKvj9psTPRlOv.png