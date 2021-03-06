# Chapter 1. CSS and Documents

## 1. 历史

- `1994`，`CSS` 首次被提出
- `1996`，`CSS1` 完成
- `1998`，`CSS2` 完成
- `2012`，`3` 个 `CSS3` 模块和 `CSS2.1` 达成了完整推荐状态
- 现在，`CSS3` 已经遍地开花

`CSS3` 是层叠样式表（`Cascading Style Sheets`）语言的最新版本，旨在扩展 `CSS2.1`。

> 从形式上来说，`CSS3` 标准自身已经不存在了。每个模块都被独立的标准化，现在标准 `CSS` 包括了修订后的 `CSS2.1` 以及完整模块对它的扩充，模块的 `level`（级别）数并不一致。可以在每个时间点上为 `CSS` 标准定义一个 `snapshots`（快照），列出 `CSS 2.1` 和成熟的模块。

`CSS3` 其实代表的是 `CSS Level 3`，我们常误解它是规范的版本号(其实代表的是 `level` 不是 `version`)，另外 `CSS3` 已经模块化了，这样的好处就是各个模块可以独立的推进，不存在拖后腿的情况啦~

拓展阅读：

> [CSS3](https://developer.mozilla.org/zh-CN/docs/Web/CSS/CSS3)

> [为什么不会有 CSS4](https://lisongfeng.cn/post/why-there-is-no-CSS4.html)

## 2. 元素

元素是文档结构的基础。比如: `p`，`div`

### 2.1 替换元素和非替换元素

元素通常有两种形式：替换的和非替换的

#### 替换元素

替换元素是指那些内容会被其它东西所替换的元素，这些东西并不直接出现在文档内容里。

比如:

```html
<img src='howdy.gif'/>
```
怎么理解呢？

如果不指定一个有效的外部图片资源路径，那么看到的将是一个破损图像的占位符，反之，图片将被放置在文档中。

类似的，`input` 元素也会被替换为单选框、复选框等，这取决于设置的 `type` 属性。

#### 非替换元素

如下就是一个非替换元素，其内容 `hi there` 被用户代理（通常是浏览器）显示在元素自身生成的盒子（`span`）中。

```html
<span>hi there</span>
```

### 2.2 元素显示角色

`CSS` 还通过两种基本类型来区分元素：**行内级(inline-level)**、**块级(block-level)**。

![block-demo](https://jack-sparrow.github.io/CSS-The-Definitive-Guide-4th-zh-CN/docs/1_CSS_and_Documents/figure1.png)

#### 块级元素

块级元素会生成（默认情况下）一个元素盒子填充父级内容区域，并且在两侧不能有其他元素，这种特点像是**断行**一样。

常见的块级元素就是 `div`，`p`。

列表项是一种特别的块级元素，左边一般有一个标记（通常是用于无序列表的项目符号和用于有序列表的数字），但是除此之外与其他块级元素别无二致。

#### 行内级元素

行内元素在文本行内生成一个元素盒子，并且不会破坏该行的流。

在 `HTML` 中，块级元素不能作为行内元素的后代；但在 `CSS` 中，对显示角色之间的嵌套没有限制。

这里结合 [display](https://developer.mozilla.org/zh-CN/docs/Web/CSS/display) 展示一个 [行内级块级嵌套例子](https://codesandbox.io/s/0q56z5ppmw)。

### 2.3 结合 CSS 和 HTML

重点就是几种文档关联 `CSS` 的方式：

1. link

```js
<link rel="stylesheet" type="text/css" href="sheet1.css" media="all">
```

> [link](https://developer.mozilla.org/zh-CN/docs/Web/HTML/Element/link)

> [备用样式表](https://developer.mozilla.org/en-US/docs/Web/CSS/Alternative_style_sheets)

2. style

```html
<style>
  h1 {color: orange;}
</style>
```

3. import

```html
<style type="text/css">
@import url(styles.css); /* @import comes first */ 
h1 {color: gray;}
</style>
```

> [@import](https://developer.mozilla.org/zh-CN/docs/Web/CSS/@import)

