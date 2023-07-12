---
title: Docker 里的 shebang 踩坑记
excerpt: CRLF 中的 \r 会破坏 shebang，导致无法正常找到解释器，就这个小 bug 我找了一天才修好。
tags:
  - docker
  - shell
categories:
  - 杂食编程
abbrlink: 4246005333
date: 2023-07-12 16:21:42
---


最近手头有一个 Node 后端项目需要用 Docker 来部署，于是火急火燎地开始学习 Docker ，但在写完 Dockerfile 后却出现了以下错误：

```
env: can't execute 'node': No such file or directory
```

由于我的项目需要依赖本地的 pandoc 环境，因此 Dockerfile 中需要先安装 pandoc。我采用了下载预编译的二进制文件后拷贝到 `/usr/bin` 的方法进行安装，相关配置如下：

```dockerfile
FROM node:16-alpine as node
RUN npm i -g pnpm pandoc-filter
    
FROM node as pandoc
WORKDIR /build
RUN apk add --no-cache curl
RUN curl -L -o pandoc.tar.gz https://github.com/jgm/pandoc/releases/download/3.1.5/pandoc-3.1.5-linux-amd64.tar.gz
RUN tar xvzf pandoc.tar.gz --strip-components=1

FROM node as deps
WORKDIR /app
COPY package.json pnpm-lock.yaml ./
RUN pnpm install

FROM node as deploy
WORKDIR /app
ENV NODE_PATH=/usr/local/lib/node_modules PATH="/usr/local/bin:$PATH"

RUN mkdir /app/tmp
COPY --from=pandoc /build/bin/pandoc /usr/bin/pandoc
COPY --from=deps /app/node_modules ./node_modules
COPY ./src .
RUN chmod +x ./utils/filter.js

CMD ["node", "index.js"]

EXPOSE 3000
```

我初步判断是 **pandoc 在执行 JS Filter 的时候没有检测到 Node 环境的存在**，但奇了怪了，我的**基础镜像明明就是 Node 镜像**，为什么会识别不到呢？

## 认识 shebang

经过了长久的排查（甚至从最开始的官方 pandoc 镜像换成了手动 curl 安装），我确认了不是环境中没有 `node` 的问题，`node` 版本和环境变量都一切正常。

最终，我定位到了我的 `filter.js` 文件上。

```javascript
#! /usr/bin/env node
const pandoc = require("pandoc-filter");
const path = require("path");
const fs = require("fs");

function action({ t: type, c: value }, format, meta) {
  if (type === "Image") {
    const src = value[value.length - 1];
    const srcPath = path.resolve(src[0]);
    const stream = fs.readFileSync(srcPath, "base64");
    const ext = path.extname(srcPath);
    const base64 = `data:image/${ext};base64,${stream}`;
    return pandoc.Image(["", [], []], [pandoc.Str("image")], [base64, src[1]]);
  }
}

pandoc.stdio(action);

```

这是一个简单的用 JS 写的 pandoc filter，功能是读取文档中的图片并转为 base64 格式，在我的 Windows 环境中运行起来没有任何问题，但是在 Docker 中运行就出现了问题，而问题就出在第一行上。

```shell
#!/usr/bin/env node
```

第一行这个以 `#!` 开头的东西叫做 `shebang`（又称 `hashbang`），用于**指定脚本文件的解释器**。

> 在文件中存在 Shebang 的情况下，类 Unix 操作系统的程序加载器会分析 Shebang 后的内容，将这些内容作为解释器指令，并调用该指令，并将载有Shebang的文件路径作为该解释器的参数。

而 `/usr/bin/env` 是一个程序，用于**在环境变量（PATH）中查找后面的解释器**，作用是方便脚本在不同机器上可以正常运行。因此上面的 `shebang` 的意思就是：**在 `PATH` 中寻找 `node` 来解释下面的脚本**。

而报错信息：`env: can't execute 'node': No such file or directory` 实际上是 `/usr/bin/env` 发出的，表示不能在环境变量中找到 `node`。

奇也怪哉，我在 Shell 里运行 `node` 明明好好的，说明环境变量没有问题，为什么会找不到呢？

## CRLF 和 LF

提到 CRLF（Windows EOL） 和 LF（Linux EOL）大家一定都不陌生，因为一些历史原因，Windows（MS-DOS）和 Unix 系统的各种标准一直都有着某些刻意为之的区别，其中就包括 EOL（End-Of-Line，行尾符）。

