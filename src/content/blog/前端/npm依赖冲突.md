---
title: peerDependencies 版本冲突解决
tags:
  - npm
  - 包管理
  - 项目管理
pubDate: 2023-05-24T18:09:44.000Z
slug: '3463082280'
category: 前端
---

在为公司一个老项目配置Prettier和ESLint、StyleLint兼容性设置后，我再次使用 npm install 生成 package-lock.json 时遇到了下面这个错误。

<!--more-->

```log
npm ERR! code ERESOLVE
npm ERR! ERESOLVE could not resolve
npm ERR!
npm ERR! While resolving: stylelint-prettier@3.0.0
npm ERR! Found: stylelint@13.13.1
npm ERR! node_modules/stylelint
npm ERR!   dev stylelint@"^13.13.1" from the root project
npm ERR!   peer stylelint@"^13.0.0 || ^14.0.0" from @nuxtjs/stylelint-module@4.1.0
npm ERR!   node_modules/@nuxtjs/stylelint-module
npm ERR!     dev @nuxtjs/stylelint-module@"^4.0.0" from the root project
npm ERR!   4 more (stylelint-config-prettier, ...)
npm ERR!
npm ERR! Could not resolve dependency:
npm ERR! peer stylelint@">=14.0.0" from stylelint-prettier@3.0.0
npm ERR! node_modules/stylelint-prettier
npm ERR!   dev stylelint-prettier@"^3.0.0" from the root project
npm ERR!
npm ERR! Conflicting peer dependency: stylelint@15.6.2
npm ERR! node_modules/stylelint
npm ERR!   peer stylelint@">=14.0.0" from stylelint-prettier@3.0.0
npm ERR!   node_modules/stylelint-prettier
npm ERR!     dev stylelint-prettier@"^3.0.0" from the root project
npm ERR!
npm ERR! Fix the upstream dependency conflict, or retry
npm ERR! this command with --force, or --legacy-peer-deps
npm ERR! to accept an incorrect (and potentially broken) dependency resolution.
```

但我平时用的是yarn3进行包管理，也没有遇到任何问题，所以现在问题成了三个：

- 如何解决这个依赖冲突问题？
- 为什么yarn3没有出现这个问题而npm8遇到了？
- 如果把部署方案改成yarn是否可以直接规避依赖版本冲突？

## 为什么会出现这个冲突？

在我的[前端工具链]()一文中曾详解过npm3中扁平依赖项的解析方式，以及其不确定依赖关系的问题：npm3无法固定依赖，即如果两个包都依赖了同一个包，但是版本不同，则具体安装依赖和构建依赖树时会**按第一个出现该包的版本为标准（即谁先就是谁）**，并后续不再重复安装。

我也没有想到，npm8了仍然采用这样的方案。

## yarn2+为什么没有出现这个问题？

## 如何解决这个问题？

除了换用其他包管理器，在npm中有没有办法解决呢？

### 方法1：头痛医头法

这是最简单的方法（但其实没有解决问题，只是缓兵之计），直接加上`--legacy-peer-deps` 选项，可以顺利安装，并生成 package-lock.json。

后续使用 `npm ci --legacy-peer-deps` 读取 lock 文件进行部署即可。

#### peerDependency 做了什么

`--force` 我就不再介绍了，意为强制npm获取远程资源而不使用本地cache，并不能解决这里的问题。

peer本意是同辈人，官方是这样定义的：

> _peerDependencies_: A peer dependency is a specific version or set of versions of a third-party software library that a module is designed to work with. They're similar in concept to the relationship between a browser extension and a browser.

在引用一段我在另一篇推文中的定义：

> `peerDependencies`: 表示工程需要和这个依赖（的指定版本）配套使用，**一般用于插件开发**而非项目开发，是为了解决本项目依赖和作为插件被引入的时候与主项目依赖版本冲突的问题（如`vuex@4.1.0`表明了自己需要`vue@^3.2.0`配套使用），但**这个选项对于解决某些插件兼容性问题出奇的好用**（算某些奇技淫巧吧），可以使用`-P`选项来添加。

所以引入peer可以解决部分的依赖版本问题，因为它可以指定依赖的版本（而不是不确定的间接依赖）。

在多个依赖版本冲突时，install的优先级是这样的：

1. 如果用户**显式依赖**了核心库，则可以忽略各插件的*peerDependencies*声明；
2. 如果用户没有显式依赖核心库，则按照插件*peerDependencies*中声明的版本将库安装到项目根目录中；
3. 当**用户依赖的版本、各插件依赖的版本之间不相互兼容，会报错让用户自行修复**。

#### 为什么会报错

既然 peer 的设计目的是为了解决兼容性问题，为什么会报错呢？

在 npm-v7+ 中会默认安装 peer 的版本，但一个可以预见的错误是**如果两个包的依赖版本打架了在扁平结构下应该装哪个版本呢？**

> npm：摆了，不知道，throw Error吧！

这就是我们看到错误的原因，而这个时候我们加上`--legacy-peer-deps`就相当于告诉npm：行吧，我知道了，你就不检查peer了吧，直接按v4-v6的方法，哪个在前面装哪个吧，出了问题不怪你~~（才怪）~~，这下npm才愿意给你装上依赖。

### 方法2：直面版本法

根据报错信息可以看到，是stylelint-v13版本太老了的原因~~（我的VSCode也一直提醒我不再支持）~~，毕竟都出到15了。

#### 升级 stylelint

这个方法亲测不可行，因为[只升级stylelint-v14而不升级其他配套的话不兼容vue+scss语法](https://blog.csdn.net/qq1014156094/article/details/122456439)，遂放弃。

#### 降级 stylelint-prettier

根据报错信息可以看到，是 stylelint-prettier 这个插件要求至少要求 v14+，我们去查它的[CHANGELOG](https://github.com/prettier/stylelint-prettier/blob/main/CHANGELOG.md)可以发现在v2.0版本就放弃了v14以前的版本支持，因此最高版本为 v1.2.0（真老啊），将 package.json 中对应版本修改为 1.2.0 后不再报错，问题解决。

顺带还发现了 v3.0.0 中 `stylelint-prettier/recommended` 报错的原因，是要手动引用，当然降级后自然也不存在这个问题了。

### 方法3：换用yarn部署

需要修改 Dockerfile，此方案暂时搁置。

#### 为什么yarn不会报错

## 参考资料

- [javascript - What does npm install --legacy-peer-deps do exactly? When is it recommended / What's a potential use case? - Stack Overflow](https://stackoverflow.com/questions/66239691/what-does-npm-install-legacy-peer-deps-do-exactly-when-is-it-recommended-wh)
