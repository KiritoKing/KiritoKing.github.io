---
title: 前端工具链之包管理器 - pnpm
category: Development
date: '2023/06/09 08:40:25'
alias: post/Development/pnpm/index.html
---

pnpm（performant npm）是一个主打**快速和省空间**的包管理器。它使用**改进的非扁平node_modules目录**和**硬链接和符号链接**优化依赖管理过程，个人体验下来比起yarn-v2的PnP机制会遇到的兼容性问题更少，**是我现阶段最喜欢的包管理器**。

<!-- more -->

> 如果对npm和yarn-v2没有了解，建议先去按顺序看对应的那两篇文章，会更好地理解这里地一些概念。

既然自称perfomant，就需要跑分作为证据。下图为pnpm对比各包管理器（npm-v9,yarn-PnP）的性能对比图：

![image-20230505010021849](https://picgo-1308055782.cos.ap-chengdu.myqcloud.com/picgo-new/202305050100867.png)

- 可以看出，pnpm采用node_modules的曲线救国方案**并不是全方位领先的**
- 在**有cache**的情况下的安装，pnpm由于**硬链接**机制避免了I/O操作，有较大的领先幅度
- 在**没有lockfile**的情况下，yarn和pnpm由于都需要且依赖于lockfile，要先构建lockfile，因此速度较慢
- 在**不需要node_modules**的情况下，**PnP在大部分情况下都遥遥领先**（兼容性换的）

> 总得来说，**pnpm是兼容性、性能和空间三者一个较好的平衡方案**。

## 如何安装pnpm

根据pnpm官方的指导，和yarn2一样，都建议使用node内置的corepack工具安装pnpm。

```shell
$ corepack prepare pnpm@latest --activate
$ pnpm -v
```

如果安装成功，可以看到pnpm版本如下：

![image-20230608233748437](https://picgo-1308055782.cos.ap-chengdu.myqcloud.com/picgo-core/2023/06/20230608233749.png)

## pnpm如何改进npm

首先，个人觉得pnpm走上了和yarn2不同的一条路，它们**都从npm/classic-yarn出发，尝试从不同方向、用不同方案去改进依赖管理的体验和性能**。最终，yarn选择了完全开辟一条新的路子（PnP），而pnpm选择了在原有架构（node_modules）上进行修补和改进，具体一点就是它们都用自己的方法解决了原有方案的问题，如**幽灵依赖和依赖冲突**（这两点是你可以在博客中重点体会二者解决方案差异的点）。

因此，这里**主要讨论的是pnpm相对于npm/classic-yarn的改进，而不是和yarn2的对比**。然而，PnP和pnpm的普及率似乎昭告了pnpm是暂时成功的那一个。

### pnpm安装依赖的过程

pnpm安装依赖项（以`pnpm install`为例）一般分为三步：

1. 解析（resolve&fetch）：解析当前项目需要哪些依赖，应该从哪些地方获取，依赖又依赖了哪些依赖等等，如果本地缓存没有就从远程仓库下载，和其他包管理器行为一致（也会调用和生成lockfile）
2. 目录结构计算：**根据解析依赖的结果生成node_modules结构**，具体结构如下文阐述
3. 链接依赖项：将node_modules中的依赖通过**硬链接**的方式链接到**全局缓存**中，节约磁盘空间

值得注意的是，在pnpm中这三个阶段是在多任务上并行的（类似于CPU的动态流水线），可以节约大量时间，如下图所示：

![image-20230608215545551](https://picgo-1308055782.cos.ap-chengdu.myqcloud.com/picgo-core/2023/06/20230608215546.png)

以上这三个阶段将在后文反复地被提到，请一定在脑子里有个大致的印象。

### 非扁平的node_modules

使用 npm 或 Yarn Classic 安装依赖项时，所有的包都被提升到模块目录的根目录。 这样就导致了一个问题 —— **幽灵依赖**，源码可以直接访问和修改依赖，而不是作为只读的项目依赖。

pnpm 的解决方案是**使用符号链接将项目的直接依赖项添加到模块目录的根目录中**。说起来有点拗口，实际上就是你的node_modules根目录中不再将所有的次级依赖平铺出来，而是只有你当前项目的**直接依赖**。

这样做的好处是显而易见的——**解决了“幽灵依赖”问题**。但是你先别急，pnpm和npm-v2的解决方案可不一样，它没有傻傻地嵌套安装所有所需的依赖，而是通过一些特殊的目录结构加上**符号链接**将嵌套的层数控制在了两层（一个可接受的范围内）。

![img](https://picgo-1308055782.cos.ap-chengdu.myqcloud.com/picgo-new/202304270054060.jpeg)

那么它链接到了哪里呢？答案是`node_modules/.pnpm/<name>@<version>/node_modules/<name>`，所有的包**真正的存储目录是.pnpm中对应文件夹的node_modules下的对应名称文件夹**（有点拗口）。

你或许也注意到了，包本身存放的地方并没有在`<name>@<version>`根目录下，而是在其node_modules中和其他依赖并列存放，这是为什么呢？

- **不像PnP，pnpm并没有改动node的包解析模式**（依然是层层遍历目录的模式），因此依赖是在包的内部 `node_modules` 中或在任何其它在父目录 `node_modules` 中是没有区别的。
- 由于node会自动向上查询，因此包本身及其依赖的包被放置在一个文件夹下可以优化查询和解析过程（只包含它依赖的包）
- 这样的结构（名称@版本）可以兼容同一依赖的不同版本，顺带**解决了依赖冲突的问题**

pnpm在实际管理包的物理存储时仍采用了**平铺管理**的模式：**在.pnpm中的所有包都是平铺的**，但是因为外部访问不到所以没有关系。

但这还不是全部，因为.pnpm中仍然有链接的存在：假想我们有一个包A，它依赖了B和C，那么**在`.pnpm/A/node_modules`中就也有符号链接形式的B和C，指向.pnpm目录下真正的B和C**。

以上就是pnpm的非扁平目录的全部真相了，虽然乍一看这种嵌套的node_modules会有点奇怪，但它也有些好处：

- 首先就是**你在使用的时候其实完全不用关心它如何维护node_modules**
- 它解决了幽灵依赖问题，也使用软链接解决了重复安装依赖的问题
- **比起PnP，它更能完美地兼容Node生态**，因为node在解析包时会自动忽略符号链接，解析到真正的地址上
- 不管依赖的深度和数量如何变化，pnpm将始终维持这样至多两层的嵌套结构

> 总结：pnpm使用了**表层嵌套+底层平铺**的方法组织目录结构，同时用**符号链接**作为技术实现，这样既**解决了“幽灵依赖”问题**，又**维持了两层嵌套结构的稳定性**，是非常巧妙的设计。

现在，我们在实践中看看pnpm的node_modules结构。

```shell
mkdir pnpm-test
cd pnpm-test
pnpm init
pnpm add express
```

打开node_modules看看：

![image-20230608222543642](https://picgo-1308055782.cos.ap-chengdu.myqcloud.com/picgo-core/2023/06/20230608222545.png)

可以看到express确实以符号链接（在Windows中以junction的方式实现）的形式存在在根目录，且没有其他的间接依赖存在。

其中`.modules.yaml`里面存放着间接依赖的列表，如下图所示：

![image-20230608222810305](https://picgo-1308055782.cos.ap-chengdu.myqcloud.com/picgo-core/2023/06/20230608222811.png)

双击express，我们就进入了真正的存放目录（但上方的路径并没有变化），因此为了观察真正的目录结构我们需要进入.pnpm中，发现这里的包确实都是平铺的，且与`.modules.yaml`中的顺序是对应的：

![image-20230608223056235](https://picgo-1308055782.cos.ap-chengdu.myqcloud.com/picgo-core/2023/06/20230608223057.png)

我们找到express，打开其目录只有一个node_modules，进入这个node_modules，我们可以看到和前面的叙述一致：**所有间接依赖以符号链接的形式放在node_modules中供调用，其本体也存储在这个node_modules/express目录中**。

这里补充解释一下前面说的“包本身及其依赖的包被放置在一个文件夹下可以优化查询和解析过程”就是指它本体存储中其实不含有node_modules（比如这里node_modules/express中就不再有node_modules），因此根据node规则就会自动向上一级目录的node_modules中寻找依赖，这里全是它自己的依赖而不像.pnpm中有全部的依赖，就减小了查找范围，优化了性能。

![image-20230608223206086](https://picgo-1308055782.cos.ap-chengdu.myqcloud.com/picgo-core/2023/06/20230608223207.png)

#### 如何处理peerDeps

由于非扁平结构和链接特性，pnpm 中任何一个包都拥有自己的一组确定版本的依赖项，而不会像扁平依赖中受到其他包的影响。但在处理`peerDependencies`时是一个例外：**peer 依赖项（peer dependencies）会从依赖图中更高的已安装的依赖项中解析（resolve），因为它们与父级共享相同的版本**。

#### Windows中的符号链接

Windows直至Vista（NT6）之前都完全不支持符号链接（symbolic link），后面的符号链接不能说不能用，只能说有问题。因此pnpm采用了junction方式（类似于快捷方式）来在Windows上实现符号链接的功能。

### 硬链接

看了上面的介绍后，你内心可能还有个疑问：就这？说好的省空间呢？这只是把依赖用软链接组织起来了呀，.pnpm中该装的依赖铺平了不是一个不少吗？

别急别急，马上就介绍pnpm降低硬盘占用的杀手锏：**硬链接机制 —— 让所有的包都只存一份**！

实际上在上面提到的“本体”（如node_modules/express中存放的实际文件）都是**硬链接（hard link）**，**指向根目录（Windows下就是当前盘符根目录）中的.pnpm-store**这个目录。

> 以Linux为例，硬链接（hard link）实际上就是指硬链接的n个文件有完全相同的inode结点；而软链接/符号链接则是指两个文件有不同的inode结点，一份为本体，一份为引用（即inode结点中存放的是指向另一份文件的指针）。

上面的指向图中其实已经能看出硬链接的过程，但下面这张图更清晰地反映了引入硬链接后整个node_modules的实际引用箭头：

![img](https://picgo-1308055782.cos.ap-chengdu.myqcloud.com/picgo-new/202305050106556.png)

- 可以看出，按照非扁平结构，node_modules中只有直接依赖，.pnpm中平铺摆放着当前项目的所有依赖，而其中每个包的node_modules存放着每个包**它自身和它声明的依赖**
- .pnpm中包自身的本体实际上指向了全局的（或分区的）.pnpm-store中的对应包，**这才是真正存储包的地方，因此全局只会存储一份包**
- 由于硬链接的缘故，右键查看`node_modules`仍能看到其占用的真实容量，但实际上**只占用了一份空间**（也就是一个磁盘上两个位置的同一份空间）。（来源：[pnpm-FAQ](https://pnpm.io/zh/faq)）

#### .pnpm-store的结构

pnpm在处理全局缓存`~/.pnpm-store/v3/files`时并没有直接将整个包作为存储单位放在缓存中，而是更进一步，将其拆分为**一个个文件块（chunk）**进行存储，然后再对其进行哈希和索引操作。

这样做的好处就是不仅同一个版本的包可以只存储一份内容，甚至**不同版本的包也可以通过diff算法实现增量更新存储**。

直观的说就是，如果你用到了某依赖项的不同版本，只会将不同版本间有差异的文件添加到仓库。例如，如果某个包有100个文件，而它的新版本只改变了其中1个文件。那么 `pnpm update` 时只会向存储中心额外添加1个新文件，而不会因为仅仅一个文件的改变复制整新版本包的内容。

pnpm采用的这种组织方式叫做**content-addressable（基于内容的寻址）**，如下图所示：

![image-20230608234845698](https://picgo-1308055782.cos.ap-chengdu.myqcloud.com/picgo-core/2023/06/20230608234847.png)

这样解释可能还是不好理解，我们直接打开对应目录，随便看一个文件试试：

![image-20230608235331358](https://picgo-1308055782.cos.ap-chengdu.myqcloud.com/picgo-core/2023/06/20230608235332.png)

- `files`中还是按照Hash（SHA-512）的格式进行组织和存储，前两位用于目录，后面的位用于文件名
- **每个文件块实际上对应一个完整的文件**，而没有使用等分法（一般是一个完整的JS模块），这也有助于增量更新
- 之所以叫“基于内容的寻址”是有别于“基于文件名寻址”，它通过计算内容的HashSum来得到内容的地址，这样就可以保证让相同的文件共享同一份硬链接

#### 操作全局store

使用`pnpm store <cmd>`命令可以操作全局store，这也是pnpm特有的命令。

- `add`：直接向store全局添加一个包
- `prune`：删除没有使用的包
- `path`：返回当前Store的路径

## monorepo支持

> 这里后续补充pnpm搭配rush的monorepo体验，对比yarn+lerna的体验。

## 兼容性操作

- 由于pnpm禁止了幽灵依赖，可能在已有的项目上引起依赖缺失问题，直接`pnpm add`对应的包添加即可
- 实在没有其他解决方案的情况下，在`.npmrc`配置文件中添加`nodeLinker=hoisted`将创建一个和npm类似的扁平化目录（如React Native开发或不支持符号链接的部署环境）

## 参考资料

- [项目初衷 | pnpm](https://pnpm.io/zh/motivation)
- [平铺的结构不是 node_modules 的唯一实现方式 | pnpm](https://pnpm.io/zh/blog/2020/05/27/flat-node-modules-is-not-the-only-way)
- [基于符号链接的 node_modules 结构 | pnpm](https://pnpm.io/zh/symlinked-node-modules-structure)
- [Pnpm: 最先进的包管理工具 - 知乎 (zhihu.com)](https://zhuanlan.zhihu.com/p/404784010)
- [聊聊前端包管理器对比Npm、Yarn和Pnpm-yarn和npm (51cto.com)](https://www.51cto.com/article/702067.html)
- [精读《pnpm》 - 掘金 (juejin.cn)](https://juejin.cn/post/7131903244434931748#heading-1)
- [pnpm 原理解析 - 掘金 (juejin.cn)](https://juejin.cn/post/7158631927992287263#heading-14)
- [都2022年了，pnpm快到碗里来！ - 掘金 (juejin.cn)](https://juejin.cn/post/7053340250210795557#heading-11)
