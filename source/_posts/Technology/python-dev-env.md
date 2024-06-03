---
title: Python 编程环境重新构建
category: Technology
date: '2023/07/09 08:00:00'
excerpt: >-
  在新机器和旧机器上重新配置统一的Python环境和管理方案，使用一个全局最新版Python +
  Conda管理项目中不同版本Python虚拟环境的方案，同时优化终端速度和体验。
alias: post/Technology/python-dev-env/index.html
---

虽然日常工作里做Web开发比较多，一般都是全套JS/TS解决问题，但偶尔也会有用到Python的场景，如涉及到数据分析、科学计算和机器学习等领域，Python往往是绕不开的，也会在特定领域用Python去展开一些后端或者RPC的开发。

但是好巧不巧，现在我的工作电脑上Python的环境可以说是一塌糊涂，版本和依赖都很混乱。为此，我打算好好地整理一下我的Python使用流程和环境，打造一个干净快速的开发环境。

这篇博客主要记录我折腾和理解Python环境的过程，主要有两项工作

- **从零开始**构建面向PyQt5的Python环境
- 重新整理已有的混乱Python环境，并重建conda+pytorch+cuda工作环境

## 解决方案总结

> 🌟全局只使用一个Python（winget官方源），使用miniconda管理多个Python环境

- 默认环境变量中只留下一个Python（winget-ms-store源），使用Windows Store安装，保持最新同步，**不做虚拟环境管理，使用一个共享环境来满足简单开发需求**（路径为：`~/AppData/Local/Microsoft/WindowsApps/python.exe`）
- 使用miniconda来管理虚拟环境，满足特定环境开发需求，如机器学习、Qt开发等
  - 相较于之前的环境，现在的全局变量不再包含conda的Python路径，而只包含必要的Scripts，在默认Shell中只能操作conda而不能使用其他Python版本
  - 使用专门的Anaconda Prompt终端来使用conda的虚拟环境，切换Python和pip版本等
  - 在VS Code中使用自带的解释器选择来切换虚拟环境。由于Conda的虚拟环境切换是物理路径隔离，因此Code Runner使用`$pythonPath -u $fullFileName` 配置即可
  - 使用miniconda来替换anaconda是因为我只对conda的管理功能有需求，其它科学计算库我更倾向于按需引入