- 在 Windows 中，行尾用 `\r\n` 两个字符来表示
- 在 Linux 中，行尾用 `\n`  一个字符表示
- 在 macOS 中，目前主流是用 `\n` （LF）来表示

此前 CRLF 和 LF 一直没有给我造成太大的困扰，最多也就在 Git 提交时发出一些提示，因此我也没有太在意。

### CRLF 和 shebang 的奇妙化学反应

现在我们在 Windows 下编辑一个 `hello.js` 脚本文件，目的就是打印 Hello World。

```js
#!/usr/bin/env node
console.log("Hello World");
```

现在我们想让它在 Linux 中直接作为脚本运行，因此上传到了我的 WSL（Ubuntu）中，修改权限后运行：

![image-20230712155645822](https://picgo-1308055782.cos.ap-chengdu.myqcloud.com/picgo-core/2023/07/20230712155647.png)

可以看到这里出现了相似的错误 `/usr/bin/env: ‘node\r’: No such file or directory` ，因为后面有 `\r` 导致无法正常识别 node，连错误码都是一样的 127，基本可以锁定就是 `\r` 的问题了。

> 这里由于我使用的是 zsh + Windows Terminal，所以可以正常地打印出错误信息里的 `\r`，如果是 **Docker 中默认的 Bash 默认是打印不出 `\r` 的**，这也是我找了这么久才找出问题根源的原因 QaQ。

### 如何解决 CRLF 的问题

在 VS Code 下方底栏右侧可以看到当前行尾，如下图所示：

![image-20230712161245267](https://picgo-1308055782.cos.ap-chengdu.myqcloud.com/picgo-core/2023/07/20230712161246.png)

#### 在 Windows 侧管理

首先，在 VS Code （或其他编辑器）中设置 File > EOL 为 `\n` （LF），保证本地创建的文件都是LF的，如下图所示：

![image-20230712160358112](https://picgo-1308055782.cos.ap-chengdu.myqcloud.com/picgo-core/2023/07/20230712160359.png)

然后再配置 Git 相关配置，与之相关的配置有两项：

- `core.autocrlf` 控制文件在 Windows 电脑上时是否自动转换 CRLF（Git 内部是 LF ）
  - `true` 提交时转换为 LF，检出时转换为 CRLF
  - `input` 提交时转换为 LF，检出时不进行转换
  - `false` 提交和检出时都不进行传唤
- `core.safecrlf` 控制文件中不能同时出现 CRLF 和 LF
  - `true ` 拒绝提交包含混合换行符的文件
  - `false` 允许提交混合换行符的文件
  - `warn` 提交混合换行符文件时发出警告

##### 全局设置

如果你想所有代码文件都使用 LF 的话（需要与 Unix 合作的话推荐这样做）可以修改 Git 全局配置如下，配合编辑器让 Windows 处理 LF 行尾。

```shell
$ git config --global core.safecrlf true # 不允许混合换行符提交
$ git config --global core.autocrlf input # 仅在提交时将CRLF转为LF，拉取时不转换
```

##### 设置 `.gitattributes`

使用 `.gitattributes` 的好处是可以保证使用这个仓库的每一个人都有相同的 Git 配置，避免协作问题。

以下是 Github 官方的一个模板文件：

```
# Set the default behavior, in case people don't have core.autocrlf set.
* text=auto

# Explicitly declare text files you want to always be normalized and converted
# to native line endings on checkout.
*.c text
*.h text

# Declare files that will always have CRLF line endings on checkout.
*.sln text eol=crlf

# Denote all files that are truly binary and should not be modified.
*.png binary
*.jpg binary
```

修改第一行 `* text=auto` 为  `* text=auto eol=lf` 即可将所有代码文件的行尾都规定为 LF，如果不符合规范就不能提交。

#### 在 Linux 侧管理

由于 CRLF 和 LF 其实是一个历史悠久的问题，从 DOS 时期就有了，所以 Linux 上也有不少转化工具，如 `dos2unix` 。

以上面的 `hello.js` 为例执行转换：

```shell
$ sudo apt-get install dos2unix
$ dos2unix ./hello.js
$ ./hello.js
```

转化后就可以正确执行，运行结果如下：

![image-20230712161907358](https://picgo-1308055782.cos.ap-chengdu.myqcloud.com/picgo-core/2023/07/20230712161908.png)