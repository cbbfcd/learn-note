# 译文：图像优化（上）

> 原文：https://images.guide/

> 作者：[addy osmani](https://twitter.com/addyosmani)

> 译者：[波比小金刚](https://juejin.im/user/593df367128fe1006aecb3cf)

> 翻译水平有限，若有错误请指出

---

# 前言

## 自动化压缩图像

图像优化应该是自动化的。因为它很容易被遗忘，且最佳实践容易发生改变，而且没有通过构建管道的内容容易丢失。为了实现自动化，你可以使用 [imagemin](https://github.com/imagemin/imagemin) 或者 [libvips](https://github.com/jcupitt/libvips) 构建程序，当然，这不是唯一的，依然存在很多的替代方案。

大多数 CDN（比如 [Akamai](https://www.akamai.com/us/en/solutions/why-akamai/image-management.jsp)）以及第三方解决方案（[Cloudinary](https://cloudinary.com/)，[imgix](https://www.imgix.com/)，[Fastly’s Image Optimizer](https://www.fastly.com/io)，[Instart Logic’s SmartVision ](https://www.instartlogic.com/technology/machine-learning/smartvision)，[ImageOptim API](https://imageoptim.com/api)）都提供全面的、专业的自动图像优化解决方案。

谈钱不伤感情，你花在阅读博客或者调整项目配置上的花费大于三方服务的月费（[Cloudinary](https://cloudinary.com/) 有一个免费套餐）。如果因为成本或者延迟问题不想外包该项工作，那么上面提到的开源项目是可靠的选择。[Imageflow](https://github.com/imazen/imageflow)，[thumbor](https://github.com/thumbor/thumbor)等项目都提供自托管替代方案。

## 高效的压缩图像

至少应该使用 [ImageOptim](https://imageoptim.com/)。它可以在保持视觉质量的同时显着减小图像的大小。 Windows 和 Linux 替代品也可用。

更具体的说，就是通过 [MozJPEG](https://github.com/mozilla/mozjpeg) （q = 80 或更低，适用于Web内容） 来运行 JPEG 并且考虑支持[渐进式JPEG](https://cloudinary.com/blog/progressive_jpegs_and_green_martians)，PNG 图片通过 [pngquant](https://pngquant.org/)，SVG 则通过 [SVGO](https://github.com/svg/svgo) 进行优化。通过明确的删除元数据（--strip for pngquant）来缩小文件的体积。不要使用体积巨大的动画 GIF，使用 [H.264](https://en.wikipedia.org/wiki/H.264/MPEG-4_AVC) 视频（或者 Chrome, Firefox 和 Opera 都支持的 [WebM](https://www.webmproject.org/)）替代。如果不能，请至少使用 [giflossy](https://github.com/kornelski/giflossy) 进行优化。如果你可以分出额外的 CPU 周期并且能够忍受过慢的编码时间，在需要高于网络平均质量的场景，你可以尝试 [ Guetzli](https://ai.googleblog.com/2017/03/announcing-guetzli-new-open-source-jpeg.html)。

一些浏览器通过 Accept 请求头展示其对不同格式图片的支持度，这可用于实现针对不同浏览器提供不同的图像格式：比如对基于 Blink 的浏览器提供有损 [WebP](https://developers.google.com/speed/webp/) 图片，对其他的提供 JPEG/PNG，进而实现优化的目的。

你可以进一步优化，有很多生成和提供 [srcset](https://html.com/attributes/img-srcset/) 断点的工具，结合 [Client Hints](https://developers.google.com/web/updates/2015/09/automating-resource-selection-with-client-hints) 可以在基于 Blink 的浏览器上实现资源的自动选择。并且通过 [Save-Data](https://developers.google.com/web/fundamentals/performance/optimizing-content-efficiency/save-data/) 可以向选择 'data savings' 的用户发送更少的数据。

> 译者注：关于 Client Hints，Save-Data 的知识点可以细读文章末尾的更多参考。
> 思考：结合 Service Worker 实现图片优化处理。

> 实际上，ServiceWorker 是在浏览器中运行的客户端代理。它拦截所有传出的请求，并允许您检查，重写，缓存甚至合成响应。图像没有区别，在启用 Client Hints 的情况下，ServiceWorker 可以识别图像请求，检查提供的客户端提示，并定义自己的处理逻辑。[更多内容](https://developers.google.com/web/updates/2015/09/automating-resource-selection-with-client-hints#taking_control_over_resource_selection_with_service_worker)

图像文件的大小越小，网络体验就会更好 -- 特别是在移动设备上。在这篇文章中，我们将探讨通过现代压缩技术缩小图像尺寸的方法，同时将对图片质量的影响降至最低。

---

# 正文

## 介绍

### 图像依然是头号性能杀手

图像一般文件体积较大，因而会占用大量的带宽。根据 [ HTTP Archive](https://httparchive.org/reports/state-of-images) 的数据显示，获取一个网页所传输的数据中有 60% 都是 JPEG，PNG 和 GIF 组成的图像。截至2017年7月，平均 3.0MB 网站内容中图像占 1.7MB。

根据 [Tammy Everts](https://twitter.com/tameverts) 的研究，添加图片到页面或者使现有图片更大一点可以提高转化率。图像是网页必不可少的部分，所以制定一个有效的压缩策略显得尤为重要。

> 译者注：这里的[转化率](https://calendar.perfplanet.com/2014/images-are-king-an-image-optimization-checklist-for-everyone-in-your-organization/)，指的是转换为活跃客户的网站访问者百分比

![Per Soasta/Google research from 2016, images were the 2nd highest predictor of conversions with the best pages having 38% fewer images.][img-01]

减少图像文件的体积只是图像优化众多度量中的一种，它最终取决于实际需要的视觉保真度。

![image-optimisation-large][img-02]

*图像优化：选择正确的格式，仔细压缩并优先处理关键图像，而不是那些可以延迟加载的图像。*

常见的图像优化包括压缩，使用[```<picture>```](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/picture) / [```<img srcset>```](https://developer.mozilla.org/en-US/docs/Learn/HTML/Multimedia_and_embedding/Responsive_images) 根据屏幕大小响应地优雅降低，并调整它们的大小以降低图像解码成本。

![chart_naedwl-large][img-03]

*根据 [ HTTP Archive](https://httparchive.org/reports/state-of-images) 的数据显示，第95%位的每张图像节省了30kb*

所以，我们有足够的空间来优化图像。

![image-optim-large][img-04]

*ImageOptim 是免费的，通过现代压缩技术剥离不必要的 EXIF 元数据来减少图像大小。*

所以，如果你是一个设计师，请安装一个 [ImageOptim plugin for Sketch](https://github.com/ImageOptim/Sketch-plugin)，在导出图像时优化大小，这样会节省大量时间。

### 如何判断我的图像是否需要优化？

这里提供一个性能测试的[网站](https://www.webpagetest.org/)，可以高亮提醒你图片优化的方向！

![Modern-Image1-large][img-05]

*WebPageTest 的报告列出了哪些可以被更有效压缩优化的图片列表以及预估的优化体积*

![Modern-Image2-medium][img-06]

[Lighthouse](https://developers.google.com/web/tools/lighthouse/) 是一个很酷的工具，提供性能优化的各种最佳实践，包括了对图片的优化：建议哪些图片可以被进一步压缩或者哪些屏幕外的图片可以被延迟加载。

从 Chrome 60 开始，Lighthouse 在 Chrome DevTools 中的 Audits 面板中被支持：

![hbo-large][img-07]

你可能还熟悉其他性能审核工具，如 [PageSpeed Insights](https://developers.google.com/speed/pagespeed/insights/) 或 [Cloudinary Test by Cloudinary](https://webspeedtest.cloudinary.com/)。

### 如何选择图像格式？

正如 Ilya Grigorik 在其 [图像优化指南](https://developers.google.com/web/fundamentals/performance/optimizing-content-efficiency/image-optimization) 中指出的一样，正确的"图像格式"是视觉效果需求和功能要求的组合。你在使用矢量图像或者光栅图像吗？

![rastervvector-small][img-08]

[光栅图像](https://en.wikipedia.org/wiki/Raster_graphics)通过对矩形像素网格内的每个像素的值进行编码来表示图像。光栅图像没有**与分辨率或缩放无关**这么好的属性，当你放大光栅图像时，图形会出现锯齿并且模糊不清。因此，你可能需要在不同分辨率下保存多个版本的光栅图像，以便为用户提供最佳体验。在追求"照片级写实"场景下，应该使用光栅图像格式（例如 GIF、PNG、JPEG 或 JPEG-XR 和 WebP 等某种较新的格式）。

[矢量图像](https://en.wikipedia.org/wiki/Vector_graphics)使用线、点和多边形来表示图像。矢量图像最适用于包含简单几何形状（例如徽标、文本、图标等）的图像，能够在任何分辨率和缩放设置下呈现清晰的效果。

### 低调的 JPEG

JPEG 可能是世界上使用最广泛的图像格式，之前提到的 [ HTTP Archive](https://httparchive.org/reports/state-of-images) 抓取的网站上有 45% 的图片是 JPEG。你的手机、单反、摄像头...都支持这种格式。它是一种古老的格式，于 1992 年被首次提出，之后的时间里被不断优化和改进。

JPEG 是一种有损压缩标准方法，在保证视觉还原度的同时，尽力的丢弃一些信息以节省空间。

> 译者注：
> [1. 关于有损压缩和无损压缩](https://developers.google.com/web/fundamentals/performance/optimizing-content-efficiency/image-optimization#_6)
> 2. JPEG 不支持动画、不支持透明度，每个像素 24 位（也就是说最多可以表示 ```Math.pow(2, 24)``` 种颜色），所以在视觉保真上表现优秀，常用在 banner 图，轮播图上。

#### 选择你能接受的图片质量

JPEG 这种类型的图像格式最适合有多个颜色区域的图片，在压缩的时候需注意过度的压缩会导致光晕、色块丢失等。

![Modern-Image5-large][img-09]

所以在进行压缩的时候，需要结合实际的功能要求和视觉需求制定方案。图像质量需求高于对性能、带宽的要求的时候选择高质量的压缩方案。

### JPEG 压缩模式

JPEG 有多种不同的压缩模式，最流行的三种分别是 baseline (sequential)， Progressive JPEG (PJPEG) 和 lossless。（线性、渐进式、无损）

#### 渐进式与线性的区别

线性 JPEG （大多数图片编辑和优化工具的默认设置）以相对简单的方式进行编码和解码：从上到下。所以在图像加载较慢或者连接不稳定的时候，用户看到的是从上到下逐渐加载的。无损类型的与之lei s

![Modern-Image6-large][img-10]

渐进式 JPEG 则是把图片分成多个"扫描"，第一次"扫描"会先加载模糊、低质量的图片，后续的"扫描"会提高图片的质量。这个过程你可以想象为逐步的改进图片，不断的增添细节，最终呈现一个全画质的图像。

![Modern-Image7-large][img-11]

无损 JPEG 优化通过删除数码相机或编辑器添加的 [EXIF 数据](http://www.verexif.com/en/)，优化图像的霍夫曼表或重新扫描图像实现。[jpegtran](http://jpegclub.org/jpegtran/) 之类的工具是通过重新排列压缩数据而不会降低图像质量来实现无损压缩。[jpegrescan](https://github.com/kud/jpegrescan)，[jpegoptim](https://github.com/tjko/jpegoptim)，[mozjpeg](https://github.com/mozilla/mozjpeg) 也都支持无损 JPEG 压缩。

#### 渐进式 JPEG 的优点

PJPEG 加载的时候提供的低分辨率"预览"功能提高了感知性能。用户会感觉加载更快一点。在较慢的 3G 连接上用户可以模糊的看到图片内容从而决策下一步的计划，比从上到下加载有更好的用户体验。

![pjpeg-graph-large][img-12]

对于超过 10KB 的图像，PJPEG 与线性 JPEG 相比，带宽减少2-10％。 PJPEG 的压缩比更高，这得益于 JPEG 中的每次扫描都能够拥有自己专用的可选霍夫曼表。 现代 JPEG 编码器（例如 [libjpeg-turbo](http://libjpeg-turbo.virtualgl.org/)，MozJPEG 等）利用 PJPEG 的灵活性来更好地打包数据。

注意：为什么 PJPEG 压缩得更好？ 
线性 JPEG 一次编码一个块。 利用 PJPEG，可以将跨越多个块的类似离散余弦变换系数编码在一起，从而实现更好的压缩。

#### 谁在生产环境使用了 PJPEG?

[1. Twitter.com ships Progressive JPEGs](https://www.webpagetest.org/performance_optimization.php?test=170717_NQ_1K9P&run=2#compress_images)

[2. Facebook ships Progressive JPEGs for their iOS app](https://code.fb.com/ios/faster-photos-in-facebook-for-ios/)

[3. Yelp switched to Progressive JPEGs](https://engineeringblog.yelp.com/2017/06/making-photos-smaller.html)

很多具有密集图像的网站都使用了渐进式 JPEG。比如 [Pinterest](https://pinterest.com/)

![pinterest-loading-large][img-13]

#### 渐进式 JPEG 的缺点

渐进式 JPEG 的解码速度比线性 JPEG 更慢 - 有时长达3倍。这在具有强大 CPU 的 PC 上可能不是太大的问题，但是在动力有限的移动设备上则是个问题了。显示不完整的图层需要多次解码，这些多次传递会占用 CPU 周期。

渐进式 JPEG 也不总是更小。 对于非常小的图像（如缩略图），渐进式 JPEG 可能比其线性对应的大。 而且，对于这样的小缩略图，渐进式渲染可能不会真正提供那么多的价值。

> 译者注：性能优化实际就是在矛盾中寻找平衡点。对渐进式 JPEG 的使用也是在图片大小、CPU、网络情况等各种要求中找到一个最佳的平衡点。

注意：PJPEG（和所有 JPEG ）有时可以在移动设备上进行硬件解码。 它没有改善 RAM 影响，但它可以消除一些 CPU 问题。 并非所有 Android 设备都支持硬件加速，但高端设备支持，所有 iOS 设备也是如此。

#### 如何创建渐进式 JPEG

[ImageMagick](https://www.imagemagick.org/script/index.php), [libjpeg](http://libjpeg.sourceforge.net/), [jpegtran](http://jpegclub.org/jpegtran/), [jpeg-recompress](https://github.com/danielgtaylor/jpeg-archive) 和 [imagemin](https://github.com/imagemin/imagemin) 都支持渐进式 JPEG 格式图片的导出。

很容易融合到我们的自动化构建中：

```js
const gulp = require('gulp')
const imagemin = require('gulp-imagemin')

gulp.task('images', function(){
  return gulp.src('images/*.jpg')
    .pipe(imagemin({ progressive: true }))
    .pipe(gulp.dest('dist'))
})
```

你也可以通过图片编辑工具实现生成渐进式 JPEG。

![photoshop-large][img-14]

#### [色度（或颜色）采样](https://en.wikipedia.org/wiki/Chroma_subsampling)

人类的眼睛对颜色细节的丢失比对亮度丢失要更宽容一点。利用这一点，在进行色度采样的压缩方式的时候，降低其颜色精度可以有效的优化文件体积，在某些情况下可以达到 [15%-17%](https://calendar.perfplanet.com/2015/why-arent-your-images-using-chroma-subsampling/)的体积减少。而且不会对图像质量产生影响，并且可以用于 JPEG，还可以减少图像内存使用量。

![luma-signal-large][img-15]

由于对比度负责形成我们在图像中看到的形状，因此定义它的亮度显得非常重要。比如老旧或过滤的黑白照片可能不包含颜色，但由于亮度，还是可以像它们的颜色对应物一样详细的表述内容。因此可以看出色度（颜色）对视觉感知的影响较小。

![no-subsampling-large][img-16]

上图展示了子采样的常见样本。4：4：4，4：2：2 和 4：2：0。
    
    1. 4：4：4 没有压缩，因此颜色和亮度完全被传输。
    2. 4：2：2 水平半采样，垂直全采样。
    3. 4：2：0 采样第一行像素的一半，并忽略第二行。

通过减少色度分量中的像素，可以显着减小颜色分量的大小，最终减小字节大小。

![subsampling-large][img-17]

*可以看出在质量为 80 的情况下，色度采样策略带来的体积减少，而且在视觉上并无违和感*

色度采样也并不是适用于所有场景，比如医学图像，其色度和亮度一样很重要。包含字体的图像也会受到影响(见下图)，因为文本的不良子采样会降低其易读性。使用 JPEG 更难以压缩锐利的边缘，因为它旨在更好地处理具有更柔和过渡的摄影场景。

![Screen_Shot_2017-08-25_at_11.06.27_AM-large][img-18]

在 JPEG 规范中没有指定色度子采样的确切方法，因此不同的解码器处理它的方式不同。

比如在 PS 中使用 'Save for web' 的时候就会自动进行色度采样。当图像质量设置在 51-100 之间时，根本不使用子采样（4：4：4）。 当质量低于此值时，将使用 4：2：0 子采样。 这是将质量从 51 切换到 50 时可以观察到更大的文件大小减少的一个原因。

#### 现状

我们现在经常做的就是为不同的浏览器提供不同格式的图片！

![format-comparison-large][img-19]

这里有一个新玩意儿的列表：

[JPEG2000 (2000)](https://en.wikipedia.org/wiki/JPEG_2000) 改进版 JPEG，浏览器支持：Safari desktop + iOS
    
[JPEG XR (2009)](https://en.wikipedia.org/wiki/JPEG_XR) 支持 HDR 和宽色域空间的 JPEG 和 JPEG 2000 的替代品。 以稍慢的编码/解码速度生成比 JPEG 更小的文件。 浏览器支持：Edge + IE。

[WebP (2010)](https://en.wikipedia.org/wiki/WebP) 谷歌发布的基于块预测的图像格式，支持有损和无损压缩。 提供与 JPEG 相关的字节节省，支持透明度。缺乏色度子采样配置和渐进加载。解码时间也比 JPEG 慢。 浏览器支持：Chrome + Opera。Safari 和 Firefox 实验性支持。

[FLIF (2015)](https://en.wikipedia.org/wiki/Free_Lossless_Image_Format) 声称优于上面提到的所有图像格式，浏览器支持：无。 请注意，有一个JS浏览器内解码器。

[BPG (2015)](https://en.wikipedia.org/wiki/Better_Portable_Graphics) 由于许可问题而不太可能获得广泛的牵引力。 浏览器支持：无。 请注意，有一个JS浏览器内解码器。

[HEIF (2016)](https://en.wikipedia.org/wiki/High_Efficiency_Image_File_Format) Apple 在 WWDC 上宣布他们将探索在 iOS 上使用 JPEG 切换到 HEIF，理由是文件大小可节省 2 倍。 浏览器支持：在撰写本文时没有。 最终，Safari 桌面和iOS 11 支持。

之所以提到这些不同的图片格式，因为为不同的浏览器提供其支持的最优格式的图片已经是一种常用的优化方式。

接下来，让我们谈谈当您无法有条件地提供不同图像格式时的选项：优化 JPEG 编码器。

#### 优化 JPEG 编码器

现代 JPEG 编码器尝试生成更小，更高保真度的 JPEG 文件，同时保持与现有浏览器和图像处理应用程序的兼容性。它们避免了在生态系统中引入新图像格式或变化的需要，以便实现压缩增益。这样的两个编码就是 MozJPEG 和 Guetzli。

如何选择合适的编码器：

    1. 一般网络资源使用 MozJPEG
    2. 重视质量，不在乎编码时间的话选择 Guetzli
 
 如果需要可配置的话:      
 
 - [JPEGRecompress](https://github.com/danielgtaylor/jpeg-archive)
 - [jpegmini](http://www.jpegmini.com/) 它与Guetzli类似 - 自动选择最佳质量。 它不像Guetzli那样技术复杂，但速度更快，目标是更适合网络的质量范围。
 - [ImageOptim API](https://imageoptim.com/api) 在颜色处理上独一无二！


#### [关于 MozJPEG](https://github.com/mozilla/mozjpeg)

Mozilla 的亲儿子，号称可以减少 10% 的 JPEG 文件体积。其一些特性比如逐行扫描优化、网格量化等可以利用创建高 DPI 的图像。

```js
const gulp = require('gulp');
const imagemin = require('gulp-imagemin');
const imageminMozjpeg = require('imagemin-mozjpeg');

gulp.task('mozjpeg', () =>
    gulp.src('src/*.jpg')
    .pipe(imagemin([imageminMozjpeg({
        quality: 85
    })]))
    .pipe(gulp.dest('dist'))
);
```

![Modern-Image10-large][img-20]

可以看到还是有效的减少了文件体积。

![Modern-Image11-large][img-21]

> SSIM 是一种用于测量两个图像之间的相似性的方法，其中 SSIM 得分是一个图像的质量度量，假定目标图像（被比较的）是“完美的”。

根据我的经验，MozJPEG 是以高视觉质量压缩网络图像同时减少文件大小的一个很好的选择。对于中小尺寸的图像，我发现 MozJPEG（质量= 80-85）可以节省 30-40％ 的文件大小，同时保持可接受的 SSIM。 它的编码成本比基线 JPEG 慢，但这不是你拒绝他的理由。

#### [关于 Guetzli ](https://github.com/google/guetzli)

```js
const gulp = require('gulp');
const imagemin = require('gulp-imagemin');
const imageminGuetzli = require('imagemin-guetzli');

gulp.task('guetzli', () =>
    gulp.src('src/*.jpg')
    .pipe(imagemin([
        imageminGuetzli({
            quality: 85
        })
    ]))
    .pipe(gulp.dest('dist'))

);
```

同样带来显著的体积优化效果

![Modern-Image12-large][img-22]


# 更多参考

[1. 关于 srcset](https://segmentfault.com/a/1190000004411869)

[2. Html 5.1 使用响应式图片](https://segmentfault.com/a/1190000004943166)

[3. Client Hints 介绍](https://imququ.com/post/http-client-hints.html)

[4. PWA 时代的移动端图片优化新思路](https://segmentfault.com/a/1190000015876617)

[5. 2018 前端性能检查表](https://openweb.baidu.com/2018-qian-duan-xing-neng-jian-cha-biao/)

[6. Client Hints Demo](http://imgix.github.io/client-hints-example/)

[7. 响应式图片](https://developer.mozilla.org/zh-CN/docs/Learn/HTML/Multimedia_and_embedding/Responsive_images)


  [img-01]: https://images.guide/images/book-images/Modern-Image00-large.jpg

  [img-02]: https://images.guide/images/book-images/image-optimisation-large.jpeg

  [img-03]: https://images.guide/images/book-images/chart_naedwl-large.jpg

  [img-04]: https://images.guide/images/book-images/image-optim-large.jpg

  [img-05]: https://images.guide/images/book-images/Modern-Image1-large.jpg

  [img-06]: https://images.guide/images/book-images/Modern-Image2-medium.jpg

  [img-07]: https://images.guide/images/book-images/hbo-large.jpg

  [img-08]: https://images.guide/images/book-images/rastervvector-small.png

  [img-09]: https://images.guide/images/book-images/Modern-Image5-large.jpg

  [img-10]: https://images.guide/images/book-images/Modern-Image6-large.jpg

  [img-11]: https://images.guide/images/book-images/Modern-Image7-large.jpg

  [img-12]: https://images.guide/images/book-images/pjpeg-graph-large.png

  [img-13]: https://images.guide/images/book-images/pinterest-loading-large.png

  [img-14]: https://images.guide/images/book-images/photoshop-large.jpg

  [img-15]: https://images.guide/images/book-images/luma-signal-large.jpg

  [img-16]: https://images.guide/images/book-images/no-subsampling-large.jpg

  [img-17]: https://images.guide/images/book-images/subsampling-large.jpg

  [img-18]: https://images.guide/images/book-images/Screen_Shot_2017-08-25_at_11.06.27_AM-large.jpg

  [img-19]: https://images.guide/images/book-images/format-comparison-large.jpg

  [img-20]: https://images.guide/images/book-images/Modern-Image10-large.jpg

  [img-21]: https://images.guide/images/book-images/Modern-Image11-large.jpg

  [img-22]: https://images.guide/images/book-images/Modern-Image12-large.jpg