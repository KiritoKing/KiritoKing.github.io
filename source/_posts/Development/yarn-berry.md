---
title: 前端工具链之包管理器 - yarn-berry与PnP
category: Development
date: '2023/06/09 05:12:49'
excerpt: >-
  这篇文章简要叙述了yarn的版本变更历史，重点阐述了yarn2的PnP机制的设计思路和实际应用，并提出了一些解决相关兼容性问题的方法，方便老项目逐步升级到新版本yarn。
alias: post/Development/yarn-berry/index.html
---

yarn是一个Facebook出品的老牌包管理器，相对于npm要新一点，但相对于pnpm又要旧一点，也已经经过了多个**大版本迭代**。

## Classic Yarn (yarn-v1)

> 首先声明**如果是新创建的项目，不推荐任何人使用Classic Yarn进行管理**，使用npm-v8+、yarn-v2+或者pnpm都是更好的选择。（是的，新的npm确实优于Classic Yarn）

yarn和npm-v3一样采用了**扁平化依赖**结构，即所有依赖平铺在根目录下，避免了重复安装依赖的问题。

![img](https://picgo-1308055782.cos.ap-chengdu.myqcloud.com/picgo-new/202305050105922.png)

yarn-v1和npm-v4是同期的产品，yarn相比npm-v4来说有如下优点：

- 离线模式（offline mode）：允许完全使用本地缓存安装包，完全不请求远程仓库（如果没有对应包将报错）
- :star: **引入lock文件（yarn.lock）**：使用lock文件记录安装过程、包的详细信息，让每个人安装的依赖树都是确定和一致的
- 安装过程优化：
  - **并行化**多个安装过程，加快安装速度
  - 下载软件包时，会进行更好的排序，避免“请求瀑布”，最大限度提高网络利用率
  - 安装依赖的过程中，不会因为某个单次网络请求的失败导致整个安装挂掉

## yarn-v2+（Berry）

yarn的新版（Berry）和旧版（Classic）的工作方式截然不同，新版本中比较显著的新特性有：**monorepo支持，PnP机制**，零依赖安装等。这里将重点介绍PnP机制，monorepo相关内容请移步[这篇文章](https://chlorinec.top/posts/3828472050/)。

### 安装并启用Berry

根据[官方文档](https://yarnpkg.com/getting-started/install)的指引，对于node>=16.10版本，推荐使用corepack进行安装，如果你对corepack还不熟悉，可以移步我关于[npm]()的文章。这里默认你已经学会并启用了corepack。

在终端中运行下列指令安装最新版的yarn。

```shell
$ corepack prepare yarn@stable --activate

# 安装完成后检查版本
$ yarn -v
```

如果安装成功，将会提示3.x的版本，如下图所示：

![image-20230608160326332](https://picgo-1308055782.cos.ap-chengdu.myqcloud.com/picgo-core/2023/06/20230608160328.png)

接下来，我们使用yarn2去管理项目和依赖：

- 创建新项目：`yarn init -2`
- 迁移现有项目：`yarn set version stable`，然后运行`yarn install`更新依赖树
  - 在现有项目中启用PnP（这可能导致兼容性问题）
    - 先运行`yarn dlx @yarnpkg/doctor`来检测当前已经安装的依赖是否会产生兼容性问题
    - 如果没有任何问题，打开或新建`.yarnrc.yml`，设置`nodeLinker: "pnp"`即可启用PnP

> 需要注意的是，**默认情况下`yarn init`仍是1.x的模式**，除非你指定yarn版本为2（如 `yarn init -2`）才会启用Zero-Installation特性。

这里为了演示，我们将**使用yarn2创建一个新项目**：

```shell
$ yarn init -2
```

上述命令将为我们在当前目录创建`package.json`文件，并写入一些必要的信息（如项目信息、包管理器信息等），`-2`选项会为我们完成**零安装**的初始化工作，包括yarn注入（hydrate）和各种相关配置等，最终我们得到一个如下的目录。

![image-20230608161652913](https://picgo-1308055782.cos.ap-chengdu.myqcloud.com/picgo-core/2023/06/20230608161654.png)

### 了解PnP机制

PnP是yarn2中默认启用的新的包解析方式，我们先试着安装loadash到我们的项目（运行`yarn add lodash`），再检查目录树：

![image-20230608161937082](https://picgo-1308055782.cos.ap-chengdu.myqcloud.com/picgo-core/2023/06/20230608161938.png)

我们惊讶地发现居然**没有node_modules的存在**！我们明明安装了新包，但是却没有生成node_modules目录，而是在.yarn/cache中增加了一个**压缩包**，这就是**yarn2的PnP技术**。

> Plug'n'Play（即插即用）于2018年9月推出，是Node的新模块安装策略。基于其他语言的先前工作（例如 PHP 的自动加载），它以几乎完全向后兼容的方式实现了常规的 CommonJS `require` 工作流程。

要知道为什么PnP机制比node_modules更好，我们就要知道node_modules为什么不好：

- node_modules是一个很“重”的目录，里面有大量的文件，**寻找、生成和删除都非常花时间**

![19b3ff266bc8f328a8f61732d15c6a0](https://picgo-1308055782.cos.ap-chengdu.myqcloud.com/picgo-new/202304270103999.jpg)

- 在Node中其实没有“包”（package）这个概念，它只是按照解析路径（一层层地寻找node_modules）寻找对应名称的文件，这导致了安装和调用都是I/O频繁的任务（都需要遍历目录）；也不知道这个文件应不应该被访问（幽灵依赖，即没有添加到`package.json`中的包也可能被访问并产生潜在的问题）

yarn认为，造成上述问题的**根本原因是node中并没有包的概念，但是包解析却交给了node而非掌握依赖树信息的包管理器**（如yarn），因此**yarn要代替node去做包解析的工作，直接告诉node应该调用哪个包、这个包在哪里**，这就是Plug'n'Play机制的核心思想。

#### PnP如何工作

Plug'n'Play**替Node完成了包解析的工作**，它将直接告诉Node需要的包是哪个，在哪里等信息；同时它为了优化依赖构建过程，**直接干掉了node_modules目录**，使用了新的存储结构，加快了安装速度。

> 值得注意的是，由于PnP机制完全替换了基于扁平化的node_modules结构的解析机制，因此**扁平依赖的那些问题如依赖版本冲突、幽灵依赖等问题自然也就不存在了**。
>
> - 因为PnP不再平铺所有依赖，因此也不限制一个依赖只能安装一个版本，每个包都可以安装自己需要的依赖版本（仍会尽可能避免重复，只有在不兼容的时候才会安装两个），这样就解决了依赖版本冲突的问题
> - 同理，由于不再有node传统的解析方式，解析完全交给了PnP，因此幽灵依赖问题也自然消失了。

##### .pnp.cjs

yarn2**使用`.pnp.cjs`替代node_modules来帮助node解析包**：`.pnp.cjs`中包含了各种映射信息，并告诉node如何使用PnP机制去使用包

- `.pnp.cjs`中包含了包的依赖信息
  - 当前依赖树中包含了哪些依赖包的哪些版本
  - 这些依赖包是如何互相关联的
  - 这些依赖包**在文件系统中的具体位置**
- `.pnp.cjs`的出现替代了node_modules，使yarn只需要创建一个文本文件（而不是潜在的数万个），这优化了I/O性能，减小了路径的复杂度，加快了项目的启动（`.pnp.cjs`使node不用再使用古老的层层遍历方法去寻找包）
  - 安装项目时，yarn不会创建node_modules，而是在`.pnp.cjs`中记录下载缓存的位置，减小了安装时的I/O开销（复制和解压）和空间占用
  - 调用包时，yarn通过特殊的resolver处理`require`函数，让node直接去对应位置调用包，避免了目录遍历的I/O开销
- 为了让node可以使用PnP，有以下途径
  - 使用`package.json`中的`script`，其中的所有命令都会通过yarn和PnP运行
  - 显式地调用`yarn node`命令
  - 在JS脚本中则需要调用`require('./.pnp.cjs').setup();`来初始化PnP

这里由于代码太长就直接放截图了，放在开头的就是项目和依赖的基本信息，后面的一大串就是PnP的具体实现（大概）

![image-20230608165244438](https://picgo-1308055782.cos.ap-chengdu.myqcloud.com/picgo-core/2023/06/20230608165245.png)

##### 缓存机制

通过刚才的例子我们可以看出，我们添加的loadash包放在了.yarn/cache中，并**作为zip压缩文件存储**（而不是有很多小文件的文件夹）。与之类似的，所有从远程存储库下载的包都会存储在本地缓存内（默认是.yarn/cache），下次使用同样的包时将直接使用缓存内下载的包（具体过程在`.pnp.cjs`中有提到）。

> 在yarn2中，离线缓存（offiline cache）与PnP机制紧密绑定，因此无法完全禁用，但**完全删除缓存是安全的**，它将在下次`yarn install`时重建。除此之外，使用`cacheFolder`属性可以定义缓存位置。

- 清理缓存：yarn会自动清理不使用的包，也可以通过`yarn cache clean`手动清理；全局缓存则需要通过`yarn cache clean --mirror`来清理
- 全局缓存：yarn默认情况下不会共享全局缓存（而是将全局下载缓存复制到项目高速缓存中），如果设置`enableGlobalCache`为`true`，就会使项目共享全局缓存，即直接使用`~/.yarn/cache`作为项目的高速缓存而不再复制
  - 使用**局部缓存**的好处是可以**开启零安装特性**
  - 使用**全局缓存**的好处是可以避免复制缓存
- 硬链接：可以开启硬链接功能以降低磁盘空间占用
  - `yarn.lock`中的`linkType: Hard`表示这里的包允许进行硬链接和其他操作（如unplug）；反之若为`Soft`则表示这里的包并不是原样本，只允许按原样调用该包
  - `.yarnrc.yml`中的`nmMode: "hardLinksGlobal"`才表示开启硬链接（多份文件引用一份空间），**该功能默认关闭**

#### 实操PnP

下面我们将在yarn3中用Vite创建一个React应用具体来体验PnP是如何工作的，如何开启自己的PnP工作流。

根据Vite官方的指导（所使用的打包器Rollup已经支持PnP）：

```shell
$ yarn create vite # 使用create模板语法

# 初始化项目
$ cd yarn-vite
$ yarn install
```

运行过程截图如下：

![image-20230608192253275](https://picgo-1308055782.cos.ap-chengdu.myqcloud.com/picgo-core/2023/06/20230608192254.png)

安装完成后，我们会得到一个这样的目录：

![image-20230608192815198](https://picgo-1308055782.cos.ap-chengdu.myqcloud.com/picgo-core/2023/06/20230608192816.png)

可以看到，这里仍是有一个node_modules文件夹的，里面存放的是vite的可执行文件；同时.yarn中还有部分unplugged的包（排除在PnP压缩包之外）。这些都是**PnP的兼容性措施**，但是我们注意到这里并没有指定`.yarnrc.yml`，说明部分操作可能是写在包中或者`yarn.lock`/`.pnp.loader.mjs`中的。

具体的兼容性措施相关内容将留作后文，这里我们只需要了解一个PnP项目基础的结构即可。

```shell
$ yarn run dev
```

运行项目检验：

![image-20230608193152144](https://picgo-1308055782.cos.ap-chengdu.myqcloud.com/picgo-core/2023/06/20230608193153.png)

##### 配置IDE

在前面的PnP机制中我们了解到，和node_modules不同，PnP中所有的包都放在了缓存的**压缩包**中，因此IDE不能直接读取。

在VSCode中我们也确实遇到了“找不到模块”的错误，如下图所示：

![image-20230608200744585](https://picgo-1308055782.cos.ap-chengdu.myqcloud.com/picgo-core/2023/06/20230608200745.png)

根据官方的提示，我们按步骤运行以下操作：

- 为VSCode安装[ZipFS](https://marketplace.visualstudio.com/items?itemName=arcanis.vscode-zipfs)扩展
- 运行 `yarn dlx @yarnpkg/sdks vscode` 初始化IDE集成
- VSCode会弹出提示：“启用工作区TypeScript版本”，选择“确定”即可

> **最终我也没有解决这个报错问题**，是使用`nodeLinker: "node-modules"`解决的。（~~还是推荐pnpm~~）
>
> 个人猜测是Vite与PnP的兼容性导致的，问题可能出在tsconfig中某一环，因为我使用之前例子中的`require`和此前在[monorepo改造](https://chlorinec.top/posts/3828472050/)一文的开发过程中都并没有报错，而在Vite+pnpm的实践中也没有报错。
>
> **如果有谁解决了这个问题不嫌麻烦可以联系我一下QaQ**（kiritoclzh@gmail.com）

### 什么是零安装

有了PnP替代node_modules作为依赖解析的方案后，yarn想更进一步：**既然我已经解决了node_modules太重的问题，为什么我不能直接干掉项目的安装过程（`install`过程）呢？**这就是所谓的**“零安装”（Zero-Installs）**。

其实零安装的实现思路非常简单，就是**把所有模块都放在存储库重一起管理**，我知道这听起来很蠢，但这是因为之前的node_modules中几万个零碎的文件和目录让这几乎是不可实现的，**在yarn中基于PnP的依赖解析和压缩包（zip或tar）管理的缓存让这变得可能**。（至少传一个很大的JS和很多压缩包比一个几十层的目录要轻松很多）

> 对于一个中到大型项目，Git不支持一个包含135k个未压缩文件的node_modules文件夹（约1.2GB），但支持包含2k个Zip文件的.yarn/cache缓存目录（约139MB）。 ——数据来自yarn官网

零安装带来了一个显著的好处：解决了困扰前端项目许久的**依赖不确定**问题，我现在直接让项目带着依赖，省去了安装的过程，就能保证所有人安装的依赖都是一样的了，甚至连`yarn.lock`都不用了（因为不用安装）。

> 注意：要启用零安装，PnP是必须的，且在`.gitignore`中不能包含`.pnp.cjs`和`.yarn`。但是否启用零安装，主要取决于你**对依赖确定性和存储库大小的重视程度**。

### 插件化

yarn-v2在构建过程中采用了模块化的思想，使得开发者可以开发插件来调用这些模块化的API。这是一个很底层的设计，yarn团队利用插件重构了yarn-v2的大部分功能，甚至`yarn add`和`yarn install`实际上也是预装的插件。由此可见插件可以做到多少事！

插件可以在任意一个生命周期调取Hook来改变yarn的行为：包安装，如解析（resolve）->请求（fetch）或者命令执行。

- 解析器（resolvers）：解析器负责将`package.json`中指定的**版本范围转换成一个确定的版本**
- 请求器（fetcher）：请求器负责找到上一步（resolve）得到的包名和版本应该在哪里获取资源，可以是网络也可以是本地缓存
- 添加命令：每个插件都可以添加自己的命令，就像`yarn add`那样
- 注册生命周期钩子

#### 插件推荐

可以通过 `yarn plugin import <name>` 命令来安装插件。

下面是一些**官方**插件：

- [**typescript**](https://github.com/yarnpkg/berry/tree/master/packages/plugin-typescript)：改进TypeScript体验（例如，在需要时自动添加 `@types` 包作为依赖项）【在yarn4中将默认集成】
- [**workspace-tools**](https://github.com/yarnpkg/berry/tree/master/packages/plugin-workspace-tools)：改进monorepo体验，添加更多`workspace`相关命令

### 解决兼容性问题

由于PnP是比较激进的机制，它完全取消了node_modules，出现一些兼容性问题在所难免（虽然它也带来了一些诱人的好处和新概念）。

#### `.yarnrc.yml`

好在`.yarnrc.yml`提供了丰富的配置项，可以解决大部分的兼容性问题。

以下是一些常用的配置项（给出的值是默认值）

- `cacheFolder: "./.yarn/cache"`：指定yarn cache的目录（启用全局缓存请用`enableGlobalCache`）
- `defaultSemverRangePrefix: "^"`：添加包时默认记录的版本修饰符（默认为锁定Patch）
- `enableGlobalCache: false`：如为`true`将忽略缓存路径设置，将该高速缓存文件存储到共享相同配置的所有本地项目共享的文件夹中（~/.yarn/cache）
- `globalFolder: "./.yarn/global"`：全局文件夹位置
- `httpProxy: "http://proxy:4040"` & `httpsProxy: "http://proxy:4040"`：代理设置（国内常用）
- `nmMode: "classic"`：控制存储项目本地缓存的方式，适用于空间敏感用户
  - `classic`：复制模式
  - `hardlinks-global`：硬链接到全局缓存
- `nodeLinker: "pnp"`：控制安装包的方式（所谓Linker就是将包的路径和调用连接起来的方式）
  - `pnp`：yarn2默认的机制，如上文所述
  - `pnpm`：使用pnpm的硬链接方式
  - `node_modules`：回退到npm/yarn-classic的方式，生成node_modules文件夹，一般是**解决兼容性问题的终极杀手锏**，但也放弃了很多性能优势
- `npmRegistries:`：控制npm源
- `pnpMode: "strict"`：控制能否调用到没有在`package.json`中声明但在npm/yarn-classic中由于提升到顶层可以访问的包（幽灵依赖）

  - `strict`：不允许访问“幽灵依赖”
  - `loose`：允许访问“幽灵依赖”，这**可能是部分兼容性问题的解决方案**

- `yarnPath: "./scripts/yarn-2.0.0-rc001.js"`：`yarnPath`是目前在项目中安装Yarn的首选方式，因为它可以确保您的整个团队将使用完全相同的Yarn版本，而无需单独更新（在`yarn init -2`时就会默认生成这个设置项）

#### unplug

`yarn unplug <pkg>`主要用于将某个包解压出来，以便修改代码。

#### @yarn/pnpify

PnP的设计理论上与所有使用原生`require`API的包兼容，但有些包喜欢自己实现Node解析过程，因此它们在不做特殊适配的情况下不能与PnP兼容。`pnpify`这个包就提供了一种解决该问题的方案。

- 当一个不兼容PnP的项目尝试访问node_modules目录时，`pnpify`会拦截该请求，并转换成对PnP API的调用，再返回一个模拟的node_modules目录
- 它并不完美，它不能提供所有的PnP功能，但可以作为兼容性方案

使用`pnpify`需要以下步骤：

1. 添加依赖项：`yarn add @yarnpkg/pnpify`
2. 使用`pnpify`运行不兼容的工具，如：`yarn pnpify tsc`

## 参考资料

- [Migration | Yarn - Package Manager (yarnpkg.com)](https://yarnpkg.com/getting-started/migration)
- [Plug'n'Play | Yarn - Package Manager (yarnpkg.com)](https://yarnpkg.com/features/pnp)
- [Yarn 的 Plug'n'Play 特性 (loveky.github.io)](https://loveky.github.io/2019/02/11/yarn-pnp/)
- [Zero-Installs | Yarn - Package Manager (yarnpkg.com)](https://yarnpkg.com/features/zero-installs)
- [Offline Cache | Yarn - Package Manager (yarnpkg.com)](https://yarnpkg.com/features/offline-cache)
- [Yarn 2 使用体验 | Ocavue's Blog](https://ocavue.com/yarn-2-first-impression-zh/#plug-n-play)
- [Yarn 2的安装与使用 (liuwenzhuang.github.io)](https://liuwenzhuang.github.io/2020/08/07/Yarn2-install-and-usage.html)