![整理环境后，干干净净](https://picgo-1308055782.cos.ap-chengdu.myqcloud.com/picgo-core/2023/07/20230709145600.png '整理环境后，干干净净')

![整理环境前， 结果里赫然显示了6个Python](https://picgo-1308055782.cos.ap-chengdu.myqcloud.com/picgo-core/2023/07/20230709145602.png '整理环境前， 结果里赫然显示了6个Python')

## conda的使用

conda是一个**包管理器**，也提供**虚拟环境管理**功能，这二者也是我们使用conda的重要原因。

- conda相比pip它使用自建的源提供软件包（这也是很多软件找不到的原因），而不像pip只提供一个指向SourceForge的链接
  注：在环境变量正常的情况下，激活虚拟环境后可以使用指定环境的pip
- conda支持所有语言编写的二进制软件包，不像pip只提供Python软件包（虽然pip也支持安装二进制wheel）
- conda的虚拟环境管理相比venv更完善、更好用

### anaconda和miniconda

在conda之上，我们有两个“分支”都可以获取conda本体：

- anaconda：包含了所有科学运算需要的包和conda，一个大而全的Python科学运算库，适合不专精开发的数据科学研究者
- miniconda：仅包含conda, python和一些必须的依赖，其他科学运算库需要按需引入，一个小而美的Python解决方案，适合喜欢自定义的开发者

这里由于我的需求并不需要anaconda的全部库，选择了miniconda。

### 终端配置

> 终端美化方面请移步：[终端解决方案](https://www.wolai.com/mWoCoTKv9jJRQDKUQyEpct '终端解决方案')

使用`conda init <shell>` 可以为指定Shell注入conda-hooks，启用虚拟环境能力

> 🌟**不推荐在日用Shell中启用，这就是我Powershell卡的罪魁祸首**

#### 直接在Powershell中使用Conda

现在的conda在安装时不再建议添加环境变量，而是使用专门的Anaconda Prompt（即专门的Shell）来操作。

> Not recommended.Instead,open Anaconda with the Windows Start menu and select "Anaconda (64-bit).This add to "PATH" option makes Anaconda get found before previously installed software,but may cause problems requiring you to uninstall and reinstall Anaconda.

我本来不理解，直到配置了新电脑发现我的老电脑的Powershell启动奇慢无比，才开始找原因。

#### 环境变量（PATH）

如果不将conda的相关路径添加到环境变量，如下图的四项所示（其实GCC那项如果你已经安装了其他GCC就不用了），你就不能在Anaconda Prompt以外的地方（如Powershell）中使用`conda`命令。

这不会对你的性能产生什么影响，如果你没有程序不兼容的话可以添加，比较方便。

这里个人推荐只添加`$CONDA/Library/bin`和`$CONDA/Library/usr/bin`两个目录到PATH中，而不要添加根目录（包含Python），这样就可以使用conda功能而不破坏全局Python版本管理。

![](https://picgo-1308055782.cos.ap-chengdu.myqcloud.com/picgo-core/2023/07/20230709145607.png)

#### 自动激活`base`环境

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

![加载 profile.ps1 ： 2309ms](https://picgo-1308055782.cos.ap-chengdu.myqcloud.com/picgo-core/2023/07/20230709145610.png '加载 profile.ps1 ： 2309ms')

![不加载 profile.ps1 ： 664ms](https://picgo-1308055782.cos.ap-chengdu.myqcloud.com/picgo-core/2023/07/20230709145612.png '不加载 profile.ps1 ： 664ms')

> 🚦如果你没有频繁调试Python的需求，请不要将这个`profile.ps1`设为常加载项，即使你使用`conda config --set auto_activate_base false`取消了自动激活`base`环境，它也会执行上述检查路径的过程拖慢启动。

### conda的常用指令

#### 虚拟环境相关

- `conda create -n <name> python=<version>` 创建一个虚拟环境并指定版本
- `conda activate <name>` 激活虚拟环境
- `conda deactivate` 退出当前虚拟环境，回到base环境
- `conda env info` 查看当前虚拟环境信息
- `conda env list`列出所有虚拟环境
- `conda env remove -n <name>`移除一个虚拟环境（并删除其依赖）
- `conda env export > env.yaml` 导出当前虚拟环境配置
- `conda create -f <config>` 从配置文件复制虚拟环境&#x20;

#### 包管理相关

- `conda update -n <env> <pkg>` 更新依赖
  - `<env>` 可以不指定，默认更新base环境（或当前环境）
  - `<pkg>` 可以指定为conda或anaconda来更新自身
- `conda install -n <env> <pkg> -c <channel>` 安装依赖
  - `<env>` 可以不指定，默认更新base环境（或当前环境）
  - **`<pkg>`**\*\* 可以指定为Python，为当前环境安装自己的Python，否则将使用环境变量中的Python\*\*​

### 使用mamba改进conda

conda虽然有着优秀的科学计算环境和虚拟环境管理，但其令人诟病的依赖解析速度 ~~（永远在solving）~~ 和单线程下载不禁让人想起隔壁的难兄难弟npm。

mamba为了改写conda下载慢的局面应运而生了，主打下面这些特性：

- `conda`无缝替换为`mamba`（**drop-in alternative**），可以用mamba来执行任何conda指令，包括安装依赖和虚拟环境
- 使用多线程并行加速下载
- 使用`libsolv` 加速依赖解析
- 核心部分是通过C++实现，以获得最大执行效率

安装mamba的指令

```bash
$ conda install -c conda-forge mamba

```

安装完成后飞速体验了下，确实起飞

![](https://picgo-1308055782.cos.ap-chengdu.myqcloud.com/picgo-core/2023/07/20230709145614.gif)

使用`mamba` 安装pytorch：

```bash
# 创建并激活虚拟环境
$ mamba create -n pytorch python=3.9
$ mamba activate pytorch
# 使用官方推荐的安装方式
$ mamba install pytorch torchvision torchaudio pytorch-cuda=11.8 -c pytorch -c nvidia
```

可以看到1.5GB的文件相较于mamba的速度可以说是直接起飞，限制你的只有网速和防火墙。

![](https://picgo-1308055782.cos.ap-chengdu.myqcloud.com/picgo-core/2023/07/20230709145617.png)

由于我之前安装好了cuda11.8和对应的cudnn，这里直接展示结果（**也可以看到mamba全新安装pytorch居然只用了10分钟**）：

![](https://picgo-1308055782.cos.ap-chengdu.myqcloud.com/picgo-core/2023/07/20230709145619.png)

## 重新构建Pytorch生产环境

由于之前Winget手贱更新Conda的时候不小心把我之前辛苦配好的环境卸载了，当时安装的时候就挺痛苦的，半天都启用不了cuda。

半年后的今天我再来捋一捋这个环境依赖的逻辑，看看能不能跑通。

> 使用环境：miniconda+mamba

### 安装cuda

> 如果你不是N卡用户或者只想使用CPU请跳过这部分

1.  首先确保你正确安装了显卡驱动，在Shell中运行`nvidia-smi` 查看显卡信息，可以看到我的cuda版本是12.0

![](https://picgo-1308055782.cos.ap-chengdu.myqcloud.com/picgo-core/2023/07/20230709145622.png)

1.  根据cuda版本在[**官网**](https://developer.nvidia.com/cuda-toolkit-archive '官网')中下载对应版本的CUDA Toolkit，版本要求是不高于自身GPU版本的Pytorch最高支持版本
    - 个人实测cuda本身是**向下兼容**的，即GPU支持更低版本的cuda，如我的就支持18
    - pytorch目前只官方支持到cuda18，但**社区**表示是**向上兼容**的，即pytorch的cuda18支持Toolkit 的20+
2.  根据Toolkit版本去[官网](https://developer.nvidia.com/rdp/cudnn-download '官网')下载安装cudnn，压缩包解压后放进Cuda Toolkit安装目录的对应文件夹里

![](https://picgo-1308055782.cos.ap-chengdu.myqcloud.com/picgo-core/2023/07/20230709145624.png)

1.  检查安装，Shell运行`nvcc -V`&#x20;

![](https://picgo-1308055782.cos.ap-chengdu.myqcloud.com/picgo-core/2023/07/20230709145626.png)

### 安装Pytorch

访问[Pytorch官网](https://pytorch.org/ 'Pytorch官网')获取你的平台的安装代码：

![](https://picgo-1308055782.cos.ap-chengdu.myqcloud.com/picgo-core/2023/07/20230709145628.png)

我的平台安装代码如下（我使用mamba替代conda加快了安装进程）

```bash
# 创建并激活虚拟环境
$ mamba create -n pytorch python=3.9
$ mamba activate pytorch
# 使用官方推荐的安装方式
$ mamba install pytorch torchvision torchaudio pytorch-cuda=11.8 -c pytorch -c nvidia

```

由于我之前安装好了cuda11.8和对应的cudnn，这里直接展示结果（**也可以看到mamba全新安装pytorch居然只用了10分钟**）：

![安装过程](https://picgo-1308055782.cos.ap-chengdu.myqcloud.com/picgo-core/2023/07/20230709145631.png '安装过程')

![安装结果](https://picgo-1308055782.cos.ap-chengdu.myqcloud.com/picgo-core/2023/07/20230709145633.png '安装结果')
