---
title: 再谈模块化：Node中ESM与CJS的解析策略
date: '2024/02/19 01:07:06'
excerpt: >-
  文章探讨Node.js中ESM与CJS模块解析，分析ts-node兼容性问题，提供配置tsconfig.json和package.json以避免模块解析错误的方法。
thumbnail: >-
  https://picgo-1308055782.cos.ap-chengdu.myqcloud.com/picgo-electron202405200443171.png
alias:
  - post/Development/how-node-resolve-modules/index.html
  - post/development/how-node-resolve-modules/index.html
---

## 前情提要：从ts-node报错发现了大坑

彼时我正在开发一个内网npm包，用于在开发时生成TS接口类型。

**该包中的代码（以及生成的代码，因为生成的代码为纯类型声明）并不会在浏览器环境中运行，也不会包含在产物中，因此可以看作是纯Node工具**。

在开发时，我尝试使用ts-node进行调试，但出现了以下错误：

![](https://picgo-1308055782.cos.ap-chengdu.myqcloud.com/win11-new2024%2F02%2F20240218234913.png?imageSlim)

> 当时的我很疑惑，明明是ts-node为何会不支持`.ts`的拓展名呢？

经查阅，我发现ts-node的运行过程其实是先使用tsc编译成JS后再使用Node运行，在过程中会读取项目的`tsconfig.json`中的配置项。

因此，只需要分别运行tsc编译和node执行两个阶段就可以找出到底在哪里出了问题。

### 尝试复现问题

我尝试新建一个最简单的环境来复现问题本身：

1.  使用`npm init`新建一个npm项目，安装typescript和ts-node两个包
2.  编写`index.ts`和`moduleA.ts`两个文件模拟模块导入导出
3.  使用`tsc`编译并使用Node执行

```typescript
// moduleA.ts
export const a = 'this is moduleA'

// index.ts
import { a } from './moduleA'

console.log(a)
```

使用tsc编译后单独执行和直接使用ts-node都正常，运行效果是一样的：

![](https://picgo-1308055782.cos.ap-chengdu.myqcloud.com/win11-new2024%2F02%2F20240218234920.png?imageSlim)

在`package.json`中设置`type: module`后（指定全局为ESM模块），运行ts-node出现了和上面一样的报错：

![](https://picgo-1308055782.cos.ap-chengdu.myqcloud.com/win11-new2024%2F02%2F20240218234926.png?imageSlim)

而单独使用tsc+node运行报错则不一样，提示为模块类型不兼容：

![](https://picgo-1308055782.cos.ap-chengdu.myqcloud.com/win11-new2024%2F02%2F20240218234955.png?imageSlim)

因此**可以判定为ts-node的内部执行代码与ESM模块兼容性有问题**，可以通过开启ts-node的ESM模式或将整体项目模块改为CJS解决（Web TS项目使用CJS问题不大，但如果是npm项目则需要慎重考虑）

- 项目整体修改为CommonJS模块（兼容CJS和ESM语法导入），需要修改项目npm和ts配置
  1.  修改`package.json`中的`type`字段为CommonJS或留空
  2.  修改`tsconfig.json`的`module`字段为CommonJS
- 开启ts-node的ESM模式，无需修改项目配置，以下操作二选一即可
  - 修改命令为`ts-node --esm`或`ts-node-esm`
  - 修改`tsconfig.json`中`"ts-node".esm`字段为`true`

修复后就可以解决上面的报错（新报错是由于没有修改`tsconfig.json`中的`module`）：

![](https://picgo-1308055782.cos.ap-chengdu.myqcloud.com/win11-new2024%2F02%2F20240218234959.png?imageSlim)

### 出现新问题：找不到模块

修改了上述问题后，在原项目（非新建项目）中出现了下面的问题：**找不到源码中导出的某个模块**。

![](https://picgo-1308055782.cos.ap-chengdu.myqcloud.com/win11-new2024%2F02%2F20240218235005.png?imageSlim)

尝试在新建项目中复现类似错误，我们需要还原原项目中的配置（除了`package.json`中的`type: module`外的TS配置），高亮行为重点：

```json
// tsconfig.json
{
	"extends": "@tsconfig/recommended/tsconfig.json",
	"exclude": ["./node_modules/**/*", "./dist/**/*", "./build/**/*"],
	"include": ["./src/**/*", "./tsconfig.json", "./wagas.config.ts"],
	"compilerOptions": {
		"baseUrl": "./",
		"paths": {
			"src/*": ["./src/*"]
		},
		"outDir": "./build",
		"typeRoots": ["src/types"],
		"module": "ES2022",
		"moduleResolution": "Node10",
		"target": "ES6"
	},
	"ts-node": {
		"esm": true,
		"experimentalResolver": true
	}
}
```

在新项目的`tsconfig.json`中设置`module: esnext`后，成功复现了原项目错误：

![](https://picgo-1308055782.cos.ap-chengdu.myqcloud.com/win11-new2024%2F02%2F20240219001129.png?imageSlim)

说明确实是`module` **字段相关的模块解析导致了这个错误**。这才是本文的重头戏，也引出了后面关于Node和TS中模块解析策略的讨论。

## 背景知识：ESM与CJS

在开始之前，先简单地谈谈JS模块化是什么。

在[过去与未来的npm](https://chlorinec.top/post/development/npm/)一文中，我简单提到了当下JS语言的两种主流模块化方案——CommonJS（CJS）和ES Module（ESM）。

它们主要的区别如下（详情可以到文章中去了解）：

|          | CJS              | ESM                    |
| -------- | ---------------- | ---------------------- |
| 标准来源 | 社区             | ECMA Script 标准委员会 |
| 实现层次 | 应用层           | 语言标准               |
| 本质     | JS对象（值拷贝） | 符号引用（引用拷贝）   |

但是，稍了解前端工具链生态的同学可能就会有疑问：我明明网页的最终产物都使用webpack打包成一整个js文件后放在`<script>`标签里引用，这和模块也没关系呀？

### JS应用的两种环境

虽说我们的页面代码最终是运行在**浏览器环境**中的`<script>`脚本，但整个开发工具链（包括包管理器npm、构建工具webpack等）都是运行在**NodeJS环境**中的

![image-20240219000955623](https://picgo-1308055782.cos.ap-chengdu.myqcloud.com/win11-new2024%2F02%2F20240219000956.png?imageSlim)

所谓NPM，管理的正是**Node Package**，即Node环境下的包而非浏览器环境下的包，浏览器环境中一个HTML对应一个完整的JS上下文，并不存在“包”的概念（但有“模块”的概念，这里暂时按下不表）。

作为运行环境，**Node除了要负责JS代码的解释与执行外，还要负责解析模块**（或者说找到并读取模块文件）。比如对于下面这个`import`语句，Node就需要先找到它在哪里，并以正确的格式去读取它：

```javascript
import { debounce } from 'lodash'
```

一般而言，Node会按照 路径读取 → `node_modules`目录寻找 → 上层 `node_modules`目录寻找 → ... 的方式去寻找对应模块的文件（详见npm博客）。

在找到对应模块后，剩下的问题就是**以什么格式去读取模块的内容**。

### Node对两种标准的支持

NodeJS从一开始是只支持CJS标准的，代表就是其标志性的`require()`和`module.exports`语法，在ESM规范的逐渐推广后也逐渐添加了相关支持：

在**v13.2.0**版本后，Node正式支持了ESM标准，可以通过以下方式启用：

- 在`package.json`中指定`type: module`即可认定全局为ESM模块（可以用`.cjs`表明CJS模块）
- 使用`.mjs`拓展名表明该文件为ESM模块

在认定为ESM模块的文件中，就可以使用ESM语法（`export`和`import`）了，但需要注意的是**在一个文件内不能同时使用ESM和CJS语法，只能选择一个使用**。

## 与TS & Node配置的关系

洋洋洒洒说了一大堆，心中还是有很多疑问，没有从更高层次将这些问题连接起来：

- Node的解析策略和TS项目中的配置有什么关系呢？
- 其中每项配置分别起了什么作用呢？
- 它们的影响范围和优先级是什么样的？

先要明确TS本身与Node的关系：

众所周知TS给自身的定义是JS的“超集”，但这只是语法上的定义，实际上看来**TS更像是JS的“类型插件”，在JS运行层上加了一层额外的“类型分析层”**，从TS代码编译成JS实际上是在做“类型擦除”就可以看出，真实代码运行时其实不需要任何类型信息。

而Node本身只接受JS代码，并不接受TS代码，因此我们就可以明确tsc和node各自的职权范围：

- tsc负责将`.ts`文件翻译成`.js`文件，配置影响编译过程行为
  - tsc一般包含**类型检查和类型擦除**两个步骤，有些构建工具（如esbuild）则通过只做类型擦除来加快编译过程
  - tsc**只提供编译，不提供打包**相关功能，如果需要打包则需要结合使用其他工具（如webpack、rollup等），因此tsc不适合直接在非Node环境下使用
- node负责执行编译得到的`.js`文件中的代码，配置影响运行时行为（如模块读取策略）

（各自配置影响范围）

### tsconfig.json中的模块相关参数

根据[官方资料](https://www.typescriptlang.org/tsconfig#module '官方资料')，`tsconfig.json`中与模块解析相关的参数就只有下面几个：

- `module` 字段：指定编译后文件使用的模块体系，如导入导出语句
- `moduleResolution`字段：指定当前项目使用哪种模块解析策略，**在LSP中也会生效**

需要注意的是，`target`字段并不会影响模块解析策略，只会影响生成的JS语法特性范围。

#### `module`字段

> 参考阅读 —— TS官方给出的JS模块哲学：[https://www.typescriptlang.org/docs/handbook/modules/theory.html#the-module-output-format](https://www.typescriptlang.org/docs/handbook/modules/theory.html#the-module-output-format 'https://www.typescriptlang.org/docs/handbook/modules/theory.html#the-module-output-format')

TS支持多种模块标准，包括不同版本的CJS和ESM，设置该字段**有助于TS编译器理解宿主环境（host runtime，如Node）使用什么类型的模块，它应该输出什么样的模块**。

> ⭐需要注意的是，**修改`module`字段也会隐式修改`moduleResolution`字段**，但显式地设置`moduleResolution`字段优先级会更高

该字段最直观的影响就是改变产物中导入导出语句的格式，接下来将以这段代码为例展示不同产物：

```typescript
export const a = 'this is moduleA'
```

- `CommonJS`：默认值，表示编译产物使用CJS模块标准

![](https://picgo-1308055782.cos.ap-chengdu.myqcloud.com/win11-new2024%2F02%2F20240218235242.png?imageSlim)

- `ES[*]`：表示使用ESM模块标准，允许的值为Next|6|2015|2020|2022，根据运行时宿主和语法特性要求环境选择不同的标准：
  - ES2015 = ES6标准，表示基础ESM语法支持，Node v12以上版本均支持
  - ES2020添加了对`import.meta`和`export from`语句的支持
  - ES2022添加对顶层`await`语句的支持

![](https://picgo-1308055782.cos.ap-chengdu.myqcloud.com/win11-new2024%2F02%2F20240218235255.png?imageSlim)

- `Node16`：表示使用Node16+使用的模块解析算法，同时支持ESM和CJS，具体输出由`pacakge.json`决定，详见后文（图1为 type=module时，而图2为 type=commonjs时）

![type: module 时](https://picgo-1308055782.cos.ap-chengdu.myqcloud.com/win11-new2024%2F02%2F20240218235258.png?imageSlim 'type: module 时')

![type: commonjs时](https://picgo-1308055782.cos.ap-chengdu.myqcloud.com/win11-new2024%2F02%2F20240218235259.png?imageSlim 'type: commonjs时')

- `NodeNext` / `ESNext`：这些带有XXNext的选项表示始终与最新版本同步，注意这将引入不确定性（因为Next的目标将随Typescript版本变化而变化），目前的最新目标如下：
  - NodeNext = Node16
  - ESNext = ES2022

#### `moduleResolution`字段

上面了解到`module`字段用于告知编译器运行环境期待得到什么样的模块，`moduleResolution`字段则用于告诉编译器运行环境使用什么算法来解析和读取*模块路径说明符*（如`import a from "xxx"`中的`xxx`就是*模块路径说明符*）

> ⭐需要注意的是，Typescript本身并不真的负责读取和解析模块，这部分交给运行时去实现（如Node、Deno等），这也解释了为什么tsc不会修改**_模块路径说明符_**。

目前，Typescript支持以下可选项作为`moduleResolution`的值， “对应的module”是指在取得这些值时`moduleResolution`将取得对应的默认值。

| 选项                       | 对应的`module`                                 | 算法说明                                                                                                                                                                                                                                 |
| -------------------------- | ---------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| classic                    | 除了`commonjs`, `node16`和`nodenext`外的任意值 | 使用RequireJS算法，不应在任何不使用RequireJS/AMD的项目中使用                                                                                                                                                                             |
| node10 / node&#xA;（常用） | `commonjs`                                     | Node v12以前版本使用的模块解析算法，几乎忠实还原了大部分打包工具的查找算法，支持如嵌套查询`node_modules`、使用`index.js`替代目录和省略`.js`拓展名等重要特性。但由于Node v12以后引入了ESM支持和新的解析规则，在现代Node项目中并非好选择。 |
| node16&#xA;（新项目常用）  | `node16`                                       | 在Node v12+中同时支持了ESM和CJS，且每种模块都有自己的解析算法。为了确认文件的模块类型，在ESM import中省略拓展名（因为`.mjs`和`.cjs`是模块类型判据）和`index.js`文件代替目录特性不再被支持，但CJS require仍支持（因为只支持CJS模块）      |
| nodenext                   | `nodenext`                                     | 带next的选项将始终与最新标准同步，目前是node16                                                                                                                                                                                           |
| bundler                    |                                                | Typescript团队为了在新版Node中还原大部分打包器所使用的查找算法的努力，它还原了node10的大部分行为（require解析算法）                                                                                                                      |

### package.json中的模块相关参数

除了`type`字段可以指定**项目内**的隐式模块类型外，`package.json`中还有一系列字段可以确认**项目作为包暴露给外部的模块类型和入口**：

- 目标为node v12+（使用现代解析策略）时，推荐使用条件导出（conditional exports）配置，详见下文
- 目标为老版本node（仅支持CJS）时，推荐使用传统的`main`和`module`字段指定入口，注意这些字段在新版本中可用，但不推荐，且\*\*在`exports`\*\***字段存在时会被覆盖**。
  - `main`字段为包的主入口，如有`module`字段则是CJS入口
  - `module`字段为包的ESM入口

#### 条件导出 `exports` 字段

所谓条件导出（conditional exports）是指根据导入语句的类型（CJS还是ESM）和路径去指定特定的导出文件入口。

- 导入语句类型：通过`import`和`require`来分别定义ESM和CJS入口

```json
// package.json
{
	"exports": {
		"import": "./index-module.js",
		"require": "./index-require.cjs"
	},
	"type": "module"
}
```

- 指定路径（path）：如`import a from "pkg/xxx"`这样的语句

```json
{
	"exports": {
		".": "./index.js",
		"./feature.js": {
			"node": "./feature-node.js",
			"default": "./feature.js"
		}
	}
}
```

- 嵌套定义：上面的路径就是一种嵌套定义，除此之外也支持其他类型的嵌套定义

```json
{
	"exports": {
		"node": {
			"import": "./feature-node.mjs",
			"require": "./feature-node.cjs"
		},
		"default": "./feature.mjs"
	}
}
```

### ESM与CJS的互操作性

然而在实际生产中，ESM和CJS并非水火不容的关系，更多情况下它们存在复杂的相互调用关系。

事实上，由于CJS在很长一段时间内都是社区的事实标准，所以尽管ESM目前大行其道，但很多古老的依赖仍是CJS规范，因此很多即便模块规范为ESM的项目也免不了有一些CJS的依赖。

下表反映了我测试得到的ESM和CJS的互操作性结果：

| Import 语句                      | Export 语句          | 面向场景   | 解决方案                                      |
| -------------------------------- | -------------------- | ---------- | --------------------------------------------- |
| ESM `import`                     | CJS `module.exports` | ESM Module | `import * as pkg from ''``import pkg from ''` |
| CJS `require`                    | ESM `export`         | CJS Module | Forbidden                                     |
| Dynamic Import &#xA;(`import()`) | CJS `module.exports` | Both       | `import()`                                    |
|                                  | ESM `export`         | Both       |                                               |

#### Dynamic Import动态导入

由于ESM模块规范中的`import`语句是静态导入（在[过去与未来的npm](https://chlorinec.top/post/development/npm/)一文中详细谈到过），和`require`的实现逻辑不同，因此无法使用`require`语句去引用ESM包。

为了解决这一问题，**ECMA Script标准ES2020**引入了动态导入（dynamic import）语句，它的实现是动态的、异步的，行为与`require`更相似，因此可以实现CJS和ESM通吃。

> ⭐需要注意的是，ESM的`import()`结果是module，获取默认导出要用`.default`才能拿到对象

下图为在CJS中使用Dynamic Import（`import()`）的代码和效果：

![](https://picgo-1308055782.cos.ap-chengdu.myqcloud.com/win11-new2024%2F02%2F20240218235359.png?imageSlim)

## 回顾与总结

最后，我们回到问题本身来，看看到底是什么引起了这个错误？如何修复这个错误？

![](https://picgo-1308055782.cos.ap-chengdu.myqcloud.com/win11-new2024%2F02%2F20240218235404.png?imageSlim)

回顾前文，该问题背后的运行环境如下：

- `package.json`中设置`type: module`，即该项目全局默认为ESM模块
- `tsconfig.json`中设置`module`为ES2022，但`moduleResolution`为`node10`；即要求产物为ESM模块规范，但**解析算法为node10的CJS算法**

### 为什么会产生这个问题

> ⭐Node解析ESM模块必需使用Node16规范算法，引用时不能省略拓展名

其实看完环境配置后答案已经呼之欲出了，让我们回顾之前`moduleResolution`中对node v12后如何同时支持ESM和CJS的解析算法的叙述，可以得到以下分析过程：

- 在Node v12+的解析规范中，由于`import`语句需要同时支持CJS和ESM，而判断该文件是什么类型的信息与拓展名相关，因此在Node v12+（规范node16）中文件拓展名不能省略
- 在新版规范中，`require`语句算法并没有修改，因此还是沿用之前的方案（规范node10），可以省略拓展名，以`index.js`替代目录等特性仍可以继续使用（这也是最开始默认为CJS时没问题的原因）
- 项目配置了`type: module`，则全局的JS文件都默认为ESM，使用ESM解析算法解析，即实际解析行为一定是`Node16`
- 本项目中因为贪图省事（也是因为思维惯性），用`node10`算法去匹配`ESNext`模块规范，导致TS在编译时没有检查出错误，而Node在解析ESM模块的时候更是一脸懵逼，直接报错了

![](https://picgo-1308055782.cos.ap-chengdu.myqcloud.com/win11-new2024%2F02%2F20240218235409.png?imageSlim)

### 如何修复这个Bug

既然我们已经知道了是`moduleResolution`解析算法不匹配的原因，就只需要把算法修改为正确的`Node16`即可，在该模式下可以匹配正确的Node算法，并根据配置自动处理ESM和CJS模块输出。

```json
// tsconfig.json: 修改module会自动匹配对应的算法
{
	"compileOptions": {
		"module": "Node16"
	}
}
```

修改后，我们还需要给我们的路径引入添加上拓展名：

![](https://picgo-1308055782.cos.ap-chengdu.myqcloud.com/win11-new2024%2F02%2F20240218235413.png?imageSlim)

需要注意的是，**这里的`.js`会自动匹配所有类型的扩展名，也可以被Typescript正确处理**。

修改后，我们使用ts-node和tsc+node分别运行验证，均正常工作：

![](https://picgo-1308055782.cos.ap-chengdu.myqcloud.com/win11-new2024%2F02%2F20240218235416.png?imageSlim)
