---
title: monorepo
tags:
---

s

**monorepo**(monolithic repository)是一种项目架构，简单的来说：**一个仓库内包含系统的多个开发项目（模块，包）**。

<!-- more -->

许多前端项目如：vue3、element-ui都是采用的这种架构模式。优点是模块之间管理方便、结构清晰、依赖共享；缺点则是代码仓库体积较大，在传递和打包方面有一定缺陷。

## monorepo的简单实现

### 为什么需要monorepo

总的来说，**虽然拆分子仓库、拆分子 NPM 包（For web）是进行项目隔离的天然方案，但当仓库内容出现关联时，没有任何一种调试方式比源码放在一起更高效。**

**工程化的最终目的是让业务开发可以 100% 聚焦在业务逻辑上**，那么这不仅仅是脚手架、框架需要从自动化、设计上解决的问题，这涉及到仓库管理的设计。

在前端开发环境中，多 Git Repo，多 Npm 则是这个理想的阻力，它们导致复用要关心版本号，调试需要 Npm Link。



---



Yarn Workspaces（工作区）是Yarn提供的`monorepo`的依赖管理机制，从Yarn 1.0开始默认支持，用于在代码仓库的根目录下管理多个package的依赖。

开发多个互相依赖的package时，workspace会自动对package的引用设置软链接（symlink），比yarn link更加方便，且链接仅局限在当前workspace中，不会对整个系统造成影响

所有package的依赖会安装在最根目录的node_modules下，节省磁盘空间，且给了yarn更大的依赖优化空间

所有package使用同一个yarn.lock，更少造成冲突且易于审查



`private`：根目录一般是项目的脚手架，无需发布，`"private": true`会确保根目录不被发布出去。

`workspaces`: 声明workspace中package的路径。值是一个字符串数组，支持Glob通配符。

## 参考资料

- [精读《Monorepo 的优势》 - 知乎 (zhihu.com)](https://zhuanlan.zhihu.com/p/65533186)
- [Monorepo 是什么，为什么大家都在用？ - 知乎 (zhihu.com)](https://zhuanlan.zhihu.com/p/77577415)
- [Monorepo 的这些坑，我们帮你踩过了！ - 掘金 (juejin.cn)](https://juejin.cn/post/6972139870231724045)
- [monorepo的理解以及简单实现 - 掘金 (juejin.cn)](https://juejin.cn/post/7065141885576151070#heading-1)
- [lerna/lerna: Lerna is a fast, modern build system for managing and publishing multiple JavaScript/TypeScript packages from the same repository. (github.com)](https://github.com/lerna/lerna)
- [Monorepo最佳实践之Yarn Workspaces - 掘金 (juejin.cn)](https://juejin.cn/post/7011024137707585544)
- [如何使用 Yarn Workspaces 配置一个 Monorepo JS/TS 项目 - 简书 (jianshu.com)](https://www.jianshu.com/p/8dbe488d391b)
- [lerna + yarn workspace 使用总结 - 掘金 (juejin.cn)](https://juejin.cn/post/7097820725301477406)
- [基于lerna和yarn workspace的monorepo工作流 - 知乎 (zhihu.com)](https://zhuanlan.zhihu.com/p/71385053)
- [基于 Lerna 管理 packages 的 Monorepo 项目最佳实践 - 掘金 (juejin.cn)](https://juejin.cn/post/6844903911095025678)
- [Yarn Workspace使用指南 - 知乎 (zhihu.com)](https://zhuanlan.zhihu.com/p/381794854)
