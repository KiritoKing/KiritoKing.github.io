---
title: 深入JS - 4.JavaScript语言设计
excerpt: 这篇文章主要讨论JavaScript中一些特殊的语言特性（如原型链、`this`指针等），它们为什么要被设计成这样（JS的语言历史），在现代JS开发中要如何看待这些特性，以及ES6标准和TypeScript对JavaScript生态带来了什么影响。
tags:
---

JavaScript无疑是一门非常容易上手的语言，如果仅仅是要快速地写一个程序，只要你有任何编程基础，你甚至不用系统学习JavaScript的任何语法，和Python一样，直接上手调试就能写出可以运行的代码。

但在前端逐渐泛化的今天，如果你要使用JavaScript维护一个大项目，不同功能之间复杂的相互引用（上下文）和逻辑本身的数据流复杂性（继承链）等就不可避免地会涉及到JavaScript的语言特性和设计细节，来保持整个项目的一致性和可维护性。除此之外，还有更多的现代特性或者引入TypeScript的类型特性，这又引入了更多问题，像：ES6标准是如何实现的？新标准的实现和旧体系有什么本质区别吗，还是只是语法糖？什么时候引入TypeScript，完全使用TS重构还是只使用类型声明（`.d.ts`）？TypeScript的类型体系为什么要这么设计，又是怎么实现静态类型检查的？

为了解决上面这些问题，我们从JavaScript本身入手，从历史渊源和设计思路出发，理清其发展逻辑。不仅讨论JavaScript中一些**特殊的语言特性**（如原型链、`this`指针等），还要讨论它们**为什么要被设计成这样**，在现代JS开发中要如何看待这些特性。在此基础上吗，我们还要深入理解**ES6标准和TypeScript**，为什么要这么设计，以及对JavaScript生态带来了什么影响。

最后，透过JavaScript，我们还要看到Web前端开发未来的风向，如*WebAssembly*这样的“新”技术。

## 经典 JavaScript

> **如果你是初学JavaScript，请不要参照此文章**，而是直接寻找一篇*现代JavaScript教程*，边做边学。以下这些概念可能会误导你了解一些老旧的开发思想和编程范式，不利于快速掌握现代JS开发。
>
> 更好的选择是，**你已经学会使用JS开发一些项目后，再回过头来研究JS的语言细节。**

有些JS特性和设计真的是典中之典，像什么原型链、`this`指向、闭包和词法作用域等等，不一而绝，折磨了一代又一代前端面试者。他们的存在有他们的意义，也有很大的时代局限性。

这里我们不应像其他面向面试的文章一样只知道它怎么用，怎么考，更要知道当初Brendan Eich（JavaScript之父~~万恶之源~~）**为什么要这样设计它**，这就脱离了应试的范畴，可以锻炼我们对语言特性的理解能力和语言设计能力。

- 闭包
- 词法作用域与状态提升
- 动态类型系统
- 原型链
- 万恶的`this`指针

## ECMA委员会与ES标准

## TypeScript：静态类型与JS的现在

## WebAssembly：尚不确定的未来

## 参考资料

- [JavaScript 二十年 (history.js.org)](https://cn.history.js.org/)
- [JavaScript 编程精解 中文第三版 · JavaScript 编程精解 中文第三版 (gitbooks.io)](https://wizardforcel.gitbooks.io/eloquent-js-3e/content/)
- [如何循序渐进、有效地学习JavaScript？ - 知乎 (zhihu.com)](https://www.zhihu.com/question/19713563)

- [现代 JavaScript 教程](https://zh.javascript.info/)

- [JavaScript - 学习 Web 开发 | MDN (mozilla.org)](https://developer.mozilla.org/zh-CN/docs/Learn/JavaScript)
