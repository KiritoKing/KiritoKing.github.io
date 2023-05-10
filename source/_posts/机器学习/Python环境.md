---
title: Python 编程环境重新构建
tags:
  - Python
  - 编程环境
  - 版本管理
excerpt: >-
  在新机器和旧机器上重新配置统一的Python环境和管理方案，使用一个全局最新版Python +
  Conda管理项目中不同版本Python虚拟环境的方案，同时优化终端速度和体验。
categories:
  - 机器学习
abbrlink: 768258525
date: 2023-05-10 20:25:59
---


这篇博客主要记录我折腾和理解Python环境的过程，主要有两项工作

- 公司电脑上**从零开始**构建面向PyQt5的Python环境
- 个人电脑管理已有的混乱Python环境，同时不影响已经搭建的Py3.9+Conda+Pytorch+Cuda环境

直接说我的解决方案：

> - 全局Python：使用从Microsoft Store下载的Python发行版（路径为：`~/AppData/Local/Microsoft/WindowsApps/python.exe`），由自动更新保持同步，使用全局+venv管理一些简单Python程序
> - Anaconda/Miniconda：使用`conda`管理真正的生产项目，包括机器学习、pyqt等
>   - 全局环境变量不再包含anaconda的路径，使用专门的Anaconda Prompt终端控制，这样也可以忽略全局安装的Python，使pip对指定版本可用
>   - conda有完整的虚拟环境解决方案，可以同时管理多个生产环境中独立的版本

## 老环境现状

我在CMD中运行`where python`，结果里赫然显示了6个Python，而且每个的依赖都不一样，毫无管理可言。

![image-20230506224217370](https://picgo-1308055782.cos.ap-chengdu.myqcloud.com/picgo-new/202305062242740.png)



## 逐步解决问题

### conda的使用

#### `anaconda`和`miniconda`

> Miniconda is a free minimal installer for conda. It is a small, bootstrap version of Anaconda that includes only conda, Python, the packages they depend on, and a small number of other useful packages, including pip, zlib and a few others. Use the `conda install` command to install 720+ additional conda packages from the Anaconda repository.

conda（含anaconda和miniconda）提供了一系列Python管理工具，包括更完善的虚拟环境和版本管理等，而在官网提供了`anaconda`和`miniconda`两个“分支”。

- `Anaconda`会一次性安装几千个你（可能）会用到的包；
- `miniconda`则仅包含`conda`、`python`和最小限度的依赖包，保持了小体积

总得来说，`miniconda`很适合我这种仅仅使用`conda`核心功能且喜欢自己配置项目环境的人，在新电脑上我会选择这个方案，但由于我这个电脑上已经配置好了`anaconda`的 pytorch+cuda 环境，因此我就不再更换重装`conda`环境，而是仅仅对Python版本进行管理和升级。

#### 虚拟环境管理

- `conda create -n <name> python=3.11` 创建一个虚拟环境并指定版本
- `conda update conda`和`conda update anaconda`可以分别更新conda和anaconda套件
- `conda install python`可以更新当前python的大版本最新版本，也可以指定版本
- `conda activate <name>`激活虚拟环境
- `conda env remove -n <name>`移除一个虚拟环境
- `conda env list`列出所有虚拟环境

#### `conda init`指令

#### 在conda中使用pip

有些包中conda的版本滞后或者根本没有，还是必须要使用pip安装，在将conda独立到Anaconda Prompt中可以直接使用pip安装，而不用使用奇技淫巧来保证不安装到其他目录。

### 原生版本管理

原生Python提供了**pyinstaller**来管理python版本和**venv**来管理依赖，虽然不是很完美，但是足够轻量。

#### pyinstaller

#### venv



---

### 终端配置（Powershell）

对比公司电脑，我个人电脑的Powershell现在启动。现在有的加载项为：

- **conda** 虚拟环境
- **oh-my-posh** 终端美化

在Windows Terminal中**将启动参数中的`-nol`删去，显示Shell启动信息以便调试**。

#### Profile 配置文件

打开相关的`profile.ps1`，根据[微软的官方文档](https://learn.microsoft.com/zh-cn/powershell/module/microsoft.powershell.core/about/about_profiles?view=powershell-7.3)，配置文件在Windows中存储在以下目录，且**按顺序加载**，也就是说后加载的可以覆盖先加载的配置~~（不会有人在非Windows环境下使用Powershell吧）~~

> 注意：Win10/11下会同时有**Powershell5**和**Powershell7**两个版本，`$HOME\Documents\PowerShell`是**Powershell7**的目录，而`$HOME\Documents\Windows Powershell`是**Powershell5**的目录（`system32`中自带的Powershell版本）

- 全局配置（所有用户、所有主机）： `$PSHOME\Profile.ps1`（在我的电脑上是`$PSHOME=C:\Windows\System32\WindowsPowerShell\v1.0`）
- 所有用户，当前主机：`$PSHOME\Microsoft.PowerShell_profile.ps1`
- 当前用户、所有主机：`$HOME\Documents\PowerShell\Profile.ps1`（或者直接是`$PROFILE`）
- 当前用户、当前主机：`$HOME\Documents\PowerShell\Microsoft.PowerShell_profile.ps1`

#### 直接在Powershell中使用Conda

现在的conda在安装时不再建议添加环境变量，而是使用专门的Anaconda Prompt（即专门的Shell）来操作。

> Not recommended.Instead,open Anaconda with the Windows Start menu and select "Anaconda (64-bit).This add to "PATH" option makes Anaconda get found before previously installed software,but may cause problems requiring you to uninstall and reinstall Anaconda.

我本来不理解，直到配置了新电脑发现我的老电脑的Powershell启动奇慢无比，才开始找原因。

##### 环境变量（PATH）

如果不将conda的相关路径添加到环境变量，如下图的四项所示（其实GCC那项如果你已经安装了其他GCC就不用了），你就不能在Anaconda Prompt以外的地方（如Powershell）中使用`conda`命令。

这不会对你的性能产生什么影响，如果你没有程序不兼容的话可以添加，比较方便。

这里个人推荐只添加`$CONDA/Library/bin`和`$CONDA/Library/usr/bin`两个目录到PATH中，而不要添加根目录（包含Python），这样就可以使用conda功能而不破坏全局Python版本管理。

![image-20230506231830163](https://picgo-1308055782.cos.ap-chengdu.myqcloud.com/picgo-new/202305062318636.png)

##### 自动激活`base`环境

运行`conda init powershell`会在你的用户目录`$PROFILE`生成一个`profile.ps1`，里面的内容如下，而**这个就是我Powershell启动慢的罪魁祸首**：

```powershell

#region conda initialize
# !! Contents within this block are managed by 'conda init' !!
If (Test-Path "C:\Users\kirito\anaconda3\Scripts\conda.exe") {
    (& "C:\Users\kirito\anaconda3\Scripts\conda.exe" "shell.powershell" "hook") | Out-String | ?{$_} | Invoke-Expression
}
#endregion

```

性能对比如下，可以说是立竿见影：

> **结论**：
>
> 如果你没有频繁调试Python的需求，请不要将这个`profile.ps1`设为常加载项，即使你使用`conda config --set auto_activate_base false`取消了自动激活`base`环境，它也会执行上述检查路径的过程拖慢启动。

加载`profile.ps1`：**2309ms**

![image-20230506233531366](C:/Users/kirito/AppData/Roaming/Typora/typora-user-images/image-20230506233531366.png)

不加载`profile.ps1`：**664ms**

![image-20230506233558513](C:/Users/kirito/AppData/Roaming/Typora/typora-user-images/image-20230506233558513.png)