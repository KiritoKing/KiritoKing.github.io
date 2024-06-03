---
title: Bun 1.0 初体验体验：这口包子香吗？
category: Development
date: '2023/10/25 02:28:00'
alias: post/Development/bun-hands-on/index.html
---

# Bun 1.0 初体验体验：这口包子香吗？

> ⭐省流版：大体不可用，现阶段没有引进必要
> Bun现阶段作为更快的包管理器是可用的；作为运行时加速Node全栈应用可作为可能的技术储备，现阶段不能用于生产。其他功能如测试、构建器由于生态和API不够健全，不具备生产价值。

2023 年 9 月 8 日，Javascript 运行时 Bun 正式发布 1.0 版本，标志着这个由前 Facebook 工程师创建的项目正式进入稳定生产可用阶段。

从官网来看，Bun具有如下特点（或者说它是以下这些东西）

- 更快的、Node兼容的运行时：Bun是一个全新的JavaScript运行时，旨在服务于现代JavaScript生态系统和作为Node.js的直接替代品（drop-in alternative）。它原生地实现了数百个Node.js和Web API，包括`fs`、`path`、`Buffer`等。
- 全面的JS开发解决方案：Bun是一个完整的工具包，用于构建JavaScript应用程序，包括包管理器、测试运行器和打包器。

**本文主要从Web前端开发对Bun进行体验，对BFF和全栈Node开发并无涉及。**

## What's better?

个人总结Bun相对于Node主要的优势有下，优先级从上到下递减：

- **一站式开发解决方案**：Bun集成了npm/pnpm, node, webpack/esbuild, jest的功能，在Bun中可以直接完成项目管理、打包和测试
- **统一模块标准**：Bun不再区分CJS和ESM模块标准，可以交叉混用
- **Web API实现**：Bun原生实现了如`fetch`等Web API，不再需要polyfill
- **更快的速度**：Bun使用Zig实现和JS-Core引擎，还支持无转译原生运行TS，加快了工具链和代码本身的运行速度
- **原生JSX和TS语言支持**：Bun支持直接运行TS和JSX，不再需要转译，提高运行效率
- **集成常用工具**：Bun内置了常用功能，如`dot-env`, `nodemon`等

### 继续加速

Bun的加速体现在两方面——**运行时和工具链**上。

工具链加速部分采用和rspack和swc等一样的思路，就是内置化、集成化。插件化虽然拓展性好，但集成更快！

因此Bun提供了包管理、内置语言支持、环境变量管理等，将原本分散的功能集中在一起优化实现。

#### 更快的包管理

Bun作为包管理器比pnpm更快，下图来自Bun官方：

