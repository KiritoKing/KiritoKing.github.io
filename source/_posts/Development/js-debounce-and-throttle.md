---
title: 防抖与节流的应用与实现
date: '2023/05/25 01:33:55'
alias:
  - post/Development/js-debounce-and-throttle/index.html
  - post/development/js-debounce-and-throttle/index.html
---

防抖（debounce）和节流（throttle）都用于合并多次频繁的事件请求，使之只调用一次回调函数；不同之处在于防抖要求在请求稳定之后才会调用一次函数，而节流要求必须间隔指定时间才能触发一次回调函数，二者使用场景不同。但从个人体验来说，一般情况下防抖处理的回调函数调用机会比节流处理要更少。

<!--more-->

## 函数防抖（debounce）

> 在事件被触发n秒后再执行回调，如果在这n秒内又被触发，则重新计时。

防抖的主要应用就是防止在某些刷新频繁的场景中回调也被频繁调用，**如：搜索框刷新内容、resize更新页面布局等**，避免回调的高频调用可以减小后端压力、提高前端响应性能。

主要实现方法就是**利用闭包（closure）设置一个计时器，在计时器到达时就运行回调并清除计时器；若计时器途中事件源又刷新（发起新事件），就重置计时器，直到不再唤醒新事件为止**。

简单的实现如下，注意闭包处理的函数调用要更改`this`的指向：

```javascript
function myDebounce(fn, delay) {
	let timer = null
	return function () {
		let context = this
		let args = arguments
		clearTimeout(timer)
		timer = setTimeout(function () {
			fn.apply(context, args)
		}, delay)
	}
}
```

## 函数节流（throttle）

> 当持续触发事件时，有规律的每隔一个时间间隔执行一次事件处理函数。

防抖的目的在于设定一个回调函数执行的间隔，也是用于合并请求。

节流和防抖的区别在于**防抖只会在连续的事件周期结束时执行一次**，而节流会**在事件周期内按间隔时间有规律的执行多次**。

简单的实现如下：

```javascript
function myThrottle(fn, delay) {
	let prev = Date.now()
	return function () {
		let context = this
		let args = arguments
		let now = Date.now()
		if (now - prev >= delay) {
			fn.apply(context, args)
			prev = Date.now()
		}
	}
}
```

## 使用 loadash 库

> Lodash 是一个一致性、模块化、高性能的 JavaScript 实用工具库。

这里就要说一点题外话了，我记得很久之前我在知乎上看到过一个问题：如何看待npm中add包下载数量超多少多少万？

然后下面的回答几乎清一色的是嘲讽前端程序员的平均水准的（虽然确实写前端的综合素质确实emmm，至少在数据结构和算法上确实不是强项吧），什么连加法都不会、奇偶数判断都不会云云，回答里充满了快活的空气。

但我看到了有一个正经的回答，原话我已经不记得了，我只记得一句话大意是：**你们只看到了这个库的核心代码只有几行来实现加法，却没看到它对应的测试库和用例有好几千行**。

我想这就是我们在项目中即使是一些比较简单的功能也使用社区中经过考验的库而不是自己造轮子去实现的原因（当然加法的例子还是太夸张了，除非你的客户经常有那种边界需求之类的），我自己也很喜欢造轮子，像写写stl、js解释器之类的，但这种玩具级的轮子也就放在自己的项目里玩玩就好，真正放到业务代码里还是应该尽量选择经过社区验证的库代码比较好（当然那些三无库除外）。

### \_.debounce

`_.debounce(func, [wait=0], [options=])` 用于创建一个防抖动函数，该函数会从上一次被调用后，延迟 `wait` 毫秒后调用 `func` 方法。 debounced（防抖动）函数提供一个 `cancel` 方法取消延迟的函数调用以及 `flush` 方法立即调用。

- 可以提供一个 options（选项） 对象决定如何调用 `func` 方法
  - `options.leading` 与|或 `options.trailing` 决定延迟前后如何触发（注：是 先调用后等待 还是 先等待后调用）
- `func` 调用时会传入最后一次提供给 debounced（防抖动）函数 的参数。 后续调用的 debounced（防抖动）函数返回是最后一次 `func` 调用的结果。
- _(Function)_: 返回新的 debounced（防抖动）函数。
  - `cancel` 方法会取消当前调用
  - `flush` 方法会清除计时器并立刻调用

### \_.throttle

`_.throttle(func, [wait=0], [options=])` 创建一个节流函数，在 wait 秒内最多执行 `func` 一次的函数。**该函数提供一个 `cancel` 方法取消延迟的函数调用以及 `flush` 方法立即调用。**

具体参数和返回与 `debounce` 几乎一致。

### 按需引入

loadash 实际上是一个相对较大的库（如果你只用到其中一两个功能的话），这时就需要**按需引入来减小打包大小**。

- 如果你使用webpack等构建工具，可以使用其内建的tree-shaking功能减小打包体积
  - 使用*loadash-es*这个ES模块化的分支，不需要像更改引入入口一样改变使用习惯，直接引用如 `import {debounce} from 'loadash-es'`
  - 直接取对应成员，如 `import throttle from 'loadash/throttle'`，缺点是需要知道对应的函数到底存储在哪个js中
- 使用官方提供的babel插件[lodash/babel-plugin-lodash](https://github.com/lodash/babel-plugin-lodash)转译，在babel编译代码时，对引入`lodash`的语句进行替换，达到下文中**更改引入入口**的效果（相当于是利用babel帮你实现了上面的过程）
- 单独安装对应的loadash包，如你只使用`loadash.add`就只安装这个包而不安装整个loadash

## 参考资料

- [【建议收藏】这四个方法，让你使用lodash后js体积减少70kB - 掘金 (juejin.cn)](https://juejin.cn/post/7069218262634102798)
- [7分钟理解JS的节流、防抖及使用场景 - 掘金 (juejin.cn)](https://juejin.cn/post/6844903669389885453)
- [VUE防抖与节流的最佳解决方案——函数式组件 - 掘金 (juejin.cn)](https://juejin.cn/post/6844903848230780941)
