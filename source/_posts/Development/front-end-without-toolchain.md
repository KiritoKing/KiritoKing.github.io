---
title: 抛弃React和Vue，让前端工程返璞归真
category: Development
date: '2024/03/31 05:24:16'
excerpt: >-
  本文探讨了前端开发的简化方法，对比了前后端分离与全栈开发的优劣，并介绍了alpine.js、htmx等轻量级工具和Web
  Components技术，旨在返璞归真，减少前端工程的复杂性。
alias: post/Development/front-end-without-toolchain/index.html
---

这个标题多少有些标题党了，毕竟我作为前端在想做快速原型的时候肯定会优先考虑Next，但这两天写外包项目的途中，我突然激发了一些思考：

- 前后端分离的意义是什么？我们真的需要前后端分离吗？
- 现代前端工具链带给了我们什么？我们失去了什么？
- 如果仅仅依靠浏览器和Web规范，不寻求前端构建生态链的帮助，我们究竟能走多远？

## 前后端分离的意义

虽然我自己是干前端的，但之前对前后端分离一直持怀疑态度，因为前端本身就是从Web后端拆分出来的工种，所谓分分合合，分开了不久现在又有了合起来的趋势。

以前，是后端兼职写写HTML，后来被特化为了前端；现在是写JS的人越来越多，在哪都想用JS一把梭，狭义上的“全栈”其实就是指的是用JS同时完成前后端的人（毕竟在古老的年代没有“全栈”一说，大家都是全栈）。

### 一次当技术Leader的经历

看法发生改变是在接下某个外包项目后：这个外包项目是JS全栈项目，但是并**没有前后端分离，而且是以后端（Koa.js）为主导的**，前端则大部分是使用模板语言实现，辅以少量的JS脚本（使用jQuery）。

更恐怖的是，这个项目大部分脚手架如ORM、后端框架（可以理解自己在Koa基础上写了个类NestJS的框架）和前端构建逻辑都是原作自己写的，我自己花了大量的时间去理解整个项目的结构。

由于工期紧，我急需一些人来帮我分担简单的前端页面设计，为此，我基于原有框架为其加上了React和Vue的支持，试图让外包能够快速上手添加页面。

然而事与愿违，我发现大部分外包虽然能比较娴熟地出页面（但其实大部分都没考虑到项目的整体可维护性），但他面对我已经搭好的架子仍然无从下手，因为这不是他们熟悉的前端架构，他们不知道他们写的SPA应该加在哪里，每次都要花时间去解释或者自己修改接入。

我陷入了僵局，要找会后端的人简单，会前端的人也简单，但要找到这样一个能熟悉架构、既能改前端又能改后端的人，很难，也很贵。

所以在这里，**我第一次体会到了前后端分离的意义，不是技术上的，而是项目管理意义上的，前后端分离的项目从更高的层面来看维护成本更低、长期来看也更能持续发展。**

## 为什么会有前端框架？

其实前端开发相较Web开发而言应该算比较年轻的职业，我记得我小学的时候就玩过WordPress，那时PHP还在大行其道（虽然现在WP也还在用PHP），HTML5还没落地，Flash尚在巅峰时期，jQuery都是新鲜事物。

彼时国内Web开发可能都还是一片混沌，更罔论“前端工程师”作为一个专门的职业出现。

再后来，我们熟悉的Web标准逐渐成型，HTML5、CSS3和ES6的出现，为当下纷繁复杂的Web世界打下了牢固（？）的地基。

我们也迎来了前端开发的第一个时代——jQuery的时代，它是一个对JS DOM操作的极简封装，降低了开发者动态操作DOM的开发成本，促使了第一批动态网页的诞生。

