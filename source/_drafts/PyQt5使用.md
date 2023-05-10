---
title: 利用PyQt5开发一个局域网文件共享GUI程序
tags:
---

s

## 环境准备

由于现在的环境不是自己的电脑，需要从最开始进行环境配置。

### Python 环境选择

最开始准备直接使用最新的Python3.11.7开始，后面还是觉得Python自带的`venv`功能太弱，使用`conda`来隔离和管理项目虚拟环境更方便，毕竟可能只有这一个项目会用到`PyQt`相关的库。

#### `anaconda`和`miniconda`

> Miniconda is a free minimal installer for conda. It is a small, bootstrap version of Anaconda that includes only conda, Python, the packages they depend on, and a small number of other useful packages, including pip, zlib and a few others. Use the `conda install` command to install 720+ additional conda packages from the Anaconda repository.

`Anaconda`会一次性安装几千个你会用到的包，而`miniconda`则仅包含`conda`、`python`和最小限度的依赖包，保持了小体积，很适合我这种仅仅使用`conda`核心功能且喜欢自己配置项目环境的人。

**注意，`Anaconda`安装的依赖中可能包含一些关键的数据科学、机器学习包，虽然`miniconda`也可以手动安装这些包。**

最后，由于我喜欢的[PyQt-Fluent-Widgets](https://github.com/zhiyiYo/PyQt-Fluent-Widgets)还没有发布在conda上，我还是选择了传统的Python+venv来管理项目。

### Qt库选择

现在市面上成熟的主流QT解决方案有：PyQt5、PyQt6、PySide2。

### 开发环境构建

个人比较喜欢用VSC来开发Python项目，包括机器学习这些，这里也沿用VSC。

最近微软官方搞了一点新活，以前Linter和Formatter都是在**Python扩展**里设置pip包路径的，而现在给`pylint`和`autopep8`这些单独搞了一个拓展。

根据他官方的说法，这些插件是**仅在当前Python环境中没有找到对应pip包时才会使用内建的二进制文件**。

> The bundled `pylint` is only used if there is no installed version of `pylint` found in the selected `python` environment.

个人认为这是一个有利的方案，一方面提供了开箱即用的体验（直接安装扩展即可），一方面也不会破坏已有的方案。

#### Lint方案

python有很多成熟的lint（代码检查）方案，这里我选择最广泛的**pylint**：

需要注意的是，我个人喜欢使用VSC来开发Python（因为个人对Python的需求并不大，用不上PC），而VSC里的PyLint插件和pip包是可以独立存在的

pylint有一个很经典的问题：[无法正常检查C-Bininary库](https://stackoverflow.com/questions/56726580/no-name-qapplication-in-module-pyqt5-qtwidgets-error-in-pylint)（如PyQt5, opencv等），而且我还遇到过不止一次~~（虽然每次都很丢脸地又去搜索）~~。

**解决方案：**

- 首先需要在python环境中安装`pylint`这个pip包，然后运行`pylint --generate-rcfile > .pylintrc`
- 然后在你的项目文件中找到`.pylintrc`，在`[MASTER]`部分找到`extension-pkg-whitelist=`，并填入你想要忽略的C语言库的名称，这里我们填入`PyQt5`

#### Formatter方案

按照老规矩使用我最爱的autopep8，在新方案下直接安装扩展即可，非常方便。（不过仍建议安装pip包）

暂时没有遇到什么问题。

### 虚拟环境与打包

