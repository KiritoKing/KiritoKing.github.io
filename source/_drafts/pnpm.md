---
title: 前端工具链之包管理器 - pnpm
tags:
  - 工具链
  - 包管理
  - pnpm
  - 硬链接
---

pnpm（performant npm）是一个主打**快速和省空间**的包管理器。它使用**改进的非扁平node_modules目录**和**硬链接和符号链接**优化依赖管理过程，个人体验下来比起yarn-v2的PnP机制会遇到的兼容性问题更少，**是我现阶段最喜欢的包管理器**。

<!-- more -->

既然自称perfomant，就需要跑分作为证据。下图为pnpm对比各包管理器（npm-v9,yarn-PnP）的性能对比图：

![image-20230505010021849](https://picgo-1308055782.cos.ap-chengdu.myqcloud.com/picgo-new/202305050100867.png)

- 可以看出，pnpm采用node_modules的曲线救国方案**并不是全方位领先的**
- 在**有cache**的情况下的安装，pnpm由于**硬链接**机制避免了I/O操作，有较大的领先幅度
- 在**没有lockfile**的情况下，yarn和pnpm由于都需要且依赖于lockfile，要先构建lockfile，因此速度较慢
- 在**不需要node_modules**的情况下，**PnP在大部分情况下都遥遥领先**（兼容性换的）

> 总得来说，**pnpm是兼容性、性能和空间三者一个较好的平衡方案**。

## 如何安装pnpm



## pnpm如何改进npm

首先，个人觉得pnpm走上了和yarn2不同的一条路，它们**都从npm/classic-yarn出发，尝试从不同方向、用不同方案去改进依赖管理的体验和性能**。最终，yarn选择了完全开辟一条新的路子（PnP），而pnpm选择了在原有架构（node_modules）上进行修补和改进。因此，这里**主要讨论的是pnpm相对于npm/classic-yarn的改进，而不是和yarn2的对比**。

然而，PnP和pnpm的普及率似乎昭告了pnpm是暂时成功的那一个。

### pnpm安装依赖的过程

pnpm安装依赖项（以`pnpm install`为例）一般分为三步：

1. 解析（resolve&fetch）：解析当前项目需要哪些依赖，应该从哪些地方获取，依赖又依赖了哪些依赖等等，如果本地缓存没有就从远程仓库下载，和其他包管理器行为一致（也会调用和生成lockfile）
2. 目录结构计算：**根据解析依赖的结果生成node_modules结构**
3. 链接依赖项：将node_modules中的依赖通过**硬链接**的方式链接到全局缓存中，节约磁盘空间

值得注意的是，在pnpm中这三个阶段是在多任务上并行的（类似于CPU的动态流水线），可以节约大量时间，如下图所示：

![image-20230608215545551](https://picgo-1308055782.cos.ap-chengdu.myqcloud.com/picgo-core/2023/06/20230608215546.png)



以上这三个阶段将在后文反复地被提到，请一定在脑子里有个大致的印象。

### 非扁平的node_modules

使用 npm 或 Yarn Classic 安装依赖项时，所有的包都被提升到模块目录的根目录。 这样就导致了一个问题 —— **幽灵依赖**，源码可以直接访问和修改依赖，而不是作为只读的项目依赖。

pnpm 的解决方案是**使用符号链接将项目的直接依赖项添加到模块目录的根目录中**。说起来有点拗口，实际上就是你的node_modules根目录中不再将所有的次级依赖平铺出来，而是只有你当前项目的**直接依赖**。

这样做的好处是显而易见的——**解决了“幽灵依赖”问题**。但是你先别急，pnpm和npm-v2的解决方案可不一样，它没有傻傻地嵌套安装所有所需的依赖，而是通过一些特殊的目录结构加上**符号链接**将嵌套的层数控制在了两层（一个可接受的范围内）。

那么它链接到了哪里呢？答案是`node_modules/.pnpm/<name>@<version>/node_modules/<name>`，所有的包**真正的存储目录是.pnpm中对应文件夹的node_modules下的对应名称文件夹**（有点拗口）。

你或许也注意到了，包本身存放的地方并没有在`<name>@<version>`根目录下，而是在其node_modules中和其他依赖并列存放，这是为什么呢？

- **不像PnP，pnpm并没有改动node的包解析模式**（依然是层层遍历目录的模式），因此依赖是在包的内部 `node_modules` 中或在任何其它在父目录 `node_modules` 中是没有区别的。
- 由于node会自动向上查询，因此包本身及其依赖的包被放置在一个文件夹下可以优化查询和解析过程（只包含它依赖的包）

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

### 硬链接

看了上面的介绍后，你内心可能还有个疑问：就这？说好的省空间呢？这只是把依赖用软链接组织起来了呀，.pnpm中该装的依赖铺平了不是一个不少吗？

别急别急，马上就介绍pnpm降低硬盘占用的杀手锏：硬链接机制——让所有的包都只存一份！



在传统的npm中，如果你有 100 个项目，并且所有项目都有一个相同的依赖包，那么，你在硬盘上就需要保存 100 份该相同依赖包的副本来保证不同项目之间的版本独立。~~都什么年代还在用传统npm~~

那么，pnpm是如何做到提高安装速度、节省硬盘空间的呢？答案是**硬链接**和**非扁平（也非嵌套）目录**。

在pnpm中一个典型的node_modules目录是这样的，可以看到充满了各种链接和两个独特的目录：`.pnpm`和`.pnpm-store`

![img](https://picgo-1308055782.cos.ap-chengdu.myqcloud.com/picgo-new/202305050106556.png)

要理解上述机制是如何工作的，我们首先要理解pnpm安装依赖时是怎么做的：

1. 

#### 包共享机制（硬链接）

- pnpm 会将包存放在一个统一的位置（类似于全局下载缓存，但**yarn/npm只在安装时使用，pnpm会在解析依赖时也会使用**），当安装软件包时，其包含的**所有文件都会硬链接自此位置，而不会占用额外的硬盘空间**。这让你可以在项目之间方便地共享相同版本的依赖包。
- 对于不同项目的不同版本依赖，项目本地只会**存储版本之间不同的文件**（类似git记录），而不会因为一个文件的修改而保存依赖包的所有文件。

> 注意：
>
> pnpm由于创建的是**硬链接**，因此右键查看`node_modules`仍能看到其占用的真实容量，但实际上**只占用了一份空间**（也就是一个磁盘上两个位置的同一份空间）。（来源：[pnpm-FAQ](https://pnpm.io/zh/faq)）

#### 非扁平 node_modules 目录

npm和yarn采用拍扁 node_modules（所有软件包都将被提升到 node_modules 的 根目录下）的方案，这会导致**源码可以访问本不属于当前项目所设定的依赖包**，导致可能某些包依赖的同一个库版本冲突。

但这也是不得已而为的解决方案，因为其非硬链接的存储方式导致如果给每个包都单独列出依赖会导致 node_modules 本就臃肿的体积无限膨胀，也会导致很长很长的路径，在Windows下出现解析问题。

在 pnpm 中，它会**创建非扁平的 node_modules 目录**，默认情况下，pnpm 则是通过使用符号链接的方式仅将项目的直接依赖项添加到 node_modules 的根目录下。

![img](https://picgo-1308055782.cos.ap-chengdu.myqcloud.com/picgo-new/202304270054060.jpeg)

安装依赖（比如安装一个`bar@1.0.0`的依赖，它依赖`foo@^1.0.0`）的具体步骤如下：

1. 安装依赖：直接把`foo`和`bar`（即所有用到的包）都放进`.pnpm`中，而不必计算扁平化依赖
2. 处理间接依赖：处理`bar`对`foo`的依赖
   1. 项目的直接依赖`bar@1.0.0`会在`node_modules`根目录下创建一个目录，这个目录实际上软链接到`.pnpm`中的对应包
   2. 在`.pnpm/bar@1.0.0/node_modules`中有`foo@1.0.0`和**`bar@1.0.0`**（是的，**pnpm允许包引用自身**，这也是把包和其依赖在内部展平，避免循环依赖链的方法）
3. 处理直接依赖：`.pnpm/bar@1.0.0/node_modules/foo@1.0.0`实际指向与`bar`同级的`.pnpm/foo@1.0.0`
4. 硬链接：所有包都通过硬链接连接到同一盘符下的`.pnpm_store`中（也就是说该盘符下所有的项目都可以共用一份依赖）

**相关阅读：**

- [Flat node_modules is not the only way | pnpm中文文档 | pnpm中文网](https://www.pnpm.cn/blog/2020/05/27/flat-node-modules-is-not-the-only-way)
- [Symlinked `node_modules` structure | pnpm中文文档 | pnpm中文网](https://www.pnpm.cn/symlinked-node-modules-structure)
- [聊聊前端包管理器对比Npm、Yarn和Pnpm-yarn和npm (51cto.com)](https://www.51cto.com/article/702067.html)
- [常见问题 | pnpm](https://pnpm.io/zh/faq)
- 
- [动机 | pnpm中文文档 | pnpm中文网](https://www.pnpm.cn/motivation)

#### 使用pnpm开发mono-repo项目



#### pnpm 常用命令

除了常用的`pnpm add`、`pnpm install`、`pnpm uninstall`等npm迁移指令，pnpm还有一系列自身特性的产生的特有指令。

- `pnpm rebuild/rb`：用于mono-repo的功能
- `pnpm env <cmd>`：用于管理Node版本，这里更推荐使用[nvm](#`nvm` (Node Version Manager))
- `pnpm store <cmd>`：管理磁盘共享缓存
  - `add`：只添加到缓存，而不添加到任何项目
  - `prune`：移除未引用的包
  - `path`：返回活跃的存储目录的路径





## 参考资料

- [项目初衷 | pnpm](https://pnpm.io/zh/motivation)
- [平铺的结构不是 node_modules 的唯一实现方式 | pnpm](https://pnpm.io/zh/blog/2020/05/27/flat-node-modules-is-not-the-only-way)
- [基于符号链接的 node_modules 结构 | pnpm](https://pnpm.io/zh/symlinked-node-modules-structure)
- [Pnpm: 最先进的包管理工具 - 知乎 (zhihu.com)](https://zhuanlan.zhihu.com/p/404784010)
- [聊聊前端包管理器对比Npm、Yarn和Pnpm-yarn和npm (51cto.com)](https://www.51cto.com/article/702067.html)