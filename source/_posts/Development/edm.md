---
title: 利用Table布局实现EDM设计
date: '2023/03/20 08:00:00'
alias:
  - post/Development/edm/index.html
  - post/development/edm/index.html
---

在实习的时候被安排了EDM编写，个人也是第一次接触这个领域。本来以为就是简单的HTML编写，后来发现EDM-HTML有它独特的地方，如邮件客户端奇特的渲染引擎限制，和普通HTML5网页不同的布局设计等。这里记录我在编写EDM时的一些想法。

<!-- more -->

## 简述EDM

**EDM（Electronic Direct Mail marketing）** 指的是电子直邮营销，是一种通过电子邮件向特定受众发送商业信息的营销方式。EDM营销可以包括广告、促销、新闻、事件邀请等多种形式的电子邮件。通过EDM，企业可以向目标受众发送具有针对性的信息，提高品牌知名度和销售转化率。同时，EDM营销也可以进行数据分析，了解邮件打开率、点击率和转化率等关键指标，为企业决策提供重要的参考。

因为我所在的部门是国际事业部，国外的营销策略和国内有很大不同，像国内可能更注重IM平台的宣发（如微信、QQ等），而国外则使用邮箱更多一些。举个例子，现在打开你的邮箱，给你发广告的肯定都是一些国外的公司像Twitter、Steam这种，而国内的基本都不会发广告邮件。

因此，做国外的推广和宣发工作，EDM编写就是非常关键的一环。

