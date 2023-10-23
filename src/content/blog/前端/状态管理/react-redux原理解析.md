---
title: 从设计模式看 react-redux 的工作原理
excerpt: >-
  本文探讨了redux的发布-订阅模式的实现，以及与原生的useContext和useReducer方案的区别。redux的发布-订阅模式采用了subscription实例来订阅store的消息事件，并通过notify通知所有订阅了它的Subscription实例，从而实现了按需刷新，避免了意外组件更新。与观察者模式不同，redux的发布-订阅模式是解耦的，订阅者和发布者之间无需直接联系。此外，文章还介绍了redux的API实现和Hook
  API的用法，包括useSelector、useDispatch和useStore等。
tags:
  - 状态管理
  - react
  - redux
categories:
  - 前端
  - 状态管理
abbrlink: 2764449389
date: 2023-08-14 00:48:00
---

在研究原生的`useContext` 和`useReducer` 方案时我就感到非常疑惑，数据对象更新导致的组件刷新是由react控制的，这导致了在状态增多后会产生意外刷新的问题。

但是redux明明采用了相近的思路，是**如何避免整个对象刷新带来的意外组件更新**的呢？

## 发布-订阅模式

redux的核心就是**发布-订阅模式**，我们回忆一下redux的基本结构和流程：

- 有且仅有一个全局状态store，维护着所有states
- 所有组件从store中获取状态，并通过dispatch action来更新状态
- **当状态更新时，所有订阅了该状态的组件发生刷新**

可以看见，问题的关键就在于订阅了状态的组件按需刷新这一点，前两点通过原生的`useContext` + `useReducer` 其实都可以实现，但只有redux能实现按需刷新，不会刷新无关组件。

那这是怎么做到的呢？我们先从发布-订阅模式入手，看看redux是如何实现该模式的。

### 基本概念

发布-订阅模式天然具有两个对象：**发布者**和**订阅者**，比如在视频网站中，up主就是发布者，关注了up的用户就是订阅者，up主发布视频后关注了该up的所有人都会收到推送。

- 发布者（publisher）：该类型实例可以发布某一类型的消息，并通知所有所有订阅了该消息的订阅者
- 订阅者（subscriber）：该类型实例可以订阅和退订某些消息源，并在收到消息时可选地做出反应

利用OOP，我们可以定义以下两个接口来表示发布者和订阅者需要实现的基础能力。

```typescript
// 订阅者
interface ISubscribe {
  // 注册对IPublish实例的监听，并添加事件处理函数
  subscribe: (publisher: IPublish, callback: (payload: ...any) => void) => void;
  // 取消对IPublish实力的监听
  cancel: (publisher: IPublish) => void;
}

// 发布者
interface IPublish {
  // 通知所有订阅了该发布者的订阅者实例
  notify: (message: ...any) => void;
}
```

在具体实现方面，订阅者比较简单，只需要向发布者注册和注销监听即可；发布者一方可以**维护一个线性表来保存所有订阅了该消息的订阅者实例**。具体实现上可以参考下面的（伪）代码：

```typescript
class Publisher implements IPublish {
	subscribers: Map<ISubscribe, (...any) => void> = new Map()
	addListener(subscriber: ISubscribe, callback?: (...any) => void) {
		subsicribers[subscriber] = callback
	}
	removeListener(subscriber: ISubscriber) {
		// remove
	}
	notify(...message: any) {
		subscribers.values.forEach((fn) => fn(message))
	}
}
```

上面的代码中我们创建了一个哈希表来存储订阅者，主要是为了方便管理订阅者（添加和删除），在发送消息时直接调用表中存储的回调来通知订阅者，实现了一个最基础的发布-订阅模式。

### 与观察者模式的对比

上面的实现看起来一眼观察者模式对吧，我们的Publisher就是Subject（被观察者），Subscriber就是Observer（观察者），Publisher状态变化时就会去主动通知Subscriber，就像下面这样。

