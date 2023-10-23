---
title: 你真的需要useMemo和useCallback吗
excerpt: >-
  今天写需求的时候被mentor敲打了，说随便用`useCallback`不好，但没有细说原因。此前在跟其他老哥交流的时候也告诉我说能不用就不用，我也很好奇为什么，这里就来好好深究一下`useCallback`和`useMemo`，以及它们到底应该在什么情况下使用。
tags:
  - react
  - 性能优化
categories:
  - 前端
  - 深入React
abbrlink: 2103510996
---

## 目录

- [从useMemo开始](#从useMemo开始)
  - [计算属性？](#计算属性)
  - [useMemo的真实用途](#useMemo的真实用途)
    - [减少不必要的计算](#减少不必要的计算)
    - [避免复杂组件意外刷新](#避免复杂组件意外刷新)
  - [刷新判断机制](#刷新判断机制)
  - [为什么不要随便用useMemo](#为什么不要随便用useMemo)
    - [useMemo 的性能开销](#useMemo-的性能开销)
- [再看useCallback](#再看useCallback)
  - [useCallback的真正用途](#useCallback的真正用途)
  - [什么时候需要useCallback](#什么时候需要useCallback)
  - [其他优化方案](#其他优化方案)
    - [useEffect闭包](#useEffect闭包)
    - [使用useReducer](#使用useReducer)
- [重新思考缓存Hook的使用](#重新思考缓存Hook的使用)

今天写需求的时候被mentor敲打了，说随便用`useCallback`不好，但没有细说原因。此前在跟其他老哥交流的时候也告诉我说能不用就不用，我也很好奇为什么，这里就来好好深究一下`useCallback`和`useMemo`，以及它们到底应该在什么情况下使用。~~（最后发现自己之前的理解完全错了）~~

## 从`useMemo`开始

首先，我们在react.dev官网看看它的定义：

> `useMemo` is a React Hook that lets you cache the result of a calculation between re-renders.

根据定义，`useMemo`的作用很纯粹：**在组件更新时缓存计算结果**。

### 计算属性？

熟悉Vue的同学肯定立刻想到了`computed`计算属性，但不尽然如此（至少在传统选项式API中）。在React中的函数组件和JSX语法里，其实可以直接定义一个用于计算逻辑的函数，它可以作为闭包可以直接获取状态，并在每次re-render的过程中都会重新定义和运行，并不需要做特殊的“响应式优化“，如下面的代码所示：

```react jsx
function MemoDemo(props) {
  // ... some states definition
  const calcProduct = () => {
    // ... some calculation
  }
  const product = calcProduct()
  const cachedProduct = useMemo(calcProduct, [...])
  return <div>{product}</div>
}

```

可以看到，在上面这个简单的例子中，**直接定义一个闭包函数并在渲染时调用它就可以实现运算逻辑的封装**，避免了`return`部分的过度复杂。

在Vue2（或者说选项式API）中`computed`计算属性除了用于优化外更多的是因为只有在`computed`中才能拿到`data`和`props`；而在Vue3里的`computed` Hook就和React中逻辑几乎类似了。

```vue
<template>
	<div>{{ product }}</div>
</template>
<script setup>
// ... some states definition

// Hook Style: 在Vue3组合式API中和React基本一致
const calcProduct = () => {...}
const product = calcProduct()
const cachedProduct = computed(calcProduct)

// Traditional: 选项式API中必须在组件内部才能得到响应式状态
data() {
  ...
}
computed() {
  ...
}
</script>
```

### `useMemo`的真实用途

上面我们知道，直接创造闭包就可以实现类似“计算属性”的功能，其实现方法是在每次重新渲染时都重新生成和运行闭包函数。而`useMemo`存在的意义就是当这次**重新运行开销很大时尽可能地优化（没有必要就不刷新），降低加载时间**。

#### 减少不必要的计算

```javascript
const memorized = useMemo(expensiveCalculation, [deps])
```

`useMemo` 可以在re-render之间缓存值，利用这个特性可以减少不必的计算，只在相关量（deps）更新时才重新运行计算过程，这也是这个Hook的本意。

比如在一个科学运算App中，除了远算结果外还有很多无关的状态如`theme`，其他无关变量等，在这些无关状态修改时有可能带动整个应用一起刷新，这时如果有`useMemo`来缓存结果就可以避免重新进行运算。

#### 避免复杂组件意外刷新

由于JS在\*\*每次运行形如`{}`\***\*的字面量或\*\***`function`\***\*和\*\***`()⇒{}`\*\***声明的函数时都会生成新的变量**（具体来说是新的指针引用），而当指针更新时触发React更新。（即使它们的内容可能是完全相等的）

而React函数组件就相当于一个函数闭包，每次刷新组件就相当于重新运行一次这个函数，其中的对象和函数都会生成一个新的指针，这就会导致接受了这些新指针作为props的组件可能会做无意义的刷新。

- 使用`memo`声明可缓存组件，并用`useMemo`缓存传入的`props`
- 直接使用`useMemo`来缓存组件，并把变量（ReactNode）直接传入JSX

```react jsx
function ComplexComponent(props) => {...}

// 法1:使用memo缓存组件，useMemo缓存props
const CachedComplexComponent = memo(ComplexComponent(props))

function App {
  const props = useMemo(..., [])
  // 法2:直接使用useMemo缓存JSX组件
  const cachedComponent = useMemo(<ComplexComponent ...props />, [props])

  // 以下两种方式效果是等价的
  return (
    <>
      <CachedComplexComponent props={props} />
      {cachedComponent}
    </>
  )
}


```

后者之所以可行是因为React Node实际上也只是一个普通的JS对象，对应V-DOM上的一个节点，因此可以被缓存和计算。

但前者是更传统的方法，也是更推荐的做法，因为直接使用`useMemo`缓存整个组件不能更方便地选择哪些情况下缓存，而`memo`可以直接缓存对应props。

### 刷新判断机制

根据官方文档，在新的缓存Hook如`useMemo`和`useCallback`中都使用了`Object.is`来判断相等，而此前就存在的API如`React.memo`则使用传统的引用相等（全等`===`）来判断相等。

`Object.is` 依据以下原则判断相等：

- 相同的字面量或值，如`undefined`, `null`, `true`, 字符串等
- 对象引用相同（指针值相等）

`Object.is`和`===`唯一的区别是处理+0，-0和NaN时，`Object.is`将他们分开看待，而`===`将-0和+0视作相等，每个NaN都是不同的引用。

> `==` 在比较前会进行隐式转换，这导致了许多潜在问题，目前唯一有用的应用可能是`== null`用于判断空值

### 为什么不要随便用`useMemo`

一般来说，大部分运算是足够快的，不需要对其优化就可以流畅运行（除非你已经感觉到了因计算产生的卡顿）。

需要注意的是，在开发时（Dev Mode）得到的性能指标往往是不准确的，他们往往和实际生产环境有一些区别：

- 开发机一般比用户机更快（可以使用Chrome的CPU Throttle模拟）
- React StrictMode会重复进行两次渲染
- React Dev Tool会消耗额外的资源

因此，考虑到实际情况，真正需要用到`useMemo`的场景其实出乎意料的少：

- 当一个运算过程肉眼可见地拖慢了响应速度，且**计算它所需的变量其实很少发生变化**时
- 当某个值作为props被传入了一个体量很大的组件（它本身的计算可能很简单，但它牵动的组件更新很复杂！），且**计算它所需的变量其实很少发生变化**时（需要搭配`memo`使用）
- **当某个值作为其他Hook的deps时，必须将其缓存来避免重复刷新**（准确地说应该是任何会在函数重新运行时生成新值的变量在作为deps时都应该被缓存，如对象字面量和函数）

#### `useMemo` 的性能开销

使用`useMemo`进行优化实际上可以看成两个不同的阶段：

- 首次运行（mount）：运算过程一定会运行，`useMemo`并不能优化这个过程，甚至会引入额外的开销
- 组件更新（update）：`useMemo`根据deps数组内依赖项，**使用**\*\*`Object.is`比较\*\*决定是使用缓存值还是重新运行计算过程

而`useMemo`的性能开销也可以分为两个部分：

- 运算开销：运算过程本身一定会产生的开销
- 额外开销：`useMemo`为了判断是否使用缓存值引入的开销

也就是说是否需要引入`useMemo`来优化性能变成了两种开销的trade-off问题。

根据[这篇博客](https://medium.com/swlh/should-you-use-usememo-in-react-a-benchmarked-analysis-159faf6609b7 '这篇博客')的方法，我们对`useMemo`进行性能测试，并更改循环的运行次数进行重复实验，试图找出使用`useMemo`的“甜蜜点“（虽然大部分时候我们不需要这么做）。

![n=1的性能开销对比](https://picgo-1308055782.cos.ap-chengdu.myqcloud.com/bd-mac/2023%2F08%2F20230822163301.png 'n=1的性能开销对比')

从n=1的测试结果我们可以看出，未memo的运算时间基本保持稳定，而memo后的结果虽说差别仍很小，但可以看出**在这样轻量级的计算下引入memo在首次渲染和后续更新都会拖慢速度**，显然是得不偿失的。

值得注意的是，即便在这种数量级下，memo仍相比重新计算有近19%的落后幅度。

![n=100时的性能开销对比](https://picgo-1308055782.cos.ap-chengdu.myqcloud.com/bd-mac/2023%2F08%2F20230822163304.png 'n=100时的性能开销对比')

在n=100的环节下`useMemo`开始逐渐挽回颜面，在后续更新环节中似乎比原生方法要快那么一丁点儿，但首次渲染仍显著地慢于原生方法。

这证明了此前**大部分的计算过程都不需要用memo缓存**的结论。

![](https://picgo-1308055782.cos.ap-chengdu.myqcloud.com/bd-mac/2023%2F08%2F20230822163311.png)

在n=1000的情况下发生了有趣的现象，即`useMemo`在首次运行时的开销暴涨了，与此同时重复渲染的开销并没有明显优于原生方法（约37%）。这可能是由于`useMemo`需要对运算结果进行缓存的缘故。

![](https://picgo-1308055782.cos.ap-chengdu.myqcloud.com/bd-mac/2023%2F08%2F20230822163316.png)

在n=5000时，`useMemo`终于开始发挥作用。虽然在首次渲染时`useMemo`花费了显著的额外时间用于缓存结果，但在后续的渲染中获得了喜人的提升。

> ⭐大部分情况下你不需要`useMemo`来缓存运算结果，除非重新运算让你感受到了卡顿

## 再看`useCallback`

照例我们在从react.dev官方看看其定义：

> `useCallback` is a React Hook that lets you cache a function definition between re-renders.

定义很简单，和`useMemo`相比的区别就是一个缓存函数的返回值，一个缓存函数本身。

```javascript
const cachedFn = useCallback(fn, dependencies)
```

- 在组件首次加载时，`useCallback` 直接返回`fn`
- 在组件刷新时，`useCallback`根据`deps`是否更新决定返回上次得到的`fn`还是重新计算`fn`的闭包

从某种意义上来说，`useCallback` 可以看作`useMemo`的语法糖：

```javascript
// Simplified implementation (inside React)
function useCallback(fn, dependencies) {
	return useMemo(() => fn, dependencies)
}
```

### `useCallback`的真正用途

这时有同学就要发出疑问了，将函数缓存起来有什么用吗？初始化一个函数真的有很大开销吗？再复杂的函数不运行它开销也不会很大呀。

我在这里要说：**你说得对！**

不仅创建函数闭包没有任何性能问题（React官方承诺），而且\*\*`useCallback`\*\***总是会引入额外的开销，因为函数总是会被创建，这是不可避免的！**

![](https://picgo-1308055782.cos.ap-chengdu.myqcloud.com/bd-mac/2023%2F08%2F20230822163327.png)

因此，如果你想用`useCallback`来“优化“所谓函数创建过程，那不能说是南辕北辙，只能说是背道而驰。

而`useCallback`真正的唯一用处是\*\*配合`memo`\*\***优化组件刷新过程**，用来避免譬如复杂表单顶层组件中`handleSubmit`这样的回调传递引起的刷新问题，`useCallback`可以让`handleSubmit`不重新生成，返回相同的函数指针来避免刷新。

> ⭐`useCallback`一定和`memo`组件一起使用，否则没有意义。

下面这个简单的例子可以解释`useCallback`的工作效果：

```react jsx
function Demo() {
  const [state, setState] = useState(0);
  const log = () => {
    console.log(state);
  };
  return <button onClick={() => () => setState((prev) => prev++)}>{state}</button>
}
```

在上面这个简单的例子中，`Demo`组件其实是一个普通函数，其内的`log` 函数就是包含`state`的闭包，每次按下按钮刷新组件时，`log` 变量就会被整个重新初始化一遍，将其内的`state`刷新成最新的值。

而下面这个例子引入了`useCallback`，运行后我们可以清楚地看出区别：

```react jsx
function Demo() {
  const [state, setState] = useState(0);
  const cachedLog = useCallback(() => {
    console.log(state);
  }, []);
  return <button onClick={() => () => setState((prev) => prev++)}>{state}</button>
}
```

这个例子中由于`deps`数组为空，因此只会在组件首次加载时返回一次`fn`，后续都使用缓存的值，因此无论怎么调用`cachedLog`都只会打印初始值0。

![一个大概一样的例子（懒得从零开始配脚手架）](https://picgo-1308055782.cos.ap-chengdu.myqcloud.com/bd-mac/2023%2F08%2F20230822163333.gif '一个大概一样的例子（懒得从零开始配脚手架）')

### 什么时候需要`useCallback`

> ⚠️\*\*不要再傻傻地将`useCallback`\*\***用于优化函数创建了！**

因此和`useMemo`类似，`useCallback`的适用场景更窄，只有在以下两个场景才是有价值的：

- 需要将一个回调函数传给`memo`组件，且不希望该组件因为回调函数的刷新而意外更新（尤其是在细粒度更新的应用中）
- 回调函数在其他Hook（如`useEffect`）中被调用并作`deps`被传入，如果不使用`useCallback`缓存起来就会导致循环刷新
- **在编写自定义Hook时，对外暴露的函数都应该用**\*\*`useCallback`\*\***包裹，确保调用者可以正常优化**

但上述两种情况或多或少都有其他的解决方案，比如你可以**将被缓存的函数移到Effect函数体内部**作为闭包，这样可以避免额外的开销。

### 其他优化方案

其实在很多时候比起使用`useCallback`缓存回调函数，我们有其他更“高明“的方法来避免刷新。

#### `useEffect`闭包

很多时候我们在`useEffect`中调用的函数实际上不需要放在顶层作用域中，放在`useEffect`函数体内部作为闭包是更好的做法，这避免了`useCallback`的额外开销。（用于判断函数是否更新）

```react jsx
function Demo() {
  const cachedInit = useCallback(() => {
    ...
  }, [...])

  useEffect(() => {
    const init = () => {
      ...
    }
    init()
  }, [])

  useEffect(() => {
    cachedInit()
  }, [cachedInit])
}
```

在上面的代码中，前后两个`useEffect`的效果是一样的，但前者避免了`useCallback`的开销，显然是更好的选择。

#### 使用`useReducer`

在[redux](https://www.wolai.com/k44NGUFnTypMDzGP5BxyNB 'redux')一文中我们了解到了store和reducer机制，而只要`store` 本身不变，无论状态如何改变，`dispatch`是不会改变的。

因此我们可以使用`useContext` + `useReducer`，用`dispatch`来代替`useCallback` 回调函数来执行操作，也可以绕过缓存来避免刷新。

```react jsx
const TodosDispatch = React.createContext(null);

function TodosApp() {
  // Note: `dispatch` won't change between re-renders
  const [todos, dispatch] = useReducer(todosReducer);

  return (
    <TodosDispatch.Provider value={dispatch}>
      <DeepTree todos={todos} />
    </TodosDispatch.Provider>
  );
}
```

## 重新思考缓存Hook的使用

> 🔥仅应该使用`useCallback`和`useMemo`来作为性能优化手段，而不是实现业务逻辑（意思是离开了这些缓存Hook也应该保持功能一致，只有性能差别）。

在很多情况下，记忆化缓存（memorization）都是不必要的。比起大量使用`useMemo`和`useCallback`这样的缓存Hook，我们更应该从优化组件的组织方式和逻辑本身入手。

- 使用`props.children`来在调用时向Wrapper组件传入组件，而不是直接写在Wrapper组件的声明中，这样可以避免因Wrapper自己状态变化导致内部组件刷新 **（Why？）**
- 使用树状状态流，**将状态尽可能近地保存在使用它的组件周围，避免不必要的提升和全局状态**以避免无关状态更新导致的刷新
- **尽可能保持纯函数**，遵循函数式编程基本范式，不要大量依赖副作用来实现逻辑（这样可以避免用作Effect Deps的缓存Hook使用）
- 如果你确实需要使用生命周期Hook，请尽量地减少依赖，因为**大部分的依赖实际上可以作为闭包放在Effect函数体中来减少不必要的Hook开销**