![](https://images.unsplash.com/photo-1522542550221-31fd19575a2d?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=1470&q=80)

### EDM编写的特点

由于EDM-HTML的宿主环境是各邮件客户端而不仅仅是浏览器（虽然也有网页邮箱这样的存在），因此EDM最突出的问题就是**兼容性问题**。如果你发的广告到客户的手机上无法正常显示，那别说推广产品了，对企业的印象分直接跌落谷底。

与公司同事交流后，我总结了EDM编写需要遵守以下规则：

- 使用`<table>`和`table-layout`进行页面布局，而不是常用的`flex`和`grid`布局
- 不应使用类选择器，而应使用**内联样式**（这和传统Web开发完全背道而驰）
- 不支持绝对定位（如`top`、`left`等属性）
- 由于设计稿的需求比较细化，移动端和桌面端应使用独立的代码（使用**媒体查询**和`display: none`切换），而不是共用一套响应式代码

## `<table>` 标签

`<table>`表示表格数据, 即在一个由包含数据的行和列组成的二维表格中呈现的信息。最正统的用法肯定是展示一个数据表格，但由于`<td>`和`<th>`接收任何流式内容的特点，在EDM一般作为`flex`和`grid`的替代品存在。

> _之前都没怎么接触过`<table>`这个语义化的表格标签，遇到类似的情况都是直接使用`grid`布局解决。_

### 允许的内容

下面这些语义化标签实际上都是**可选的**，表格中可以直接`<tr>`起手，用`<td>`定义元素即可。

- `<caption>`标签展示一个表格的**标题**，常作为第一个元素出现，同时显示在最前面，但这并不是硬性规定的，因此**可以出现在任何位置**，且可以被CSS样式化。
- `<colgroup>`标签用于定义表格中的列（簇）。
  - 子节点接收`<col>`标签来具体定义列簇
    - `span`属性用于指定一个列簇有几列，从左到右计数，默认值为`1`
    - `class`属性为列簇的所有元素附上指定的类选择器
  - 注意这个标签仅用于表格元素而非CSS（虽然可以给class）
- `<thead>`标签定义了一组定义表格的列头的行，接收>=0个`<tr>`元素
- `<tbody>`标签封装了一系列表格的行（`<tr>`），是表格的主要组成部分
- `<tfoot>`标签元素封装了一系列表格的行

### `<tr>`标签及其内容

`<tr>`标签是表格的灵魂，它定义了表格一行的内容，接收`<td>`和`<th>`作为子节点内容，二者可以同时出现。

注意：`<td>`和`<th>`可以**接受任何流式内容**，这也是可以它可以作为EDM布局的基础所在。

- `<th>`标签定义表格内的表头单元格，由`scope`和`headers`属性精准定义
  - `headers`属性：包含了一个空间分隔的字符串的列表，每个与其他`<th>`元素相关联的`id` 属性一一对应。
  - `scope`属性：定义了该表头关联的单元格
    - `row`: 表头关联一行中所有的单元格。
    - `col`: 表头关联一列中所有的单元格。

#### 支持的属性（HTML Attribute）

- `align`：指定每个单元格内**水平对齐方式**，支持`left`, `center`, `right`, `justify`（两侧对齐）
- `bgcolor`：指定单元格背景颜色
- `valign`：指定每个单元格内**垂直对齐方式**，支持`baseline`, `middle`, `top`

### 使用CSS自定义Table布局

#### table-layout

{% note info  %}此部分内容还在编辑中{% endnote %}

#### 媒体查询（@media）

{% note info  %}此部分内容还在编辑中{% endnote %}

## EDM编写过程中存在的问题

EDM虽然也算是HTML编写的一个分支，但是其编写体验可谓是天差地别。前端对于我来说最大的特点就是“所见即所得”的开发感受，但在EDM编写中这种感受被另一种强大的挫败感完全盖过了。

经过思考后，我感觉所谓的挫败感来源主要在于以下几方面：

- 项目的**可读性**和**可维护性差**
- **非响应式设计**，对桌面端（big-screen）和移动端（mobile）需要分别写两份代码
- 未知的**兼容性问题**，很难找到问题所在

因此，我根据上述问题从以下几个角度分析，并**尝试提出我自己的EDM框架作为解决方案**。

### 代码可读性

关于EDM我最大的槽点就是代码可读性了，我第一次打开EDM的时候我直接惊掉下巴，居然还有这么原始的方式。作为实际投入生产的HTML自然不必在意可读性，只要稳定就好，但在编写过程中还是尽量应该保持简洁的工程化属性（就像框架项目源码和webpack最终打包结果一样）。

- **代码风格不统一**：可能公司里大部分EDM都是由实习生完成的，导致整个组件的风格很不统一，能明显看出是从两个人写的组件里摘到了一起：如同一个`padding`属性，在A组件里可能放在`<td>`标签里，而在B组件里就跑到了里面的`<span>`或`<img>`标签里。
- **内联样式导致代码膨胀**：一个简单的EDM页面由于每个元素的内联样式和移动端+桌面端两套代码，代码行数**快速膨胀至几千行**，任何人看到几千行HTML的时候都是崩溃的吧，特别是这还是一个需要维护和复用的页面
  - **大量冗余样式**：由于组件负责人不同、复用方式是复制粘贴且没有代码审查机制，**不同组件之间甚至组件内部**都会出现大量冗余的内联样式（如明明父组件声明了样式，子组件重复声明了一次；或之前粘贴的组件带了一些样式，修改时直接在后面添加而没有删除之前的样式等等），这不仅增加了代码阅读难度，还增加了出现BUG的可能性（优先级混乱）
  - **双端重复代码多**：桌面端和移动端大部分的代码都是一样的，编写时大多就是复制粘贴然后微调样式，然后继续复制粘贴，最后直接导致代码量翻倍，增加了维护成本

> **个人建议**：
>
> - 搭建测试环境，允许模拟不同环境测试兼容性，或者直接通过Code-Review来判断兼容性（语法黑名单或白名单）
> - 支持个人编写测试脚本来快速测试功能（如显示效果、资源加载、链接、表单测试），可以参考开源的成熟HTML测试方案
> - 工程化管理（后文会提到），并使用组件复用、外联CSS等特性，最后编译生成EDM-HTML（与测试搭配使用）

### 组件和样式复用

和其他的前端项目一样，不同的EDM页面之间其实有**相当大一部分的组件和样式是复用的**，而现在的复用方式是原始的**复制粘贴然后修改**，这在编写和修改时都非常不便。

因此对EDM实现**工程化管理**是这里要讨论的重中之重，下面提出我的EDM框架方案（这里参考了MJML）：

> 由于EDM重在单页面效果呈现，不存在像Vue或React这样的数据流管理和数据绑定需求，面向EDM的框架更应注重**兼容性、样式管理和组件复用与微调**这三个方面，主要特点在于：
>
> - 使用开发者熟悉的标签语法而尽量避免自创，降低上手成本
> - **外联样式表、类选择器复用和组件复用**三大件保证了项目可维护性和可读性，提高了开发效率
> - 编译器配合代码审查（工程化后更易实现审查和测试）保证了最终生成代码的一致性，最大程度地避免了代码冗余

- 语法为**现代HTML5网页语法的子集+部分语法补充**，支持部分现代特性，编译后自动映射到`<table>`、`<tr>`和`<td>`标签，下面是一些例子：
  - 使用`row-flex`的`<div>`标签映射成一个`<tr>`标签，其`align`等属性也会对应映射为单元格属性
  - 使用`grid`实现的`<div>`标签映射成`<table>`和媒体查询的结合，自动生成不同场景下的表格，使用`display: none`切换（这些工作都会自动完成，编写时不用考虑）
  - 普通流向的`<div>`则会被拆解成若干`<tr>`标签（最外层则会映射为`<table>`），直至显示元素本身被包裹在`<td>`标签中
- 利用媒体查询，对于**响应式设计**应支持像素级的调整，以及针对指定屏幕大小的样式（如移动端单独设置字体），尽量避免需要编写两份雷同的HMTL代码的情况，以下是一些例子：
  - 如需要定义某个组件在特定设备下的特定效果（如移动端的字体可能不同、组件间距或页边距不同），可以使用媒体查询给对应的class赋予特定样式（注意和上文中`grid`实现进行区分，这里主要作用是**微调样式**，虽然最后都会根据断点合并成一个`<table>`）
  - 在编译时，编译器会根据断点数量（统计各处所有断点数量，因此尽量使用统一的断点，否则可能生成多于两份`<table>`）生成若干份不同的`<table>`，在每个`<table>`内实现独立的样式，并使用`display: none`切换
  - 若必须为不同端编写不同页面，框架也提供了`<responsive>`语法糖
    - 必须且只能接收至少一个`<breakpoint>`子标签，其他标签是非法的
    - 子标签`<breakpoint width="? px">`接收任何流元素，`width`属性留空则默认为0，按顺序对应`(prev-breakpoint, width)`的范围，在编译时会对应映射到对应的`<table>`中
    - 行为与定义多个`<div>`和对应class，并用媒体查询控制`display`属性是一致的
- 完整**支持外联样式表和类选择器**，支持样式表交叉管理（直接使用`<link>`标签管理），**这里并不打算兼容ID选择器**
  - 支持完整的CSS层级系统（内联、`<style>`标签和`<link>`外联样式表）和优先级系统
  - Dev模式下查看效果无需编译，Prod模式下会根据优先级规则检查元素的所有样式和组件树，最终为每个元素生成一份无冗余的内联样式
  - 对于不兼容的CSS样式，编译器应直接予以禁用和警告
  - 支持断点定义语法糖防止重复生成断点`<table>`：使用`@value val`直接定义断点，在`@media`和HTML中的`<breakpoint>`标签中（需使用`"{@val}"`语法来定义CSS寻址）均可使用
- 对于某些重复使用的组件，比如`logo-header`、`quiz`或`footer`等等，可以**新增一些include相关语法**如`<component src="..." />`来**在HTML中引入组件化开发的特性**，一方面避免了大量的复制粘贴，一方面可以做到一次修改全局应用（配合Git分支可以做到不同版本并行）
  - 组件Wrapper标签`<component>`除了`src`属性还应支持`style`内联样式和`class`类选择器，来定义组件在页面内与其他组件的交互样式（如`padding`等）
  - 无论在Dev模式还是Prod模式，编译器对`<component>`的行为都应是像C/C++预处理器那样进行文本替换，在Prod模式下还要做额外的内联样式计算

### 项目管理和开发环境

在现在的项目框架（单个HTML+原始内联复用）模式下，公司里采用按**文件夹+文件名**来组织EDM文件，虽然我个人更倾向于使用**Git分支管理**，即一个分支里包含需要使用的所有**参考资料（可以复制修改的组件）**，但这二者我个人觉得并没有什么本质上的区别和优劣之分。

但在新的EDM工程框架下，我认为Git版本管理是必须的：

- 多人可能共享一份组件库和样式库，对于多人协作来说Git的版本和分支管理尤为必要
- 不同EDM可能会使用不同版本的组件，为了避免新建组件造成不必要的冗余，可以使用切换分支的方法
- Git仓库可以设置Hook来实现Commit时的代码审查和兼容性检查

#### VSCode环境

由于框架还是提供了一些额外的标签语法和一些限制，暂且定义一种.edm的新格式，并用VSCode插件和NPM包来完善开发体验，最终生成一个可用的脚手架。

> 这里参考了其他的前端项目的VSCode开发环境体验，个人认为MJML的VSCode开发体验还不够好。

- VSCode插件功能（可能新开发，也可能基于已有插件）
  - 代码Lint和Formatter：HTML自动缩进、标签对称修改、未闭合警告……
  - 代码提示（IntelliSense）：标签提示、Boilerplate、路径提示……
  - 实时侧栏预览和环境切换（搭配Node实现）
- Node功能：
  - 编译器和开发环境（实时渲染）
  - Commit检查事件
