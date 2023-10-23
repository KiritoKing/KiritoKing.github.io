---
title: 初探 Docker - 原理和实践
tags:
  - docker
pubDate: 2023-07-12 16:27
slug: 3542760854
category: 杂食编程
---

Docker是一种Go语言编写的容器化隔离的实现，帮助我们快速地将应用打包成**容器**进行发布和部署，也可以方便地运行他人编写的应用。

> 一般来说Docker是运行在Unix系统环境上的，本文也是基于Linux环境的。

<!-- more -->

## 什么是容器

所谓容器（container），是一种**轻量级**的虚拟化技术，像虚拟机一样，对运行在其中的进程提供隔离的运行环境（如地址空间、文件系统等），运行在其中的应用就像独占了整个物理机一样。

- 对比OS的虚拟化技术（如虚拟存储器等），虚拟内存虽然**为每个进程提供了独立的地址空间和运行上下文，但进程本身仍是运行在操作系统中的，不能提供完全隔离的进程运行环境**
  - 进程知道自己运行在操作系统中，接受操作系统的调度
  - 进程能感知到其他进程的存在（`pid≠1`）
- 对比虚拟机技术，虚拟机**为了提供完全的隔离运行环境在宿主环境上还需要模拟一套硬件和操作系统来运行程序，对于只需要隔离运行某个进程的环境来说开销太大**

  ![](https://picgo-1308055782.cos.ap-chengdu.myqcloud.com/picgo-core/2023/07/20230712162825.png)

### 容器为什么“轻量级”

如果我们想在宿主环境中轻松地部署多个服务，不考虑每个服务的细节配置（如依赖什么环境、暴露什么端口），最好的方法自然是为每个服务提供隔离的运行环境，就像运行在独立的物理机上一样。

而上面给出的方法都不太适用于这个需求：

- OS的虚拟内存显然不能满足要求，它仅仅提供了独立的地址空间和运行上下文，其系统资源仍是共享的
- 虚拟机方案需要为每个服务模拟独立的操作系统和硬件，开销过大

为了解决这样的需求，**容器化虚拟技术**就应运而生了。

![](https://picgo-1308055782.cos.ap-chengdu.myqcloud.com/picgo-core/2023/07/20230712162827.png)

- 一个容器进程**本质上是**一个操作系统中的隔离**进程**，并没有为其建立独立的硬件和OS，开销相比虚拟机小了很多，因此是轻量级的虚拟化
- 被隔离的进程不能感知其他进程的存在，它就是自己环境中唯一的进程，系统资源也不与其他进程共享

### 如何实现容器隔离

> 🌟**隔离工作是由Linux系统实现的**，Docker只是帮我们打包和运行一系列隔离操作后启动这个隔离进程

Linux利用Namespace（隔离容器）和Cgroups（调配资源）为隔离的进程在原有的独立地址空间和运行上下文上实现了进一步的隔离：

- **进程隔离**：利用Linux的Namespace机制实现，结果就是**以隔离方式启动的进程看到的自身进程ID总是1，且看不到系统的其他进程**
- **文件系统隔离**：利用Linux的mount机制给每个隔离进程挂载了一个虚拟的文件系统，使得**一个隔离进程只能访问这个虚拟的文件系统，无法看到系统真实的文件系统**（决定这个文件系统中包含哪些文件就是Docker的工作之一）
- **网络协议栈隔离**：利用Linux的Namespace机制，类比虚拟机的网络模式中的NAT模式，**每个隔离进程实际上都拥有并运行在自己的子网上**，Docker像NAT一样帮我们将某些端口暴露出来并负责进程内子网到外部端口的转发（`-p <source>:<target>`）

![](https://picgo-1308055782.cos.ap-chengdu.myqcloud.com/picgo-core/2023/07/20230712162830.png)

- **限制容器资源**：利用Cgroup（Linux Control Group）限制进程组（包括隔离进程）使用的资源上限，**防止容器间由于不知道彼此的存在抢占所有资源导致其他服务无法运行**

## Docker基本概念

谈Docker的使用之前，我们要先了解Docker的三个核心概念：**镜像（image）、容器（container）和仓库（repository）**。

### 镜像

> 🌟镜像负责为容器定义内部有什么东西，包括`root` 文件系统，程序所需要的依赖等，构建镜像就等同于构建应用所需的环境和应用本身的运行步骤。

Linux中操作系统分为 **内核** 和 **用户空间**。对于 `Linux` 而言，内核启动后，会挂载 `root` 文件系统为其提供用户空间支持。Docker作为容器（隔离进程）管理工具的**核心工作之一就是为隔离的进程提供其所需的文件系统**，而这一过程就是 **镜像** 的工作。

Docker镜像（Image）相当于一个特殊的root文件系统（如官方镜像 `ubuntu:18.04` 就包含了完整的一套 Ubuntu 18.04 最小系统的 `root` 文件系统），除了提供容器运行时所需的程序、库、资源、配置等文件外，还包含了一些为运行时准备的一些配置参数（如匿名卷、环境变量、用户等）。

由于镜像需要包含一个完整的`root`文件系统，其体积比较庞大，因此采用了**分层存储（分层构建）** 的方式简化构建。镜像构建时，会一层层构建，前一层是后一层的基础。每一层构建完就不会再发生改变，后一层上的任何改变只发生在自己这一层。

因此，在分层构建镜像时，**每一层尽量只包含该层需要添加的东西，任何额外的东西应该在该层构建结束前清理掉。**

### 容器

> 🌟容器是镜像的实例，就像类和实例一样，其本质就是前文提到的拥有自己命名空间（Namespace）的进程。

**镜像（`Image`）和容器（`Container`）的关系，就像是面向对象程序设计中的 **`类` 和 `实例` 一样，镜像是静态的定义，容器是镜像运行时的实体。容器可以被创建、启动、停止、删除、暂停等。

**这里谈到的容器（container）和上面谈到的容器是同一个概念，其本质是操作系统中拥有独立命名空间的隔离进程。**

在分层存储中，容器也有自己的存储层，以前面镜像存储层为基础建立自己的**容器存储层**，为容器运行时读写而准备，**在容器启动时生成，在容器关闭后也会清除**（生命周期与容器本身相同)。

> 按照 Docker 最佳实践的要求，容器不应该向其存储层内写入任何数据，容器存储层要保持无状态化。所有的文件写入操作，都应该使用 [数据卷（Volume）](/docker_practice/data_management/volume '数据卷（Volume）')、或者 [绑定宿主目录](/docker_practice/data_management/bind-mounts '绑定宿主目录')，在这些位置的读写会跳过容器存储层，直接对宿主（或网络存储）发生读写，其性能和稳定性更高。
> 数据卷的生存周期独立于容器，容器消亡，数据卷不会消亡。因此，使用数据卷后，容器删除或者重新运行之后，数据却不会丢失。

### 仓库

> 🌟仓库（repository）是用于储藏、发布容器镜像的地方。

以Docker Repository为例：一个 **Docker Registry** 中可以包含多个 **仓库**（`Repository`）；每个仓库可以包含多个 **标签**（`Tag`）；每个标签对应一个镜像。

如Ubuntu仓库中`ubuntu` 是仓库的名字，其内包含有不同的版本标签，如，`16.04`, `18.04`。我们可以通过 `ubuntu:16.04`，或者 `ubuntu:18.04` 来具体指定所需哪个版本的镜像。如果忽略了标签，比如 `ubuntu`，那将视为 `ubuntu:latest`。

## 使用Docker

### 启动容器 `docker run`&#x20;

启动Docker服务后，在终端运行`docker run <image> <...cmd>` 指令即可启动容器，其运行流程如下：

1.  检查本地是否存在指定的镜像，不存在就从 registry 下载
2.  利用镜像创建并启动一个容器
3.  分配一个文件系统，并在只读的镜像层外面挂载一层可读写层
4.  从宿主主机配置的网桥接口中桥接一个虚拟接口到容器中去
5.  从地址池配置一个 ip 地址给容器
6.  执行用户指定的应用程序
7.  执行完毕后容器被终止

支持的**参数**如下，无入参的运行参数可以合并，如`-it`：

- `-t` 分配一个伪终端（pseudo-tty）并绑定到容器的标准输入上
- `-i` 让容器的标准输入保持打开，结合`-t` 可以生成一个交互终端
- `-p <localPort>:<containerPort>` 端口映射
- `-d` 让容器以后台守护进程（daemon）模式运行，stdout会绑定到Docker Log中，使用`docker attach <container>` 可以进入容器

使用 `docker exec [opts] <container> <cmd>` 可以执行指定指令

### 使用`Dockerfile`定义镜像

Dockerfile 是一个文本文件，其内包含了一条条的 **指令(Instruction)**，每一条指令对应分层存储中的一层，因此每一条指令的内容，就是描述该层应当如何构建，因此又称**分层构建**。**每一层的构建指令都会在原来的层上新建一层，执行命令，然后**\*\*`commit`这一层的修改。\*\*​

可以说Dockerfile是一个Docker脚本，包含了把每一层修改、安装、构建、操作的命令，使用Dockerfile就可以定制自己的镜像。

#### 使用 `FROM` 指定基础镜像

> 特殊的镜像——`scratch` ，指一个空白镜像，在直接运行二进制程序（如Go镜像）时可能会有用，因为所需的一切库都已经在可执行文件里了，并不需要OS提供运行时支持

&#x20;所谓定制镜像，那一定是以一个镜像为基础，在其上进行定制，而`FROM` 语句就是指定**基础镜像**，因此一个 `Dockerfile` 中 `FROM` 是必备的指令，并且**必须是第一条指令**。

#### 使用`RUN` 执行命令

> 🌟Dockerfile 中每一个指令都会建立一层，`RUN` 也不例外。

`RUN` 指令是一个强大的指令，其能力和Shell相同，可以执行系统命令或可执行文件，对应的有两种格式：

- `RUN <cmd>` 系统命令
- `RUN [<filePath> [, arg1, arg2, ...]]` 可执行文件，以数组的形式传递参数

由于`RUN` 指令会新建一层新的UnionFS存储，因此请格外注意不要创建额外的`RUN` 指令，将能合并的指令都尽量合并在一个`RUN` 中，因为**UnionFS是有层数限制的**（如 AUFS曾经最大不得超过 42 层，现在是不得超过 127 层）。

```docker
# Wrong: Too many layers
FROM debian:stretch

RUN apt-get update
RUN apt-get install -y gcc libc6-dev make wget
RUN wget -O redis.tar.gz "http://download.redis.io/releases/redis-5.0.3.tar.gz"
RUN mkdir -p /usr/src/redis
RUN tar -xzf redis.tar.gz -C /usr/src/redis --strip-components=1
RUN make -C /usr/src/redis
RUN make -C /usr/src/redis install

# Correct: Only 1 layer for `RUN`
FROM debian:stretch

RUN set -x; buildDeps='gcc libc6-dev make wget' \
    && apt-get update \
    && apt-get install -y $buildDeps \
    && wget -O redis.tar.gz "http://download.redis.io/releases/redis-5.0.3.tar.gz" \
    && mkdir -p /usr/src/redis \
    && tar -xzf redis.tar.gz -C /usr/src/redis --strip-components=1 \
    && make -C /usr/src/redis \
    && make -C /usr/src/redis install \
    && rm -rf /var/lib/apt/lists/* \
    && rm redis.tar.gz \
    && rm -r /usr/src/redis \
    && apt-get purge -y --auto-remove $buildDeps

```

#### 构建镜像 `docker build`&#x20;

Shell中运行`docker build -t <name> <path>` ，如`docker build -t test .` ，即可构建一个名为`name` 的镜像。

由于Docker实际上是一个C/S结构的程序，我们使用的`docker` 指令实际上只是客户端，所有的运行、构建工作都是在服务端进程进行的，二者通过一套REST API进行沟通，所以使用Docker可以方便地管理远程容器服务。

因此我们在运行`docker build` 时**指定的路径会被整体打包上传给Docker引擎**，因此**不再是本地路径**，而是引入了**上下文路径**这一概念，**在Dockerfile中访问的路径都是上下文路径**，其限制是只能访问上下文路径范围内的文件，如`../out.file` 是无法在Dockerfile中访问的。

- **其他构建方式**：Dockerfile除了手动指定本地的上下文目录外还支持其他方式
  - 从Git仓库构建：`docker build <git-url>`
  - 从tar压缩包创建：`docker build <tar-url>`&#x20;

#### 其他指令

- **操作上下文目录**
  - `COPY <src> <target>` 指令将从**构建上下文目录**中 `<源路径>` 的文件/目录复制到**新的一层的镜像**内的 `<目标路径>` 位置
    - `源路径` 可以有多个，可以是通配符
      - 如果源路径为文件夹，复制的时候不是直接复制该文件夹，而是**将文件夹中的内容复制到目标路径**
    - `目标路径` 可以是容器内的绝对路径，也可以是相对于工作目录的相对路径（工作目录可以用 `WORKDIR` 指令来指定）。
      - 目标路径不需要事先创建，如果目录不存在会在复制文件前先行创建缺失目录。
    - 选项
      - `—source <stage>` 指定上下文目录为某个阶段
      - `—chown` 更改文件状态（权限组）
  - `WORKDIR <dir>` 可以来指定工作目录（或者称为当前目录），**以后各层**的当前目录就被改为指定的目录，如该目录不存在，`WORKDIR` 会帮你建立目录
    区别`RUN cd` ：`WORKDIR` 适用于以后的所有层，`RUN cd` 只适用于当前层
- `EXPOSE <port>` 暴露端口（指内部网络的端口），支持暴露多个端口
  在映射时可以手动指定每个端口的映射，也可以自动分配
- `CMD` 指定容器启动命令，和`RUN` 格式类似，但`CMD` 命令执行后容器将启动
- `SHELL` 指令可以指定`RUN` 和`CMD` 指令的宿主终端

### 数据管理

**按照 Docker 最佳实践的要求，容器不应该向其存储层内写入任何数据，所有的文件写入操作，都应该使用 数据卷（Volume）、或者 绑定宿主目录。** 具体实现上，Docker使用Linux系统的mount功能来实现将指定目录挂载到特定物理存储区上。

![](https://picgo-1308055782.cos.ap-chengdu.myqcloud.com/picgo-core/2023/07/20230712162837.png)

#### 数据卷

数据卷（Volumn）是一个可供一个或多个容器使用的特殊目录，独立于UnionFS外部，提供一片不会随容器终止而丢失的存储空间，其设计目的就是为了**实现容器间的数据共享和持久化存储**。

- `数据卷` 可以在容器之间共享和重用
- 对 `数据卷` 的修改会立马生效
- 对 `数据卷` 的更新，不会影响镜像
- `数据卷` 默认会一直存在，即使容器被删除

使用 `docker volumn create <name>` 可以创建一个数据卷，后面通过名称来进行调用和绑定。

使用 `docker volumn ls` 可以查看所有数据卷。

要绑定数据卷可以在运行容器时使用`--mount` 参数，如下面的指令就把`/usr/share/nginx/html` 挂载到了`my-vol` 数据卷上。

```bash
$ docker run -d -P \
    --name web \
    # -v my-vol:/usr/share/nginx/html \
    --mount source=my-vol,target=/usr/share/nginx/html \
    nginx:alpine
```

#### 挂载宿主目录

上面提到的`mount` 参数除了可以绑定创建的数据卷，也可以绑定到宿主机的某个目录上，只需要指定`type=bind` 即可。如下所示：

```bash
$ docker run -d -P \
    --name web \
    # -v /src/webapp:/usr/share/nginx/html \
    --mount type=bind,source=/src/webapp,target=/usr/share/nginx/html \
    nginx:alpine
```
