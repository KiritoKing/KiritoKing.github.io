---
title: Windows Dev Drive 快速上手体验
date: '2023/11/16 01:01:33'
excerpt: >-
  Windows 11 23H2的Windows Dev Home是一个新的开发者中心，提供了一些功能来改进Windows开发。此外，Windows 11
  23H2还提供了Dev
  Drive，这是一个基于ReFS的新存储卷，具有性能提升和数据可靠性。在基准测试中，发现ReFS在开发命令下性能更好，平均领先幅度为5秒左右，但NTFS的性能也相当不错。总的来说，Dev
  Home和Dev Drive对于Windows开发者来说是有一定帮助的。
alias:
  - post/Technology/win-dev-drive-hands-on/index.html
  - post/technology/win-dev-drive-hands-on/index.html
---

随着Windows 11 23H2发布的除了大名鼎鼎的Copilot，还有Windows Dev Home。比起感觉噱头大于实用性的Coplilot，个人更关注Dev Home对Windows开发有什么改进之处。

# 没什么用的Dev Home

这里先简单谈谈另一个更新——开发者中心（Dev Home），就是下面这玩意儿：

![](https://picgo-1308055782.cos.ap-chengdu.myqcloud.com/win11-new2023%2F11%2F20231116010412.png?imageSlim)

根据官网，它提供以下功能：

- 快速仪表盘监控电脑和开源工作流
- 提供一个配置WSL的GUI环境，包括系统配置和存储库管理
- Windows开发功能集合，如存储库管理、Dev Drive和WinGET等

由于它的插件基本还处于不可用阶段，定义为没用，不如终端。

# 有一点新东西的Dev Drive

Dev Drive是基于ReFS（Resilient File System，弹性文件系统），针对开发者优化推出的新存储卷。据微软官方介绍，整体构建时间性能提升30%。

## ReFS

> 底层详见：[https://learn.microsoft.com/zh-cn/windows-server/storage/refs/refs-overview](https://learn.microsoft.com/zh-cn/windows-server/storage/refs/refs-overview 'https://learn.microsoft.com/zh-cn/windows-server/storage/refs/refs-overview')

ReFS（Resilient File System，弹性文件系统）是微软推出的新文件系统，是1992年推出的NTFS的继任者。它具有以下特性：

- 复原性
  - 自动完整性校验和主动纠错
  - 完整性流：利用元数据校验文件损坏
- 性能优化
  - 加快奇偶校验过程
  - 加快虚拟化操作（加快WSL在其上工作的性能）
    - 块克隆可加快复制操作的速度，并且能够实现快速、低影响的 VM 检查点合并操作；
    - 稀疏 VDL 允许 ReFS 将文件快速清零，从而将创建固定 VHD 所需的时间从几十分钟减少到仅仅几秒钟。
- 极大文件支持：ReFS 设计为支持非常大的数据集（数百万 TB 字节），而不会对性能有负面影响

### 适用场景

NTFS仍能满足大部分基础需要，在某些特定场景下可以使用ReFS

| Feature          | ReFS                | NTFS                |
| ---------------- | ------------------- | ------------------- |
| 最大文件名称长度 | 255 个 Unicode 字符 | 255 个 Unicode 字符 |
| 最大路径名称长度 | 32K Unicode 字符    | 32K Unicode 字符    |
| 文件大小上限     | 35 PB（拍字节）     | 256 TB              |
| 最大卷大小       | 35 PB               | 256 TB              |

- 大型/私人服务器场景（面向Windows Server）提供更好的数据可靠性
- 需要存储非常大的单个文件
- 需要强大的数据可靠性和可恢复性

## VHD & VHDX

VHDX 文件是虚拟硬盘 v2 文件格式的磁盘映像文件，它包含一个完整的物理磁盘分区信息，但是存储在单个文件中。它支持固定大小、动态大小两种形式。

与doc与docx的关系类似，VHDx是VHD（Virtual Hard Disk）的后续格式，用于描述虚拟硬盘的文件及系统。

当你创建了一个VHDX后会多出一个对应文件：

![](https://picgo-1308055782.cos.ap-chengdu.myqcloud.com/win11-new2023%2F11%2F20231116010423.png?imageSlim)

打开这个文件就会自动挂载该硬盘，与ISO/DMG一样，挂载后的行为也和正常磁盘一致，可以弹出。

![](https://picgo-1308055782.cos.ap-chengdu.myqcloud.com/win11-new2023%2F11%2F20231116010427.png?imageSlim)

使用VHDX而非物理分区来创建开发用ReFS硬盘的好处是在设置应用中即可快速创建虚拟分区，无需重启电脑，也不会提前占用空间。

![](https://picgo-1308055782.cos.ap-chengdu.myqcloud.com/win11-new2023%2F11%2F20231116010432.png?imageSlim)

## 开始使用Dev Drive

在上面的设置中我们点击创建Dev Drive，根据提示即可创建我们的分区。

![](https://picgo-1308055782.cos.ap-chengdu.myqcloud.com/win11-new2023%2F11%2F20231116010434.png?imageSlim)

![](https://picgo-1308055782.cos.ap-chengdu.myqcloud.com/win11-new2023%2F11%2F20231116010437.png?imageSlim)

根据官网，微软建议将工作目录、存储库和包缓存放置在开发驱动器上，依赖ReFS，构建、依赖解析、Git等方面将获得一些性能提升。

![](https://picgo-1308055782.cos.ap-chengdu.myqcloud.com/win11-new2023%2F11%2F20231116010439.png?imageSlim)

### 前端Benchmark

这里用我个人博客项目来做一个简单的基准测试，由于Dev Drive之前吹嘘了Git性能，我就想从冷启动Clone开始测试性能：

- 测试项目：在Dev Drive（VHDX+ReFS）和普通逻辑分区（NTFS）分别运行`git clone`、`pnpm install`和`pnpm run build`测试前端开发的全流程
- 测试仓库：[https://github.com/KiritoKing/KiritoKing.github.io](https://github.com/KiritoKing/KiritoKing.github.io 'https://github.com/KiritoKing/KiritoKing.github.io')
- 测试工具：[hyperfine](https://github.com/sharkdp/hyperfine 'hyperfine')

由于测试内容跨分区，我Powershell学艺不精，靠GPT帮忙写了份测试脚本，将这份脚本分别放在了D:和E:的根目录下。

```powershell
param(
    [string]$repoUrl
)

# 检查是否提供了仓库地址
if (-not $repoUrl) {
    Write-Host "请提供仓库地址作为参数。"
    Exit
}

# 获取当前脚本所在的路径作为仓库本地存储路径
$repoFolder = Join-Path $PSScriptRoot "test_repo"

# Clone Git 仓库
git clone $repoUrl $repoFolder

# 进入仓库目录
cd $repoFolder

# 安装依赖
pnpm install
# 构建项目
pnpm run build

```

随后运行测试脚本，结果如下图所示：

![](https://picgo-1308055782.cos.ap-chengdu.myqcloud.com/win11-new2023%2F11%2F20231116010445.png?imageSlim)

结果令人有些大跌眼镜，没想到NTFS（D:）居然比ReFS（E:）更快，但是考虑到Git Clone受网络波动影响，二者的最快性能没有明显差异（2%的平均速度差）。

我们随后又简单修改了脚本，专门测试`pnpm install && pnpm build`的性能，这个操作比Clone要更频繁一些。

在D盘（NTFS）的测试结果如下：

![](https://picgo-1308055782.cos.ap-chengdu.myqcloud.com/win11-new2023%2F11%2F20231116010446.png?imageSlim)

在E盘（ReFS）的测试结果如下：

![](https://picgo-1308055782.cos.ap-chengdu.myqcloud.com/win11-new2023%2F11%2F20231116010448.png?imageSlim)

可以看到在真正的开发命令下ReFS翻身做主人，平均5s（约18%）的领先幅度，不多但有点用，且不能排除虚拟磁盘对性能的影响。

因此，在日常开发环境下，Dev Drive即便在如此不平衡的试验下仍能取得一定的优势，且它可以轻松地将代码组织在一个磁盘下，很好地满足了我的整洁癖，个人评价值得一用。
