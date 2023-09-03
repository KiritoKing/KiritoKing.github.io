---
title: 【译&补】使用ref回调替代useRef吧
tags:
  - react
  - hook
categories:
  - 前端
date: 2023-09-04 01:36:00
---

> 原文：[*useCallback Might Be What You Meant By useRef & useEffect*](https://medium.com/welldone-software/usecallback-might-be-what-you-meant-by-useref-useeffect-773bc0278ae "useCallback Might Be What You Meant By useRef & useEffect")

在React中，`useRef`和`useEffect`是常用的钩子函数，用于不同的目的。

`useRef`通常用于保存在组件渲染之间持久存在的可变值，而`useEffect`用于执行诸如数据获取、订阅或DOM操作等副作用。

然而，当涉及对React元素挂载做出响应时，有一个更好的选择：`useCallback`。

<!-- more -->

## 尝试在Effect中使用Ref

如果你想要对React元素在DOM中的挂载做出响应，你可能会尝试**使用useRef来获取它的引用，并使用useEffect来响应其挂载和卸载。但这样做是无效的。**

![](https://picgo-1308055782.cos.ap-chengdu.myqcloud.com/picgo-core/2023/09/20230904013711.png)

这是因为当组件被（卸载）挂载并通过`useRef`连接到`ref.current`时，`ref.current`的更改并没有触发回调或重新渲染，自然也不会触发预期的生命周期回调。

甚至react-hooks 的ESLint规则也会对此发出警告。请注意，**无论是ref还是ref.current作为useEffect的依赖项，都不会触发它的执行**（这是useRef的特性决定的）。

下面的例子展示了上面的方法确实不可行的（在[Code Sandbox](https://codesandbox.io/s/how-useref-and-useeffect-cant-track-a-nodes-render-27br6?from-embed "Code Sandbox")中尝试）。

```javascript
export default function App() {
  const [count, setCount] = useState(1);
  const shouldShowImageOfCat = count % 3 === 0;

  const [catInfo, setCatInfo] = useState(false);

  // notice how none of the deps of useEffect
  // manages to trigger the hook in time
  const catImageRef = useRef();
  useEffect(() => {
    console.log(catImageRef.current);
    setCatInfo(catImageRef.current?.getBoundingClientRect());
    // notice the warning below
  }, [catImageRef, catImageRef.current]);

  return (
    <div className="App">
      <h1>useEffect & useRef vs useCallback</h1>
      <p>
        An image of a cat would appear on every 3rd render.
        <br />
        <br />
        Would our hook be able to make the emoji see it?
        <br />
        <br />
        {catInfo ? "😂" : "😩"} - I {catInfo ? "" : "don't"} see the cat 🐈
        {catInfo ? `, it's height is ${catInfo.height}` : ""}!
      </p>
      <input disabled value={`render #${count}`} />
      <button onClick={() => setCount((c) => c + 1)}>next render</button>
      <br />
      {shouldShowImageOfCat ? (
        <img
          ref={catImageRef}
          src={catImageUrl}
          alt="cat"
          width="50%"
          style={{ padding: 10 }}
        />
      ) : (
        ""
      )}
    </div>
  );
}
```

那我们应该怎么做呢？**使用useCallback**。（参考[react官方文档](https://legacy.reactjs.org/docs/hooks-faq.html#how-can-i-measure-a-dom-node "react官方文档")）

## 使用useCallback替代Ref

我们可以依赖于将一个普通函数通过useCallback包装后传递给ref，并对它返回的最新DOM节点引用做出反应。

下面的代码是一个例子（在[Code Sandbox](https://codesandbox.io/s/usecallback-as-ref-ytdt0?from-embed "Code Sandbox")中尝试）：

```javascript
export default function App() {
  const [count, setCount] = useState(1);
  const shouldShowImageOfCat = count % 3 === 0;

  const [catInfo, setCatInfo] = useState(false);

  // notice how this is a useCallback
  // that's used as the "ref" of the image below
  const catImageRef = useCallback((catImageNode) => {
    console.log(catImageNode);
    setCatInfo(catImageNode?.getBoundingClientRect());
  }, []);

  return (
    <div className="App">
      <h1>useEffect & useRef vs useCallback</h1>
      <p>
        An image of a cat would appear on every 3rd render.
        <br />
        <br />
        Would our hook be able to make the emoji see it?
        <br />
        <br />
        {catInfo ? "😂" : "😩"} - I {catInfo ? "" : "don't"} see the cat 🐈
        {catInfo ? `, it's height is ${catInfo.height}` : ""}!
      </p>
      <input disabled value={`render #${count}`} />
      <button onClick={() => setCount((c) => c + 1)}>next render</button>
      <br />
      {shouldShowImageOfCat ? (
        <img
          ref={catImageRef}
          src={catImageUrl}
          alt="cat"
          width="50%"
          style={{ padding: 10 }}
        />
      ) : (
        ""
      )}
    </div>
  );
}

```

在上面的例子中，我们可以看到`useCallback`被传入了`ref`参数中，这个过程中我们需要注意以下两点：

-   ref函数保证在元素挂载和卸载时被调用，即使是第一次挂载，甚至在父元素卸载导致的情况下也是如此。
-   **务必使用**\*\*`useCallback`\*\***来包装ref回调函数**。因为如果没有使用`useCallback`，在ref回调函数中引发重新渲染，会导致ref回调函数再次以null触发，可能导致无限循环，这是由于React内部机制所致。

## 其他方案

实际上这种模式可以以多种方式使用，以下三种方法渐进地对Node操作进行了优化：

### useState

由于`useState`是在渲染之间保持一致的函数，它也可以用作ref。在这种情况下，整个节点将保存在state中。

作为一个状态，当它发生变化时，它会触发重新渲染，并且可以安全地在渲染结果和useEffect的依赖项中使用该状态：

```javascript
const [node, setRef] = useState(null);

useEffect(() => {
  if (!node) {
    console.log('unmounted!');
    return null;
  }
  
  console.log('mounted');
  
  const fn = e => console.log(e);
  
  node.addEventListener('mousedown', fn);
  return () => node.removeEventListener('mousedown', fn);
}, [node])
```

### useStateRef

访问DOM是一项昂贵的操作，因此我们希望尽可能少地进行这样的操作。

如果你不需要像之前的钩子函数中那样保存整个节点，最好只在一个状态中保存其中的一部分：

```javascript
// the hook
function useStateRef(processNode) {
  const [node, setNode] = useState(null);
  const setRef = useCallback(newNode => {
    setNode(processNode(newNode));
  }, [processNode]);
  return [node, setRef];
}

// how it's used
const [clientHeight, setRef] = useStateRef(node => (node?.clientHeight || 0));

useEffect(() => {
  console.log(`the new clientHeight is: ${clientHeight}`);
}, [clientHeight])

// <div ref={setRef}....

// <div>the current height is: {clientHeight}</div>
```

### useRefWithCallback

然而，有时为了性能考虑，你可以在使用ref的元素挂载和卸载时避免触发重新渲染。

下面的钩子函数不会将节点保存在状态中。它直接响应挂载和卸载，因此不会触发任何重新渲染。

```javascript
// the hook
function useRefWithCallback(onMount, onUnmount) {
  const nodeRef = useRef(null);

  const setRef = useCallback(node => {
    if (nodeRef.current) {
      onUnmount(nodeRef.current);
    }

    nodeRef.current = node;

    if (nodeRef.current) {
      onMount(nodeRef.current);
    }
  }, [onMount, onUnmount]);

  return setRef;
}

const onMouseDown = useCallback(e => console.log('hi!', e.target.clientHeight), []);

const setDivRef = useRefWithCallback(
  node => node.addEventListener("mousedown", onMouseDown),
  node => node.removeEventListener("mousedown", onMouseDown)
);

// <div ref={setDivRef}

```

在上面这个例子中，`setRef`函数被传入了`ref`中，只有在DOM节点发生变化时才会调用它来更新`ref`，借此实现了生命周期函数。

-   若调用时ref中已经有值，则说明组件出现了变化，先用调用上一个组件的`unmount`周期，再更新ref，调用其`mount`周期
-   若调用时ref为`null`，则直接更新ref并调用其`mount`周期即可

最终，如果你理解了将useCallback用作元素ref的原理，你可能会根据自己的特定需求提出自己的想法。

## 补：在ref中使用useCallback的原理

> 官方文档：[使用ref回调 - react.dev](https://zh-hans.react.dev/learn/manipulating-the-dom-with-refs#how-to-manage-a-list-of-refs-using-a-ref-callback "使用ref回调 - react.dev")

众所周知，`ref`并非普通的props，直观地看就是我们无法从props中直接解构出`ref`。甚至在`React.createElement`中，`ref`参数早早地就被抽离了出来。

虽然`useRef`被我们当作存储视图无关变量的一般方法，但`ref` 本身作为props传递时却有些许不同，它可以接收三种类型的参数：

-   string ref：不推荐，已弃用
-   callback ref：将一个函数传给ref，称为回调函数，这个函数的签名为 `(ref) ⇒ void`
-   object ref：接收一个`ref`对象

这三种类型的`ref`具有统一的更新时机：在组件的`layout`阶段（或者说加载完成）时调用或赋值自己的ref参数。
