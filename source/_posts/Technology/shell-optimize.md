---
title: 工欲善其事，必先利其器——打造自己趁手的终端体验
date: '2023/08/07 04:00:00'
alias:
  - post/Technology/shell-optimize/index.html
  - post/technology/shell-optimize/index.html
---

📌 本文介绍了终端在程序开发流程中的重要性，并探讨了如何打造趁手的终端体验。文章讲解了Shell基础、Terminal和Shell的关系、什么是Prompt、Prompt工具的使用以及Profile配置文件的作用。针对Powershell的改进，作者提出了使用starship作为Prompt工具的方案，并介绍了Powershell 7的新功能。此外，文章还介绍了在macOS上配置开发环境的方案，包括使用zsh + oh-my-zsh、iterm2主题和tmux等插件来提高终端生产力。_（Summarized By ChatGPT）_

<!-- more -->

终端在程序开发流程中显然是十分重要的，很多复杂的工具使用CLI的效率要远远高于GUI，且CLI还可以编写自动化脚本来提升工作效率。因此，打造趁手的终端体验显然是开发环境配置的重要一环。

虽然在之前摸爬滚打的经历里，我已经脱离了在Windows下使用CMD和Git Bash作为终端的原始体验，在Windows Terminal和Powershell的组合下使用体验还算良好，也用oh-my-posh做了Prompt优化。

后面一次偶然的机会看到了Unix开发同学的zsh，看到他的自动补全和历史记录确实很是心动，就开始对已有的终端方案进行改进。

目前来说我的终端体验还有以下问题：

- 缺少命令补全和历史记录提示（auto suggestion）
- Shell启动速度过慢
- WSL的Shell体验完全没有优化

除了在Windows端优化Powershell解决上述问题外，这里还对WSL/macOS的终端（zsh）进行了美化和优化。

# Shell 基础