![](https://picgo-1308055782.cos.ap-chengdu.myqcloud.com/picgo-core/2023/08/20230814004718.png)

但真正的发布-订阅模式不是这样的，与观察者模式直接相连的方式不同，发布-订阅模式最直观的区别就是**发布者和订阅者之间维护了一层类似消息队列的东西，负责分发消息**，像下面这样。

![](https://picgo-1308055782.cos.ap-chengdu.myqcloud.com/picgo-core/2023/08/20230814004720.png)

还是拿刚刚B站视频订阅举例子，在up更新视频后给观众推送订阅消息时，并不是up自己主动地给每个关注了自己的人发消息，而是告诉了一个中间人（broker）“我更新了视频”，然后这个中间人再向订阅了这个消息的人推送这条消息“xx up更新了视频，快来看吧”。

虽然它们的结果是相同的，但他们中间的实现过程有着最本质的区别：**发布者和订阅者之间完全不需要有直接联系，是完全解耦的**，而不像观察者模式一样是松耦合的（基于接口抽象）。

因此我们上面的例子可以说完全不是发布-订阅模式，只是观察者模式；而接口描述只是描述了这个模型的能力，而二者又是几乎相同的。

在应用场景上，二者虽然结果相同，但面向的应用场景和规模是不同的：

- 观察者模式多用于单个应用内部
- 发布-订阅模式多用于跨应用的消息中间件，如操作系统的消息队列

在redux中，我们把**整个更新机制看作发布-订阅模式的实现，其中dispatch action的一方看作发布者，mapState使用状态的一方看作订阅者。** 二者是完全解耦的，符合定义要求。

- dispatch action的一方并不知道它的修改会影响哪些组件，它只管负责通知“中间人”store它做出了什么修改
- “中间人”store负责对修改做出响应，并通知受到影响的组件更新

### redux中的实现

在redux中，观察和订阅的实现要稍微复杂一点。准确地说，redux中的`Subscription` 实例既可以发布，也可以订阅。

- 它可以订阅父级的`Subscription` ，并**在它们更新时得到通知**
- 它也可以被子组件订阅，并**在自己更新时通知它们**

![](https://picgo-1308055782.cos.ap-chengdu.myqcloud.com/picgo-core/2023/08/20230814004729.png)

在上面的流程图中有一个小细节需要注意，那就是`Subscription`的来源：

- 在生成`Provider` 组件的Context时会自动生成一个`Subscription` 实例，它包含了我们的store，并使用redux store的`subscribe(callback)`订阅了最顶层的消息，即**在整个store发生更新时得到通知**，其逻辑和其他层级的`subscribe` 是一致的
- 在使用`connect()` 包裹组件时，它除了生成一个HOC外还会生成一个`Subscription` 实例，它**将订阅当前Context中的`Subscription`对象，并更新当前Context的​`Subscription`对象为自己**
- 根据Context的就近原则，**实际调用store中的对象时会使用的是组件树中最近的Context Value**

> 为什么要选择嵌套的Provider结构？确保树中较低层的连接组件只有在最近的连接祖先被更新后才会收到 store 更新通知来避免一些过长更新链带来的“边缘情况”。
> 参考链接：[https://cn.react-redux.js.org/api/hooks#stale-props-和-zombie-children](https://cn.react-redux.js.org/api/hooks#stale-props-和-zombie-children 'https://cn.react-redux.js.org/api/hooks#stale-props-和-zombie-children')

以下是简化后的subscription实现代码：

```typescript
// Subscriotion.js
const nullListeners = { notify() {} }

// 监听集合是一个双向链表
function createListenerCollection() {
	// 也就是React里的unstable_batchedUpdates
	// 来自司徒正美微博：unstable_batchedUpdates会把子组件的forceUpdate干掉，防止组件在一个批量更新中重新渲染两次
	const batch = getBatch()
	let first = null
	let last = null

	return {
		clear() {
			first = null
			last = null
		},

		// 通知订阅者更新
		notify() {
			batch(() => {
				let listener = first
				while (listener) {
					// 这个callback的本质就是让组件本身forceUpdate
					listener.callback()
					listener = listener.next
				}
			})
		},

		// 订阅
		subscribe(callback) {
			let isSubscribed = true
			// 把last赋值为新的
			let listener = (last = {
				callback,
				next: null,
				prev: last
			})

			// 如果存在前一个，就把前一个的next指向当前（最后一个）
			if (listener.prev) {
				listener.prev.next = listener
			} else {
				// 否则它就是第一个
				first = listener
			}

			// 返回退订函数
			return function unsubscribe() {
				// ...退订逻辑
			}
		}
	}
}

export default class Subscription {
	constructor(store, parentSub) {
		// redux store
		this.store = store
		// 父级的Subscription实例
		this.parentSub = parentSub
		// 退订函数
		this.unsubscribe = null
		// 监听者
		this.listeners = nullListeners

		this.handleChangeWrapper = this.handleChangeWrapper.bind(this)
	}

	// 添加嵌套的订阅者
	addNestedSub(listener) {
		// 首先先将当前的Subscription实例绑定到父级
		// 绑定的同时会初始化listeners
		this.trySubscribe()
		return this.listeners.subscribe(listener)
	}

	// 通知子级
	notifyNestedSubs() {
		this.listeners.notify()
	}

	// 当父级Subscription的listeners通知时调用
	handleChangeWrapper() {
		// 这个是new出实例的时候加上的，感觉有点秀
		if (this.onStateChange) {
			this.onStateChange()
		}
	}

	trySubscribe() {
		// 不会重复绑定
		if (!this.unsubscribe) {
			this.unsubscribe = this.parentSub
				? this.parentSub.addNestedSub(this.handleChangeWrapper)
				: // subscribe是redux里的方法，在redux state改变的时候会调用
				  this.store.subscribe(this.handleChangeWrapper)
			// 创建新的listeners，每个connect的组件都会有listeners
			this.listeners = createListenerCollection()
		}
	}

	// 退订
	tryUnsubscribe() {
		if (this.unsubscribe) {
			this.unsubscribe()
			this.unsubscribe = null
			this.listeners.clear()
			this.listeners = nullListeners
		}
	}
}
```

## API实现

### `<Provider>` 组件

Provider只实现了两个简单的功能：

- 创建根层级的`Subscription` 实例，订阅redux store的消息事件
- 创建包含`Subscription` 实例和store的Context，供其包裹的组件使用状态

其简单的代码实现如下：

```javascript
// components/Provider.js

function Provider({ store, context, children }) {
	// useMemo仅在store变化时再重新返回
	const contextValue = useMemo(() => {
		const subscription = new Subscription(store)
		// 通知订阅这个subscription的子级刷新
		subscription.onStateChange = subscription.notifyNestedSubs
		return {
			store,
			// 将此subscription传入context方便子级订阅
			subscription
		}
	}, [store])

	// 缓存上次的state
	const previousState = useMemo(() => store.getState(), [store])

	useEffect(() => {
		const { subscription } = contextValue
		// 在这里是订阅的reudx store的subscribe事件
		subscription.trySubscribe()
		if (previousState !== store.getState()) {
			subscription.notifyNestedSubs()
		}
		return () => {
			subscription.tryUnsubscribe()
			subscription.onStateChange = null
		}
	}, [contextValue, previousState, store])

	// 传入的context或者react-redux自带的
	const Context = context || ReactReduxContext

	return <Context.Provider value={contextValue}>{children}</Context.Provider>
}
```

我们关注到以下细节：

- `ContextValue` 其实包含了`store` 和Subscription实例，而Subscription实例内部的store只是用于订阅store的改变事件
- 在redux核心概念中我们知道，store的本质就是一个reducer，可以看成state+dispatch两部分构成，state会不断改变，但dispatch应是不会改变的（只要传入Provider的store不变）

### `connect` API

虽然在现代的redux中`connect` API几乎已经被废弃了，官方也推荐使用Hook API替代。但`connect` API仍然是可用的，而且理解它对理解Hooks的原理也是有帮助的。

> 代码太多了不想逐行分析了，这里就大概说下我对流程的理解。

`connect()` 函数的作用就是生成一个高阶组件（HOC）来包裹要调用store的组件，这个HOC主要负责以下工作：

- 创建自己的Subscription Context
  - 订阅来自上层的变化
  - 通知下层自身的变化
- 将state和dispatch写入被包裹组件的props中，以便组件调用
  - `mapStateToProps`
  - `mapDispatchToProps`
- **将store更新和视图更新解耦，判断当前组件是否需要刷新，避免不需要的刷新**
  - 某个Subscription触发更新后，会通过`notify`通知所有订阅了它的Subscription实例，并触发`onStateChange` 回调
  - Connect组件中`checkForUpdates` 用于处理`onStateChange` 回调事件，它负责处理数据的刷新，判断当前组件是否需要刷新
    - 通过检查当前mappedStates（当前组件调用的状态对象）是否更新来判断是否刷新
    - 不论mappedStates是否更新，都需要通知子组件检查更新
    - 采用记忆化（memo）、Ref和强等于来进行优化和判断

### Hook API

#### `useSelector`

```typescript
const result: any = useSelector(selector: Function, equalityFn?: Function)
```

selector Hook在概念上与connect中的`mapStateToProps` 类似，都是按需获取store中的部分状态。

- 和`mapStateToProps` 一样，`useSelector` 会在store更新后触发运行，但在订阅的数据没有更新时不会触发组件刷新，而是使用缓存值
- 由于`useSelector` 是一个Hook，它也具有一些`mapState` 不具备的特性
  - 和其他Hook一样，在组件刷新时会运行Selector（除非组件被memo导致地址没有发生变化）
  - 通过闭包或柯里化来引入props
  - selector函数的返回值可以是任何值而不只是对象，值得注意的是由于`useSelector` 采用严格引用相等来判断更新，因此建议对每一个原子状态单独设置selector而不是合成在一个对象中，在react-redux v7中使用react批量更新会将这些Selector放在一起执行（只会执行一次）

#### `useDispatch`

```typescript
const dispatch = useDispatch()
```

`useDispatch` 相对于`useSelector`更加简单，它只是返回`store.dispatch`。

只要传入Provider的store没有改变，dispatch的函数引用地址就应该是稳定不变的，但`useMemo` 和`useCallback` 这样的记忆化Hook还是会要求把`dispatch` 放进deps数组中。

#### `useStore`&#x20;

> ⚠️在任何时候都应该尽量避免使用这个Hook来获取状态

```typescript
const store = useStore()
```

这个 hook 返回一个 Redux store 引用，该 store 与传递给 `<Provider>` 组件的 store 相同。

不应该频繁使用这个 hook。宁愿将 `useSelector()` 作为主要选择。然而，对于少量需要访问 store 的场景而言，例如替换 reducer，这个 hook 很有用。