![](https://picgo-1308055782.cos.ap-chengdu.myqcloud.com/win11-new2023%2F10%2F20231025022615.png?imageSlim)

在本地的一个中型项目中，此前已经运行过一次`bun install`和若干次`pnpm install`的情况下，使用hyperfine跑分如下，可以看出相对pnpm都有惊人的4倍提升。

![](https://picgo-1308055782.cos.ap-chengdu.myqcloud.com/win11-new2023%2F10%2F20231025022617.png?imageSlim)

根据现有的资料，Bun作为包管理器的性能优势来自：

- 使用Zig而非JS实现，具有语言性能优势
- 根据环境选择最优的系统调用，这也是low-level语言带来的优势

根据官方的说法，**我们可以只把Bun作为包管理器而不作为运行时使用**，这也是我认为Bun现阶段能对现有工具链最大的提升。

作为包管理器它仍具备大部分情况下符合我们预期的行为：

- 使用项目中的`package.json`和`node_modules`，不会另起炉灶
- 使用自己的`bun.lockb`，采用二进制数据，不必序列化，存取更快
- 使用全局的安装缓存`~/.bun/install/cache`，尽量避免重复下载，并采用最快的系统调用进行复制或链接
  - macOS中采用复制，Linux中采用硬链接，因此mac上并不能节约硬盘空间
- 不使用`.npmrc`，而是使用自己的`bunfig.toml`配置，这点需要注意

#### 更快的测试

个人对测试不是很了解，这里不多做介绍。下图来自Bun官方：

![](https://picgo-1308055782.cos.ap-chengdu.myqcloud.com/win11-new2023%2F10%2F20231025022622.png?imageSlim)

#### 更快的运行时

Bun采用了Apple Webkit的JS Core引擎取代Node/Deno中的V8引擎，使用Zig作为开发语言，实现了更快的速度。其主要目的是加速那些原本运行在Node上的JS服务端应用，如SSR Worker、BFF等。

下图性能对比来自Bun官网：

![](https://picgo-1308055782.cos.ap-chengdu.myqcloud.com/win11-new2023%2F10%2F20231025022624.png?imageSlim)

需要阐明的是，作为Native语言，C/C++/Rust/Zig在性能上并没有明显的差异，Bun的性能提升除了JS Core外主要来自其内部实现较高的Native占比。

如下图所示，Node中JS实现高达60%以上，而Bun只有20%左右，这可能是Bun加速的重要原因。

![Bun的语言占比](https://picgo-1308055782.cos.ap-chengdu.myqcloud.com/win11-new2023%2F10%2F20231025022627.png?imageSlim 'Bun的语言占比')

![Node的语言占比](https://picgo-1308055782.cos.ap-chengdu.myqcloud.com/win11-new2023%2F10%2F20231025022633.png?imageSlim 'Node的语言占比')

Bun除了提供Node的API实现外，还提供了自己的API实现，以提供更高的性能：

- `Bun.serve()`：使用 _uWebSockets_ 实现，据称有5～10倍的性能提升
- `Bun.file()`：使用最优系统调用优化了文件API

### 作为构建工具

> _为什么Bun已经原生支持了JSX和TS还需要构建？_
> 很简单，**浏览器不支持**，最终代码需要在浏览器上而不是Bun上跑。

`Bun.build()` 可以将Bun作为构建工具使用（in Beta）。同样的，附上一张官方跑分图：

![](https://picgo-1308055782.cos.ap-chengdu.myqcloud.com/win11-new2023%2F10%2F20231025022636.png?imageSlim)

当然，现有的项目一般都依赖于围绕构建工具建立起的生态，所以甚至从webpack迁移到rspack或esbuild都是十分困难的事。

因此，使用Bun作为构建工具在现阶段个人感觉更多是一种技术探索和储备，并不具备生产价值。

Bun的构建API和esbuild类似（但不是Go而是Zig实现的，只是提供了相似的API），都是从一个入口处解析依赖，生成转译后的chunk代码。

```typescript
await Bun.build({
	entrypoints: ['./index.tsx'],
	outdir: './out'
})
```

如上面的代码所示，每个入口会生成一个JS文件。

完整的API定义如下，需要注意的是`loader`仅仅指内置的Loader，并不支持拓展。

```typescript
interface Bun {
	build(options: BuildOptions): Promise<BuildOutput>
}

interface BuildOptions {
	entrypoints: string[] // required
	outdir?: string // default: no write (in-memory only)
	format?: 'esm' // later: "cjs" | "iife"
	target?: 'browser' | 'bun' | 'node' // "browser"
	splitting?: boolean // true
	plugins?: BunPlugin[] // [] // See https://bun.sh/docs/bundler/plugins
	loader?: { [k in string]: Loader } // See https://bun.sh/docs/bundler/loaders
	manifest?: boolean // false
	external?: string[] // []
	sourcemap?: 'none' | 'inline' | 'external' // "none"
	root?: string // computed from entrypoints
	naming?:
		| string
		| {
				entry?: string // '[dir]/[name].[ext]'
				chunk?: string // '[name]-[hash].[ext]'
				asset?: string // '[name]-[hash].[ext]'
		  }
	publicPath?: string // e.g. http://mydomain.com/
	minify?:
		| boolean // false
		| {
				identifiers?: boolean
				whitespace?: boolean
				syntax?: boolean
		  }
}

type Loader = 'js' | 'jsx' | 'ts' | 'tsx' | 'json' | 'toml' | 'file' | 'napi' | 'wasm' | 'text'
```

#### Bun只提供Bundle功能

和esbuild或rspack不同，Bun并没有集成文件监听（热更新）和Dev Server，需要结合`--watch`和`Bun.serve()` 实现。这点上Bun并不能替代rspack或esbuild，提供完整的开发体验。

而`Bun.serve()`更多地是用于服务BFF用于渲染前端页面的，面向生产的前端开发这方面还是更推荐使用现有的脚手架。

### 模块解析策略

**Bun最吸引我的地方就是不再区分ESM和CJS模块规范，** 大家应该都理解在`import`中遇到一个间接的`require()`的崩溃。

需要注意的是，**只有将Bun作为运行时才能享受到这种模块解析策略**：

- 使用`import`导入不需要拓展名（可选），不区分大小写，将按顺序遍历以下拓展名
  - ts → tsx → js → mjs → cjs → json → 同名目录中index（index拓展名按上面排序）
- 使用统一的标准解析CJS和ESM，同时支持`require`和`import`，如下表所示：
  | 模块类型 | `require()` | `import * as` |
  | ---- | ------------------ | --------------------------------------- |
  | ESM | Module Namespace | Module Namespace |
  | CJS | `module.exports`对象 | `default`是`module.exports`，其中keys作为命名导出 |
- 对于`node_modules`中package的寻找策略与Node保持一致

## 体验Bun

这一部分我们使用Bun和Vite构建一个CSR React 单页应用。

首先安装Bun：

```bash
curl -fsSL https://bun.sh/install | zsh # 选择自己的终端
```

### 使用Vite创建全新应用

根据[官方引导](https://bun.sh/guides/ecosystem/vite '官方引导')初始化脚手架：（不得不说真的很快）

![](https://picgo-1308055782.cos.ap-chengdu.myqcloud.com/win11-new2023%2F10%2F20231025022641.png?imageSlim)

需要注意的是，使用Bun运行命令（包括`bunx`和`bun run`）都需要加上`—-bun`参数才会使用Bun而不是Node运行，否则Bun仅仅起到了包管理器的作用。

![](https://picgo-1308055782.cos.ap-chengdu.myqcloud.com/win11-new2023%2F10%2F20231025022645.png?imageSlim)

同样可以用于构建：

![](https://picgo-1308055782.cos.ap-chengdu.myqcloud.com/win11-new2023%2F10%2F20231025022651.png?imageSlim)

同样，我们使用hyperfine对比使用bun、pnpm、npm的构建时间。

第一组使用bunx, pnpx, npx运行`vite build`，结果有些出乎意料，npx居然是最快的，bunx的表现和npm相近，pnpx出乎意料地慢。

![](https://picgo-1308055782.cos.ap-chengdu.myqcloud.com/win11-new2023%2F10%2F20231025022647.png?imageSlim)

第二组测试带`--bun` 对时间产生的影响，不带参数表示仅将Bun作为包管理器，不会将shebang中的`!env node`调用为Bun。

结果显示使用Bun反而使时间变长了，what a shame!&#x20;

![](https://picgo-1308055782.cos.ap-chengdu.myqcloud.com/win11-new2023%2F10%2F20231025022657.png?imageSlim)

### 使用`Bun.build()`

我们同样使用hyperfine来测试使用Bun的打包效率。

这里我们使用Bun的CLI `bun build ./src/main.tsx --outdir dist` 和 `bunx vite build`来对比，发现`Bun.build()`非常快，比起Vite使用的rollup方案有24倍的加速。

![](https://picgo-1308055782.cos.ap-chengdu.myqcloud.com/win11-new2023%2F10%2F20231025022701.png?imageSlim)

### 使用EdenX创建全新应用

EdenX是字节内部的前端框架，外部可以使用Modern.js等价替代。

使用官方教程初始化一个EdenX项目：

```bash
bunx @byted/create@latest edenx-bun # 选择yarn和rspack
cd edenx-bun && rm -rf node_modules # 删除原有的node_modules

```

接着尝试使用Bun运行rspack的dev-server，使用`bun run --bun`指令出现了以下错误：

![](https://picgo-1308055782.cos.ap-chengdu.myqcloud.com/win11-new2023%2F10%2F20231025022702.png?imageSlim)

值得注意的是，这个关于`Module`错误出现频率较高，值得后续探究。

使用`bun run dev`（Node运行时）后问题解决，可以正常运行，Bun作为包管理器的优势还是很大的。

![](https://picgo-1308055782.cos.ap-chengdu.myqcloud.com/win11-new2023%2F10%2F20231025022709.png?imageSlim)

### 测试现有应用

这里拿之前的一个EdenX应用测试，在删除`node_modules`后使用Bun全新安装后rspack打包卡住。

猜测是依赖解析出现了问题，表现如下：

- Git Commit时husky报错
- 使用`* run build`进行rspack打包时（包括npm、pnpm和bun）均会卡在中间60%左右的位置

  - 使用Bun安装依赖，使用任何包管理器`run build` 都会卡住

    ![](https://picgo-1308055782.cos.ap-chengdu.myqcloud.com/win11-new2023%2F10%2F20231025022705.png?imageSlim)

  - 使用pnpm或yarn安装依赖，使用`bun run build`正常运行

    ![](https://picgo-1308055782.cos.ap-chengdu.myqcloud.com/win11-new2023%2F10%2F20231025022715.png?imageSlim)

## Bun的技术栈和生态

- JSCore：Apple Webkit中使用的JS引擎
- Zig语言：low-level语言

### 插件和loader

> ⭐这里的插件和loader通常指将Bun作为构建器使用的场景，同时也要运行时能力作基础

由于Bun也可以兼职Bundler，因此也有一套基于esbuild的插件API，用于拦截导入行为并执行自定义操作。使用其他esbuild插件时应注意兼容性，因为Bun并不支持全部API。

同样地，Bun也支持loader，其定义也是`Plugin`类型，用于拓展Bun支持的类型。

与Node + Bundler的方案不同，**Bun中定义的插件可以无需构建转译过程，直接在运行时层面支持loader定义的类型**。

## 横向对比

### 与Node生态的兼容性

Bun is designed as a drop-in replacement for Node.js. It natively implements hundreds of Node.js and Web APIs, including `fs`, `path`, `Buffer` and more.

- 实现了Node中的JS API
- 完全兼容现有的`node_modules`的组织方式
- `bun create` == `pnpm create`

### 与Deno的对比

Bun和Deno采用了相似的技术栈，如下表所示，为什么Bun相对Deno仍有较大的性能领先（根据官网对比图）是值得探究的。

|          | Bun          | Deno |
| -------- | ------------ | ---- |
| 主要语言 | Zig (C-like) | Rust |
| 编译平台 | llvm         | llvm |
| 引擎     | JS Core      | V8   |