这个[视频](https://www.bilibili.com/video/BV1rk4y1W7dZ/?share_source=copy_web&vd_source=0a01fb11a82eaf663fcad12ddb244da9)比较系统地讲了Shell相关的基础知识（平台无关），也和本文的主题——终端体验优化相关性较强。（这个原Po是mac上终端Warp的作者，也是用Rust写的，终端理解很强）

## Terminal和Shell

虽然在本文中会大量地混用Terminal和Shell的概念，并将他们都称为“终端”，但在此之前还是应该将这些概念好好地明晰一下。

下面将由表及里，从用户交互到系统调用地讲明这些概念。

### CLI (Command Line Interface)

CLI (Command Line Interface)，中文为命令行界面，就是一种通过文本输入输出与计算机进行交互的形式，而Shell和Terminal就是CLI的载体。

形象地说就是像电视里的黑客那样对着黑乎乎绿油油的屏幕敲代码执行操作就是CLI，而平时拿鼠标点点划划进行操作就是GUI (Graphics User Interface， 图形用户界面)。

常用的CLI工具有ffmpeg, git 等，这些都是CLI应用。

### Terminal

Terminal，中文为终端，就是输入各种命令的地方（窗口）。在CLI中需要输入命令与计算机进行交互，终端就是承载这些交互的地方，它接受你的输入，返回计算机的输出。

最常见的Terminal是裸Shell，它们除了基础的文本交互功能外不提供任何其他功能。

更常用的Terminal工具有 Windows Terminal，Warp等，它们还可能提供一些额外的功能如Nerd Font支持、AI工作流等，可以支持运行各种不同的Shell。

### Shell

Shell，意为壳，顾名思义就是给系统内核套上的一层壳，通过这层壳可以用命令实现系统功能调用。

当用户向终端（Terminal）输入命令时，Shell就会解释这些命令并执行。

常见的Shell有：cmd, powershell, bash, zsh等。

## 什么是Prompt

这里的Prompt和AI Prompt不是一个概念。Shell Prompt是命令行终端（CLI）的提示符，通常由一个字符、字符串或图标组成，显示当前命令行环境的信息，通常包含当前所在的目录、用户名、主机名。

对于开发者而言，一个好的Prompt应该包含以下信息：

- 目录和用户信息（基础信息）
- 权限信息：当前命令是否sudo
- Git信息，包含仓库、账号、分支等
- 运行环境信息，如Node版本、Python虚拟环境等
- 上一个命令运行是否成功

拿oh-my-posh 2仓库中的图举一个例子，该图中就包含了权限、上一个命令结果、目录和用户还有Git信息。

![](https://picgo-1308055782.cos.ap-chengdu.myqcloud.com/picgo-core/2023/08/20230806200119.png)

### Prompt 工具

Shell自带的Prompt引擎不能实现花花绿绿的效果，配置起来也比较麻烦，这就需要我们引入Prompt Engine来为我们渲染Prompt。

Prompt Engine可以用不同的语法高亮显示各种信息，稍加定制还可以花里胡哨。可惜现在我已经过了追求炫酷的年纪，只想实用加快速，这里我对不同终端下的不同Prompt工具做了一个简单速度对比。

> 在Windows Terminal中\*\*将启动参数中的`-nol`\*\***删去，显示Shell启动信息以便调试**。

| Shell 版本 | Prompt 工具           | 平均启动耗时（ms） |
| ---------- | --------------------- | ------------------ |
| PS 5.1     | oh-my-posh 2 (legacy) | 650                |
| PS 5.1     | oh-my-posh 7+         | 1000               |
| PS 5.1     | starship              | 500                |
| PS 7       | oh-my-posh 7+         | 600                |

Powershell下我主要测试了以下prompt工具，oh-my-xxx系列是每个Shell都有自己的对应工具，starship则是偶然刷到的一个新的跨平台Rust Prompt工具。

- oh-my-posh 2 (legacy): 100%用Powershell脚本完成的Prompt工具，只支持Powershell，Prompt方面只支持Git信息
- oh-my-posh：用Go重写的Prompt工具，可以支持不同Shell（虽然没人用），Prompt方面支持更多信息如Git、Node、Python等，代价是**体积增加、运行速度慢**
- starship：用Rust写的跨平台Prompt工具，很快，信息显示也很全，代价是由于比较新主题比较少

## Nerdfont 管理

> Nerd Fonts是面向开发者的字体，它在开发友好字体（如各种mono字体）的基础上封装了一系列ICONS和表情符号，又称iconic fonts。

本文所有的Nerd Font都从[nerdfonts.com](https://www.nerdfonts.com 'nerdfonts.com')下载，具体使用得字体如下：

- Noto Sans Mono CJK：VS Code字体，不含Icons
- Jetbrains Mono Nerd
- FiraMono Nerd：终端字体

# Powershell

此前我的终端环境一直是基于Powershell 5（也就是系统内置的Windows Powershell）进行的，最多也是进行了一些Prompt美化来展示一些额外信息如Git信息、Node信息、Python信息等。

在进行选择之前，我首先对Powershell本身进行了调研，因为根据微软官方的描述，自 PowerShell 6.0 起，PowerShell在Windows内始终有两个版本：Windows Powershell（PowerShell 5.1）和Powershell 7（6.0+）。

- Windows Powershell（在Windows 11中是Powershell 5.1）是基于 .NET Framework的Powershell，顾名思义只能运行在Windows上，是系统内部自带的，地位与CMD等同，提供全部的Windows接口
- Powershell（目前最新版是Powershell 7）是基于 .NET Core的跨平台Powershell，可以运行在任何系统上，地位与第三方Shell等同，只支持window-cmdlet的子集，但支持许多新功能

## Profile 配置文件

打开相关的`profile.ps1`，根据[微软的官方文档](https://learn.microsoft.com/zh-cn/powershell/module/microsoft.powershell.core/about/about_profiles?view=powershell-7.3 '微软的官方文档')，配置文件在Windows中存储在以下目录，且**按顺序加载**，也就是说后加载的可以覆盖先加载的配置（不会有人在非Windows环境下使用Powershell吧）

> 注意：Win10/11下会同时有**Powershell5**和**Powershell7**两个版本，`$HOME\Documents\PowerShell`是**Powershell7**的目录，而`$HOME\Documents\Windows Powershell`是**Powershell5**的目录（`system32`中自带的Powershell版本）

- 全局配置（所有用户、所有主机）： `$PSHOME\Profile.ps1`（在我的电脑上是`$PSHOME=C:\Windows\System32\WindowsPowerShell\v1.0`）
- 所有用户，当前主机：`$PSHOME\Microsoft.PowerShell_profile.ps1`
- 当前用户、所有主机：`$HOME\Documents\PowerShell\Profile.ps1`（或者直接是`$PROFILE`）
- 当前用户、当前主机：`$HOME\Documents\PowerShell\Microsoft.PowerShell_profile.ps1`

## Powershell 7的更新点

Powershell 6是一个划时代的版本，在此之前Powershell是基于 .NET Framework构建的，只能运行在Windows上；而Powershell 6及其更高版本则可以利用 .NET Core跨平台运行在所有OS上。

- 由于.NET Core是Framework的子集，因此跨平台的Powershell会移除一些针对Windows的cmdlet，**Powershell 7针对此现象做了大量针对Windows的兼容性支持**，但这是针对运维人员的，对我这种只用到终端和基础脚本的开发者没有什么作用。
- Powershell 7 作为**脚本工具**增加了许多新内容，特别是面向对象语法这一块比bash这种纯字符串处理在面对复杂任务时可以更加从容
- 完全拥抱开源，在Github上源码完全公开

输入`$PSVersionTable`可以看到详细版本信息，以下是**Windows Powershell（系统内置）** 的版本信息，可以看到版本是5：

![](https://picgo-1308055782.cos.ap-chengdu.myqcloud.com/picgo-core/2023/08/20230806200124.png)

以下是**Powershell 7（我手动安装的最新版本）** 的版本信息：

![](https://picgo-1308055782.cos.ap-chengdu.myqcloud.com/picgo-core/2023/08/20230806200135.png)

## 改进方案

在新的方案中，我将拥抱两个不同版本的Powershell，而不是像之前那样只使用自带的Windows Powershell，两个版本的Powershell将有自己的作用：

- Windows Powershell (PS 5.1)：系统终端（替代CMD）
  - 语法和功能上支持CMD的全部功能，也可以向下兼容CMD命令
  - 地位上位于系统内部，其他CLI工具或脚本调用Powershell也会默认调用它
  - 需求上要求**快速启动**，保持稳定，有**基础的Prompt展示**
- Powershell 7：开发终端，Windows Terminal和VS Code默认终端
  - 地位上和第三方Shell等同，虽然都叫Powershell，但和上面完全不是一个档次
  - 体验上对标zsh，有自动补全、建议等功能
  - 相较于现有方案改进启动速度

### Windows Powershell 的改进

原来的Windows Powershell使用oh-my-posh进行了Prompt美化，直接在官网使用了默认方案，但启动速度一直不是很理想。

后面才知道oh-my-posh 3用Golang重写了，原因是想用到不同终端上（疯了，别的终端为什么要用powershell的东西），才变得又卡又慢，体积还增大了。

根据上面的速度测试结果，我打算在两个Powershell上都换用starship作为Prompt工具，Windows Powershell就不做过多配置。

首先卸载现在的oh-my-posh，先用`(Get-Command oh-my-posh).Source` 得到exe的目录，然后找到卸载程序，直接运行即可。

根据官网提示安装starship：

```powershell
scoop install starship
```

然后编辑`$PROFILE` ：

```powershell
Invoke-Expression (&starship init powershell)
```

### Powershell 7的改进

除了在Windows Powershell中的Prompt工具外，Powershell 7 作为开发终端，我还需求一些额外的zsh功能：

- Bash-like Tab 补全
- 自动命令建议（IntelliSense）
- 基于历史记录的搜索

经过调研发现，上述这些功能都在Powershell官方提供的PSReadLine包中提供了，更巧的是这个包在Windows Powershell 5.1 和Powershell 7中都已经内置了，只需要使用选项激活即可。

事不宜迟，立刻编辑`$PROFILE` ：

```powershell
Invoke-Expression (&starship init powershell)

Set-PSReadLineOption -PredictionSource History # 设置预测文本来源为历史记录
Set-PSReadLineOption -Colors @{ InlinePrediction = '#875f5f'} # 增加预测内容在亚克力背景下的可读性

Set-PSReadlineKeyHandler -Key Tab -Function Complete # 设置 Tab 键补全
Set-PSReadLineKeyHandler -Key Tab -Function MenuComplete # 设置 Ctrl+d 为菜单补全和 Intellisense
Set-PSReadLineKeyHandler -Key "Ctrl+z" -Function Undo # 设置 Ctrl+z 为撤销
Set-PSReadLineKeyHandler -Key UpArrow -Function HistorySearchBackward # 设置向上键为后向搜索历史记录
Set-PSReadLineKeyHandler -Key DownArrow -Function HistorySearchForward # 设置向下键为前向搜索历史纪录
```

根据我的习惯，我做了以下定制：

- Tab映射为补全和菜单补全（只有一项时就直接补全）
- 上下箭头映射为历史记录搜索，没有输入则是默认行为
- 最重要的是，将预测文本来源为历史记录，提供了命令建议，这个键位是**右箭头**

最终我们的效果如下：

![](https://picgo-1308055782.cos.ap-chengdu.myqcloud.com/picgo-core/2023/08/20230806200221.gif)

### 设置VS Code默认终端

首先需要自定义一个Terminal Profile，这里直接复制Windows Terminal的参数即可。

然后将默认终端设置成刚刚创建的Profile即可。

> 等待补图

# Unix终端

在Windows上个人使用终端的主要场景其实是VS Code内置终端，而类Unix系统上GUI相较于Windows更弱，终端的使用场景要远多于Windows，因此地位也更加重要，很多Windows上用GUI解决的都要使用终端解决，如从目录打开VS Code这样一个简单的功能都需要从终端完成。

不过得益于Unix上终端的重要地位，其生态环境和使用体验也整体上优于Windows（也部分得益于Unix优秀的文件系统设计）。

这里以macOS和Ubuntu（WSL）为例配置和完善Unix终端体验，由于时间仓促，以快速构建工作环境为主，加之第一次接触mac，以下内容可能并不完善：

- Terminal：iterm2（macOS）+ Windows Terminal（WSL）
- Shell：zsh
- Prompt Engine：oh-my-zsh

## Shell强化

### iterm2 配置

原生的iterm2和系统自带的终端看起来没有什么区别，我们从配色、字体和Status Bar三个方面对其进行自定义。

- 配色：在这个仓库下载预设，我使用的是 _mocha_ 预设
- 字体：使用上面提到的 _FiraMono Nerd Prop_ 字体（提供Shell Prompt的字重显示）
- Status Bar：要达到下面的效果需要两步自定义
  - `Preferences-Appearance-General-Theme` 中设置为 `Minimal` 才能像这样隐藏背景
  - 上面的页面中还可以自定义Status Bar的位置
  - 在`Preferences > Profiles > Session` 中打开Status Bar，然后自定义选择自己想显示的字段

注意在设置的时候一定要对Profile进行设置，不然设置就是一次性的，下一次启动就没了。

![](https://picgo-1308055782.cos.ap-chengdu.myqcloud.com/picgo-core/2023/08/20230806200227.png)

### oh-my-zsh

oh-my-zsh是一款大名鼎鼎的zsh的Prompt工具，其应用广泛，生态良好，速度也较快。

根据官网指导直接安装即可：

```bash
sh -c "$(curl -fsSL https://raw.githubusercontent.com/ohmyzsh/ohmyzsh/master/tools/install.sh)"
```

#### 主题

在Github的Wiki上可以查看所有主题：[https://github.com/ohmyzsh/ohmyzsh/wiki/Themes](https://github.com/ohmyzsh/ohmyzsh/wiki/Themes 'https://github.com/ohmyzsh/ohmyzsh/wiki/Themes')

主题主要决定Prompt的显示模式，这里我选择gozilla主题，效果如上图所示。

#### 插件

oh-my-zsh的插件生态很丰富，大部分都是缩写Alias型的，这部分就根据自己喜好进行添加就好。这里只介绍几个比较关键的体验核心插件。

- autojump：需要配合autojump（通过homebrew安装）使用，作用是快速切换到工作目录
  原理是将曾用目录存储在一个数据库中，根据输入匹配频率最高的目录，需要在`oh-my-zsh` 中设置`autojump` 插件才能使用下面的Alias
  - `j` : 跳转到目录，智能选择频次最高的目录
  - `jo` : 利用资源管理器打开跳转的目录
- zsh-autosuggestions：提供类似Fish的自动补全功能，原理是记忆历史命令来补全，效果就和之前Powershell演示的一样
- zsh-syntax-highlight：将命令本身语法高亮，在输入前就可以判断命令是否错误

### vim

在Shell中难免遇到一些简单的文本编辑请求，这时调用外部编辑器就有些不太方便，这时使用vim进行编辑就可以快速完成。我对vim的定位就是简易的TUI编辑器，不需要什么异步执行、内置终端等功能。

#### neovim

neovim（`nvim`）和vim（`vim`）是两个不同的软件，前者是后者的重构实现，具有以下优势：

- 从头重构的架构，使用Lua JIT替代Vim Script
- 更好的插件开发环境和生态
- 提供异步执行和内置终端等功能，使NeoVim作为生产用IDE成为可能

但是，我作为一个轻量级用户，我只需要简单的TUI编辑器功能，neovim吸引我的地方只有一点，开箱即用，包括开箱即用的语法高亮和插件系统（几乎不需要修改什么）。

同样打开`.zshrc` ，neovim和vim不做任何配置的效果区别如下：

![neovim](https://picgo-1308055782.cos.ap-chengdu.myqcloud.com/picgo-core/2023/08/20230806200237.png 'neovim')

![vim](https://picgo-1308055782.cos.ap-chengdu.myqcloud.com/picgo-core/2023/08/20230806200240.png 'vim')

虽然据说vim8实现了neovim的很多功能，但秉承着省心的原则我选择neovim。

#### 基本概念

vim常用有四个模式：

- 正常模式（normal mode）：正常模式一般用于浏览文件，也包括一些复制、粘贴、删除等操作。在这个模式下，我们可以通过键盘在文本中快速移动光标，光标范围从小到大是字符、单词、行、句子、段落和屏幕。
  - 快速移动光标：h,j,k,l 分别对应了方向键的上下左右
  - `0` 移动到行首
  - `^` 移动到本行的第一个非空字符
  - `$` 移动到行尾
  - `w` 跳过一个单词（移动到下一个单词的开头）
  - `e` 移动到下一个单词的结尾
  - `f<ch>` 移动到下一个字符为ch处
  - `command+f/b` 下一页/上一页
- 插入模式（insert mode）：通过在正常模式下按下`i` 键切换，该模式启动以后，就会进入编辑状态，通过键盘输入内容。
- 命令模式（command mode）：在正常模式中，按下`：`（冒号）键或者`/` （斜杠），会进入命令模式。在命令模式中可以执行一些输入并执行一些 VIM 或插件提供的指令
  - `ls` 列出打开的所有文件
  - `b<n>` 切换到第n个文件
  - `<n>` 跳转到第n行
  - `set nu` 显示行号
  - `/<str>` 查找目标字符串
  - `<n1>,<n2>d` 删除从第n1行到第n2行的所有字符
  - `{作用范围}s/{目标}/{替换}/{替换标志}` 替换文本
- 可视模式（visual mode）：在正常模式按下`v, V, <Ctrl>+v`，可以进入可视模式。可视模式中的操作有点像拿鼠标进行操作，选择文本的时候有一种鼠标选择的即视感，有时候会很方便。
