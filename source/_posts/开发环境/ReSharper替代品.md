---
title: 寻找 ReSharper 开源替代
abbrlink: 2913837123
categories:
  - 开发环境
date: 2023-02-14 00:00:00
---

众所周知 JetBrains 家的IDE都十分的智能好用，Visual Studio 的代码提示和感知相比之下就略逊一筹。

凭着短暂的学生授权，我短暂地体验了几周 NetUltimate 工具包，其优秀的代码提示和质量检查功能令我印象深刻，这也是我Java环境选择IDEA的原因。

但基于以下几点，我最终还是选择了放弃ReSharper，回归原生Visual Studio体验。

- NetUltimate是收费工具，如果习惯该环境进行开发，在毕业后不从事.Net行业会额外付出高昂的授权费
- ReSharper会严重拖慢VS的启动速度，在打开公司的大型项目时尤为如此
- ReSharper配置项太多，相当于一个独立体系，学习成本较高

但我对其优秀的IDE功能印象深刻，因此为了部分复刻其功能，我选择对VS进行以下自定义来尽可能还原ReSharper功能。

## 前言

假期实习中短暂体验了.Net开发，让我对.Net和C#开发环境有一些自己的想法。

之前主要使用Typescript和React框架进行前端开发，对前端完整优秀的工具链印象深刻，直接使用VS进行开发给我带来了一定落差感。使用ReSharper一部分弥补了这种落差感，但基于上述缺点我又不得不放弃。

下面，我从一个前端开发者的角度，对Code Lint（代码质量）、Formatting（代码格式）、IntelliSense（代码提示和自动化工具）、编辑器样式等方面改造Visual Studio，改进.NET开发体验。



## 外观部分

配置完后（主题OneMonokai，字体Noto Sans CJK Mono）

![image-20230214141919637](https://picgo-1308055782.cos.ap-chengdu.myqcloud.com/picgo-new/202302141419805.png)

### 主题

原本使用VS Code一样的One Dark Pro，但为了保证拓展兼容性，最终选择了OneMonokai主题。

*注：One Dark Pro使用SonarLint后导致提示文本也为黑色，无法在深色背景下看清*

### 字体

根据最佳编程字体原则：

- 所有字母等距（Mono Space）
- 多语言支持（遇到中文字体不会回落到默认字体）
- 多语言等距（英文字母半角和中文字符全角宽度严格1比2）



选择以下备选项（优先级从高到低），我选择的是Noto Sans

- **Noto Sans CJK Mono（Google家）**
- 更纱黑体 Mono Nerd
- JetBrains Mono Nerd（JB家）
- Consolas（微软家）



---

## 拓展部分

### 1. 代码提示与重构

ReSharper中的代码重构提示令人印象深刻，我选择以下两款插件来尽可能还原

#### SonarLint

![image-20230214142555284](https://picgo-1308055782.cos.ap-chengdu.myqcloud.com/picgo-new/202302141425329.png)

- 形式：离线使用/免费注册后使用
- 功能：参考EsLint或PyLint，根据既定规则对代码质量进行改进提示
  - 可以自定义规则
  - 在线文档提供修改建议
  - 实时在编辑器中显示建议
- Bug：可能导致重构菜单自己消失

#### CodeRush

![image-20230214142710701](https://picgo-1308055782.cos.ap-chengdu.myqcloud.com/picgo-new/202302141427738.png)

- 形式：免费注册后使用
- 功能：提供ReSharper中部分快速重构功能

### 2. 代码格式化

#### Code Maid

Code Maid是一个十分强大的开源插件，我常用的功能有下面几个：

- 码撬窗口：显示当前文档类视图一般的列表，但支持实时重构和整理

  ![image-20230214143017991](https://picgo-1308055782.cos.ap-chengdu.myqcloud.com/picgo-new/202302141430029.png)

  - 拖拽改变顺序
  - 自动排序（可自定义规则）
  - 支持region

- 代码清理和格式化

  - 删除无用的using
  - 整理空行
  - 整理XML注释
  - 支持XAML整理
  - 支持第三方插件（Resharper、XAML Styler和自定义命令）
  - 可以保存时自动整理（但为了保证性能和兼容我选择了关闭）

- 生成进度展示

#### CSharpier

一个很霸道的格式化工具，不支持自定义规则，但是是体验最接近Prettier的格式化工具（支持保存时自动格式化）

体验见仁见智，有人喜欢全自动，有人喜欢有自己的格式就不适合这个插件。

经过我的测试，其格式化和Code Maid的代码清理并没有规则冲突。

#### XAML Styler

一个老牌XAML格式化工具，具有以下优点：

- 自定义项目多
- 兼容性好
- 支持保存时格式化（Format on save）

### 3. 其他代码工具

#### 快速创建

- Snippetica：提供简单的模板，方便创建代码
- Add New File：实现Shift+F2自动按格式从模板创建对应目录、文件
- Adjust C# Namespace：自动根据目录层级重构命名空间
- XML Doc Provider：自动生成XML注释

#### 界面改进

- C# Var Type CodeLens：显示Var的实际类型
- Indent Guides：显示缩进层级

#### 体验改进

- Open In VSCode：在VSC中打开指定文件（开发其他语言有奇效）
- Select Next Occurrence：获得VSCode的选择体验
- Auto Save：模仿VSCode按时间间隔自动保存
- ILSpy：自动定位到对应反编译代码
- Git Diff：获得VSCode中Git Lens的部分体验