![](https://picgo-1308055782.cos.ap-chengdu.myqcloud.com/win11-new2024%2F03%2F20240331171113.png?imageSlim)

### 数据驱动的前端框架

然而，jQuery仍采取了传统的面向过程编程思想，形象地说是**控制流决定了数据流，而非数据流决定了控制流**。

在UI开发中，数据流决定控制流才是更自然的形式，在桌面端有WinForm向WPF的转变，在Web端自然也会有相似的演变，于是Meta/Facebook便带着React轰轰烈烈地来了。

React虽然经历了一系列编程范式的摇摆变化，如从最初的OOP思想（`Class`组件）到现在的函数式编程（`Function`组件），其竞争者也在源源不断地解决React本身的问题。但它们的本质都是想要提出一种构建UI和逻辑的更好方式，解决以下痛点问题：

- **声明式的渲染**，而非过程化的操作，如：自动数据绑定、自动响应式更新等
- **数据驱动逻辑**，如通过接口更新数据即可自动刷新UI
- **代码的可重用**，如单文件组件模式

![](https://picgo-1308055782.cos.ap-chengdu.myqcloud.com/win11-new2024%2F03%2F20240331171118.png?imageSlim)

### 使用框架的代价

对于久旱逢甘霖的前端开发者而言，上面的糖果实在太诱人了，迫不及待地想要成为这一批吃上螃蟹的人。

然而，凡事总有代价，首当其冲的就是**数据绑定所依赖的JSX语法并不被浏览器所支持，这就意味着基于React编写的代码需要再经过一步额外的“编译”才能在浏览器中直接运行，这\*\***就是“前端工具链”梦开始的地方\***\*。**

- 编译器说，我要一个适合前端开发的运行时，便有了NodeJS
- 开发者说，我不想造轮子，便有了npm
- 开发者说，我要一个统一的构建工具平台来跑轮子，于是便有了webpack

以上三大件（运行时、包管理器和构建平台）构成了整个庞大前端工具链的地基，但这还远远不够，前端开发在这条路上一直越卷越远：

- 转化工具还不够好，要可拓展，要Native，要快，于是就从tsc到babel，再到esbuild和swc...
- 考虑兼容性太麻烦，我就想用最新的语法，于是有了polyfill插件，有了post-css
- CSS样式污染严重，于是有了各种预处理器（sass/less）、CSS Modules和CSS-in-JS方案
- 不想仅仅运行在浏览器上，想要有自己的中间层来渲染HTML、处理API，于是有了Next，有了GraphQL和各种BFF（Backend For Frontend）

随着前端生态链在NodeJS的基础上不断开枝散叶，前端开发变得越来越复杂，边界也不断拓展，但大家可能并没有注意到 **“前端”代码跑在浏览器上的部分越来越少，跑在本机（Node）上的部分越来越多**。

这对于专职于前端开发的人来说可能并不是什么问题，甚至可能是好事（技术深度更深了，可替代性就弱了），但对于做全栈的独立开发者来说，就并非如此了，特别是对于后端开发而言，需要维护两个项目，并理解两套完全不同的开发体系。

### 全栈开发的变迁

前端生态的蓬勃发展，随之而来的就是后端向Web UI开发的近乎停滞。几乎所有做UI的人都在考虑前端，如何让前端能做更多事，如何让写JS的人也能做整个App，而没有人关心如何让写CPP/Python/Go的人能写出更好看、交互性更强的UI。

诚然，现在Node生态的蓬勃发展已经让JS成为了全栈开发者的第一选择，像Next这样的元框架更是开发者快速实现原型的第一选择。

然而，**面向后端的Web UI开发**这个市场始终存在，并不会因为市场的忽视就消失，就像WASM（如微软的Blazor，支持将C#代码编译为可执行的Web代码）和HTMX库的爆火就证明了这一市场始终存在。

## 想要倒行逆施一把...

> **“元框架”（meta-framework）** 的概念是前端圈的概念，因为一些用于提供基础功能的视图库（ui library，如React）等占据了“**框架**”这一生态位，因此像Next、Remix这样提供全套解决方案的真正“框架”（类比Java中的SpringBoot）就只能被叫做“**元框架**”。

目前来看，所谓“全栈”的流行方案是**以前端为主导的元框架**，如前段时间因Server Action长得像PHP爆火出圈的NextJS。

![](https://picgo-1308055782.cos.ap-chengdu.myqcloud.com/win11-new2024%2F03%2F20240331171129.png?imageSlim)

这些**元框架**的特点是**围绕前端**进行构建：

- 围绕JavaScript/TypeScript和NodeJS生态构建，下限高，上限低（指计算密集型应用）
- 与现代前端技术（如React、Vue等）和前端工具链生态强绑定，必须使用DSL _（如Vue的template语法和React/Solid使用的JSX本质上都是一种DSL）_ 和构建工具
- 以前端页面和组件为核心，将组件生命周期拆成服务端和客户端两部分
  - 服务端：数据获取和预渲染，甚至可以**直接从服务器获取数据从而省略后端开发**
  - 客户端：加载页面逻辑
  - 元框架的工作内容就是统一服务端和客户端的逻辑，降低开发者心智负担

但是，在这个项目里，如果给我一次从头再来的机会，我会想继续以后端为中心的架构，尽可能减少对原框架的修改。

那么，如果我们**以Express为核心构建一个网站，在2024年的体验如何呢**？

### 模板引擎选哪个？

要想直接在后端框架渲染HTML，一般少不了模板引擎，模板引擎在传统HTML的基础上增加了如**组件复用、数据插入**等重要功能。

一般来说，我们根据后端语言来选择合适的模板引擎，如Python一般选择jinjia2。

在JS的世界里，我们的可选项有很多，如EJS、Jade/Pug、nunjucks等。这里我们参考express官方的[template engine](https://expressjs.com/en/resources/template-engines.html ' Template Engines  https://expressjs.com/en/resources/template-engines.html')推荐。

这里是我个人比较熟悉或推荐的选择：

- [EJS](https://github.com/mde/ejs 'EJS')：语法简单直观且高性能的模板语言，是Hexo（一种博客框架）的模板解决方案；
- [nunjucks](https://github.com/mozilla/nunjucks 'nunjucks')：语法与jinjia2类似，功能更多（如模板继承、宏定义等），适合Python转JS的用户，Mozilla出品；
- [Pug/Jade](https://github.com/pugjs/pug 'Pug/Jade')：非常著名的模板语言，与HTML语法差异较大，Vue支持这一模板语言。

### 应该用回jQuery...吗？

想到编写“简单”的页面逻辑，大家想到的除了原生JS应该就是jQuery了吧，JQ帮我们封装了常用的DOM操作以提高API的易用性。

趁着jQuery 4.0发布第一版之际，51cto也出来蹭了波大热度：

[用 React/Vue 不如用 JQuery，你知道吗？-51CTO.COM ](https://www.51cto.com/article/783916.html '用 React/Vue 不如用 JQuery，你知道吗？-51CTO.COM')

这种小丑文章我们姑且不谈，但JQ的面向过程语法在写交互时属实还有些心智负担。

比如，我们使用JQ实现一个根据状态显隐的组件：

```html
<script src="https://code.jquery.com/jquery-3.6.0.min.js"></script>

<body>
	<button>Expand</button>
	<span style="display: none;">Content...</span>

	<script>
		$(document).ready(function () {
			// 定义一个变量来控制内容的显示与隐藏
			let isOpen = false

			// 绑定点击事件到按钮
			$('button').click(function () {
				// 切换isOpen的值
				isOpen = !isOpen

				// 根据isOpen的值来显示或隐藏内容
				if (isOpen) {
					$('span').show()
				} else {
					$('span').hide()
				}
			})
		})
	</script>
</body>
```

可以看到，我们需要添加`<script>`标签，并在其中操作DOM进行事件绑定，相比原生JS会简单一些，但总体代码量还挺多的。

### 新时代王炸组合alpine.js + htmx

国内很多人可能还对alpine和htmx比较陌生，这两位在国外已经是反react急先锋的心头好了。

可以看看下面这个[Live Demo](https://django-htmx-alpine.nicholasmoen.com/ '   https://django-htmx-alpine.nicholasmoen.com/')，就是用Django + alpine.js + htmx完成的：

他们以“复古”闻名，用最简单的CDN引入即可，语法也只需要最质朴的HTML Attribute和`<script>`标签，完全**无需任何构建步骤**，堪称在全栈极速出活领域面向后端的的另一个极端（完全绕靠前端工具链，就像Next通过Server Action可以完全绕开API层一样）。

#### alpine.js - 想做新时代的Vue2

> 你可以继续操作 DOM，并在需要的时候使用 Alpine.js，就像JavaScript世界里的tailwind一样。

我看到[alpine.js](https://alpinejs.dev/ ' Alpine.js A rugged, minimal framework for composing behavior directly in your markup. https://alpinejs.dev/')的极简语法指导的时候，我的第一反应就是“怎能如此相像”。是的，它提供了很多Vue-like的语法糖，如`x-data`, `x-on`, `x-bind`等。

可以看出，它瞄准的点就是传统视图库想要解决的点——**声明式的数据绑定**，而它的优点就是无需构建，直接可用，也不需要引入任何前端工具链。

我们使用alpine.js再实现一次上面的例子，可以看见`<script>`标签和DOM操作完全消失了。

```html
<script src="//unpkg.com/alpinejs" defer></script>

<div x-data="{ open: false }">
	<button @click="open = true">Expand</button>

	<span x-show="open"> Content... </span>
</div>
```

可以看出，相较于jQuery，alpine.js的体验确实好了不少，省去了繁琐的DOM获取和操作。

#### htmx - 处理服务器交互

如果说alpine.js是处理客户端的页面交互逻辑，[htmx](https://htmx.org/ ' </> htmx - high power tools for html htmx gives you access to AJAX, CSS Transitions, WebSockets and Server Sent Events directly in HTML, using attributes, so you can build modern user interfaces with the simplicity and power of hypertext https://htmx.org/')则专注于尽量不写JS代码就能处理与服务端的交互逻辑，包括AJAX请求，Web Socket和SSE（服务端推送事件）等。

同样的，它也使用CDN + Attribute语法，如下面这段代码的含义是当按钮被点击时会向`/clicked` URL发送POST请求，并将整个按钮的HTML替换为请求结果。

```html
<script src="https://unpkg.com/htmx.org@1.9.11"></script>
<!-- have a button POST a click via AJAX -->
<button hx-post="/clicked" hx-swap="outerHTML">Click Me</button>
```

可以看到，我们也没有写任何JS代码、进行任何DOM操作就完成了AJAX请求的发起和结果替换。

### 样式解决方案

解决了交互逻辑的问题，下一步就是样式问题了 ~~，众所周知前端都是切图仔所以样式很重要~~。

目前上已有的样式解决方案除了传统的CSS写法，其他方案如预处理器（Sass/Less/PostCSS）、CSS Module和css-in-js等大多都与前端工具链深度绑定。

好巧不巧，趋势永远是一个环，最近大火的**原子化（atomic）和工具化（utilized）CSS**就强调提供一系列预设的CSS类名（如`columns`, `color-white`等），由用户自行组合来替代语义化CSS带来的一系列如类名和继承关系难设计等困难，也可以避免CSS预处理额外引入构建工具的问题。

#### Bulma - 轻量CSS框架

想必读到这里的人都能猜到，这肯定也是一个以CDN形式形式引入的CSS库，和Tailwind生态依赖PostCSS（来实现Tree-Shaking、语法转化等）不同，[Bulma](https://bulma.io/ " Bulma: Free, open source, and modern CSS framework based on Flexbox Bulma is a free, open source CSS framework based on Flexbox and built with Sass. It's 100% responsive, fully modular, and available for free. https://bulma.io/")仅仅只需要引入一个几百K的CSS文件。

```html
// CSS Import @import "https://cdn.jsdelivr.net/npm/bulma@1.0.0/css/bulma.min.css"; // HTTP Link Tag
<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/bulma@1.0.0/css/bulma.min.css" />
```

Bulma提供了一套包含布局系统（基于Flex Box）、预设组件和自定义CSS变量的极简CSS设计系统，其效果类似于tailwind+daisy UI，**最大的优势就是开箱即用，无需引入任何构建工具**。

其效果图如下（截图来自官网）：

![](https://picgo-1308055782.cos.ap-chengdu.myqcloud.com/win11-new2024%2F03%2F20240331171148.png?imageSlim)

#### 现代CSS - No Build

CSS每年都在增加大量的新特性，对于我个人来说最炸裂或者说最有用的就以下两个：

- 原生CSS嵌套（增加嵌套的`&`占位符）
- `:has`伪选择器，根据子元素状态修改父元素样式

个人感觉以上两个现代特性都是足以改变Web开发流程的BREAKING CHANGE。

虽然大部分新特性我们都能依赖PostCSS来无痛语法降级，让我们鱼和熊掌都能兼得，但奈何本文的主旨是No Build，因此我也查阅了其兼容性。

![](https://picgo-1308055782.cos.ap-chengdu.myqcloud.com/win11-new2024%2F03%2F20240331171143.png?imageSlim)

很遗憾，这两个特性的覆盖范围均没有很理想，均是`2023 Baseline`，如果是面向生产的项目还是建议不要直接使用，可能会产生恶性影响。

## 还想走得更远...

到这里，我们已经在**纯浏览器环境中**完成了响应式式视图绑定、AJAX请求、使用组件库等工作，但万一我们想要创建一个可复用的组件（如模态框），做一次一本万利的生意，能怎么做呢？

首先，我们的底线还是在标准Web规范下，不引入任何Node上的前端工具链。那除了**借助模板语言的功能**，还有没有其他方法呢？

### 拥抱Web Components

[Web Components](https://developer.mozilla.org/en-US/docs/Web/API/Web_components ' Web Components - Web APIs | MDN Web Components is a suite of different technologies allowing you to create reusable custom elements — with their functionality encapsulated away from the rest of your code — and utilize them in your w https://developer.mozilla.org/en-US/docs/Web/API/Web_components')已经是标准的一部分，被所有主流浏览器所支持。它使用一系列技术，使我们可以创建自己的可重用定制元素（如`<my-custom-element />`），并使之与外界隔离开来。

除了老顽固React和Vue外，许多框架已经拥抱了Web Component标准，如Angular和Lit。

### 使用Lit实现Dialog

<https://codepen.io/calebdwilliams/pen/OdeJdq>

因为Web Component本身也是标准的一部分，因此编写和使用Web Component也是不需要任何构建工具，只需要CDN引入即可，而Lit本身也只是Web Components的语法糖，一切的一切都是标准的。

```html
<one-dialog>
	<span slot="heading">Hello world</span>
	<div>
		<p>
			Lorem ipsum dolor amet tilde bicycle rights affogato brooklyn. Whatever lomo subway tile
			sriracha gastropub edison bulb shabby chic tumeric meditation mustache raw denim.
		</p>

		<p>
			reegan ugh bespoke you probably haven't heard of them godard crucifix pabst. Selvage biodiesel
			vice copper mug lumbersexual cred plaid. Skateboard pitchfork listicle fashion axe. Chillwave
			viral butcher vegan wolf.
		</p>
	</div>
</one-dialog>

<button id="launch-dialog">Launch dialog</button>
```

> ⭐这里个人建议使用Typescript来编写Lit，借助装饰器（Decorator）语法来获得更好的开发体验，一步简单的转译即可完成。

接下来编写JS代码来注册HTML Element，这里使用了HTTP Import，因此只需要保证该JS执行即可，不需要额外引用CDN了。

```javascript
// ./one-dialog.js
import {
	LitElement,
	html,
	css
} from 'https://unpkg.com/@polymer/lit-element@latest/lit-element.js?module'

const privateOpen = Symbol('open')

class OneDialog extends LitElement {
	static get properties() {
		return {
			open: { type: Boolean, attribute: 'open', reflect: true }
		}
	}

	static get styles() {
		return [
			css`
				.wrapper {
					opacity: 0;
					transition:
						visibility 0s,
						opacity 0.25s ease-in;
				}
				.wrapper:not(.open) {
					visibility: hidden;
				}
				.wrapper.open {
					align-items: center;
					display: flex;
					justify-content: center;
					height: 100vh;
					position: fixed;
					top: 0;
					left: 0;
					right: 0;
					bottom: 0;
					opacity: 1;
					visibility: visible;
				}
				.overlay {
					background: rgba(0, 0, 0, 0.8);
					height: 100%;
					position: fixed;
					top: 0;
					right: 0;
					bottom: 0;
					left: 0;
					width: 100%;
				}
				.dialog {
					background: #ffffff;
					max-width: 600px;
					padding: 1rem;
					position: fixed;
				}
				button {
					all: unset;
					cursor: pointer;
					font-size: 1.25rem;
					position: absolute;
					top: 1rem;
					right: 1rem;
				}
				button:focus {
					border: 2px solid blue;
				}
			`
		]
	}

	firstUpdated() {
		this._watchEscape = this._watchEscape.bind(this)
	}

	render() {
		return html` <div class="wrapper ${this.open ? 'open' : ''}" aria-hidden="${!this.open}">
			<div class="overlay" @click="${this.close}"></div>
			<div class="dialog" role="dialog" aria-labelledby="title" aria-describedby="content">
				<button class="close" aria-label="Close" @click=${this.close}>✖️</button>
				<h1 id="title"><slot name="heading"></slot></h1>
				<div id="content" class="content">
					<slot></slot>
				</div>
			</div>
		</div>`
	}

	get open() {
		return this[privateOpen]
	}
	set open(isOpen) {
		this[privateOpen] = isOpen
		const { shadowRoot } = this
		const { activeElement } = document
		if (isOpen) {
			setTimeout(() => shadowRoot.querySelector('button').focus())
			if (activeElement) {
				this._wasFocused = activeElement
			}
			document.addEventListener('keydown', this._watchEscape)
		} else {
			this._wasFocused && this._wasFocused.focus && this._wasFocused.focus()
			document.removeEventListener('keydown', this._watchEscape)
		}
	}

	close() {
		this.open = false
		const closeEvent = new CustomEvent('dialog-closed')
		this.dispatchEvent(closeEvent)
	}

	_watchEscape(event) {
		if (event.key === 'Escape') {
			this.close()
		}
	}
}

customElements.define('one-dialog', OneDialog)

const button = document.getElementById('launch-dialog')
button.addEventListener('click', () => {
	document.querySelector('one-dialog').open = true
})
```

至此，一个可重用的Dialog组件就设计完毕了，在任何地方（不管什么框架）只需要保证这段JS代码执行，就可以使用`<one-dialog>`标签来使用我们的组件。

## 折腾后的思考

前端工具链经过好几年的内卷，现在的复杂度越来越高，慢慢脱离了keep web simple的本意。

在各种复杂的构建工具、设计模式、元框架背后，其本质都是提高DX和提高效率，我们似乎有些忘记了很多东西可以更简单。

就像大部分的服务都不必整微服务一样，单体架构就能通吃；大部分的小项目也完全不用做复杂的前后端架构拆分，只需要看团队主导是前端还是后端，然后选择对应的最优开发模式。

当然，这并不是否认大型框架存在的必要性，毕竟很多复杂的设计是为了过滤掉很多超过一定边界才会产生的麻烦，它们在那种场景下也是必要的。

还是那句话，工程本身的复杂性是无法消除的，软件开发没有银弹，但是**不要为了技术去引入不必要的复杂性**，毕竟打工人不要和自己过意不去。
