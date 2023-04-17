---
title: 初探 C# Script
abbrlink: 3021583790
categories:
  - 刷题笔记
date: 2023-04-11 00:00:00
---

*注：以下所有环境均为.net7.0*

# C# Script（CSX）

C#脚本的根源是伴随着VS2015发布的 **C# 读取-求值-打印-循环 (REPL)**，类似于一个CLI（Command-Line-Interface，命令行）环境，称为**REPL CSI**。这个CLI环境的发布也顺带引入了**将C#脚本化的可能性**。

以下是官网对C#脚本用途的定义：

**C# 脚本是一款用于测试 C# 和 .NET 代码段的工具，无需创建多个单元测试或控制台项目。它提供了轻型选项，可快速在命令行上对 LINQ 聚合方法进行编码、检查 .NET API 是否解压缩文件或调用 REST API，以了解返回的内容或工作原理。它提供了探索和了解 API 的简便方法，无需对 %TEMP% 目录中的另一个 CSPROJ 文件支付开销。**

我个人的理解的话就是C#的REPL CSI**相当于一个C#版的Python虚拟机**，一方面有一个解释型的CLI，一方面支持解释型的脚本。它可能会慢一点，但是对快速测试或者快速实现一个脚本功能是非常便利的。

*理论相关参考了这篇文章：[必备 .NET - C# 脚本 | Microsoft Learn](https://learn.microsoft.com/zh-cn/archive/msdn-magazine/2016/january/essential-net-csharp-scripting)*

## 编写C#脚本

接下来我们以做算法题为场景学习C#脚本的使用。

C#脚本的规则与C#9中的顶层语句很像，语法也和普通C#完全一致。

主要区别有以下几个：

- 引入程序集：`#r <Assembly.dll>`
  - 这里直接按相对路径引入即可
  - VSCode有个奇怪错误就是必须`#r System.Console`才不会报错，但实际上不影响运行，甚至加了`.dll`反而会报错
- 引入其他脚本 `#load <script.csx>`
  - 个人理解是直接把这些东西像宏一样加载进来
- 引用命名空间仍然使用 `using`

---

下面用经典的**牌组大小判断**为例展示一下CSX的编写：

`main.csx`

```csharp
#r "System.Console"
#load "CardAnalyzer.csx"

string line = "3 4 5 6 7-10 J Q K A";

while ((line = Console.ReadLine()) != null)
{
  var tokens = line.Split('-');
  if (tokens.Length < 2) break;
  var a = GetCardsType(tokens[0]);
  var b = GetCardsType(tokens[1]);
  if (a == CardGroupType.Illegal || b == CardGroupType.Illegal)
  {
    Console.WriteLine("ERROR");
  }
  else if (a == CardGroupType.JokerBomb)
  {
    Console.WriteLine(tokens[0]);
  }
  else if (b == CardGroupType.JokerBomb)
  {
    Console.WriteLine(tokens[1]);
  }
  else if (a == b)
  {
    if (a == CardGroupType.Multiple && tokens[0].Split(' ').Length != tokens[1].Split(' ').Length)
    {
      Console.WriteLine("ERROR");
      continue;
    }
    var aMin = GetBaseCard(tokens[0]);
    var bMin = GetBaseCard(tokens[1]);
    if (aMin > bMin)
      Console.WriteLine(tokens[0]);
    else
      Console.WriteLine(tokens[1]);
  }
  else if (a == CardGroupType.Bomb)
  {
    Console.WriteLine(tokens[0]);
  }
  else if (b == CardGroupType.Bomb)
  {
    Console.WriteLine(tokens[1]);
  }
  else
  {
    Console.WriteLine("ERROR");
  }

}
```

`CardAnalyzer.csx`

```csharp
enum CardGroupType
{
  Single = 0,
  Couple,
  Triple,
  Multiple,
  Bomb,
  JokerBomb,
  Illegal
}

int ParseCard(string card)
{
  int num;
  if (int.TryParse(card, out num))
  {
    return num - 3;
  }
  else
  {
    switch (card)
    {
      case "J":
        return 8;
      case "Q":
        return 9;
      case "K":
        return 10;
      case "A":
        return 11;
      case "joker":
        return 12;
      case "JOKER":
        return 13;
      default:
        return -1;
    }
  }
}

CardGroupType GetCardsType(string token)
{
  string[] cards = token.Split(' ');
  int count = 0;
  int? prev = null;
  bool same = true;
  int lastCard = -1;
  foreach (var card in cards)
  {
    var cardIndex = ParseCard(card);
    if (same && (prev == null || prev == cardIndex))
    {
      count++;
      prev = cardIndex;
      lastCard = cardIndex;
    }
    else if (cardIndex == prev + 1)
    {
      count++;
      prev = cardIndex;
      same = false;
      lastCard = cardIndex;
    }
    else
      return CardGroupType.Illegal;
  }
  if (count == 1) return CardGroupType.Single;
  else if (same && count == 2) return CardGroupType.Couple;
  else if (same && count == 3) return CardGroupType.Triple;
  else if (same && count == 4) return CardGroupType.Bomb;
  else if (!same && count >= 5) return CardGroupType.Multiple;
  else if (count == 2 && lastCard == 13) return CardGroupType.JokerBomb;
  else return CardGroupType.Illegal;
}

int GetBaseCard(string token)
{
  string[] cards = token.Split(' ');
  List<int> cardNums = new List<int>();
  foreach (var card in cards)
  {
    var cardIndex = ParseCard(card);
    cardNums.Add(cardIndex);
  }
  return cardNums.Min();
}
```

## CSX 运行时

有两个工具可以用来运行CSX脚本：

- **dotnet-script**：推荐
- scriptcs

### dotnet-script

这是一个官方提供的CSX运行时，提供以下功能：

- 提供脚本运行环境（`dotnet script xxx.csx`直接运行脚本）
- 提供脚手架（`dotnet script init`），初始化一个VSCode的Debug环境
- 提供REPL环境：运行`dotnet script`调出REPL环境
- 提供系统级直接运行脚本的功能
  - Unix系：在开头加上 `#!/usr/bin/env dotnet-script` ，直接运行
  - Win：运行`dotnet script register`来向注册表写入CSX的处理方式
- 提供内置的Nuget包支持 `#r "nuget: PackageName, Version"`

它有很多分支（我也不是很懂，我只用第一个），详见下面这个表格，来自于官方仓库：[dotnet-script/dotnet-script: Run C# scripts from the .NET CLI. (github.com)](https://github.com/dotnet-script/dotnet-script)

| Name                                  | Version                                                      | Framework(s)                |
| ------------------------------------- | ------------------------------------------------------------ | --------------------------- |
| `dotnet-script` (global tool)         | [![Nuget](https://camo.githubusercontent.com/0872d8a82cf8f7b0fc99164c3ad7e0fa23ff191895fe04029fbff187b2cc4cd4/687474703a2f2f696d672e736869656c64732e696f2f6e756765742f762f646f746e65742d7363726970742e7376673f6d61784167653d3130383030)](https://www.nuget.org/packages/dotnet-script/) | `net6.0`, `net7.0`          |
| `Dotnet.Script` (CLI as Nuget)        | [![Nuget](https://camo.githubusercontent.com/5a31db9298f32c0f723ae7936e928bb98995fc9163b1c8fd18cc2be3cd96d43f/687474703a2f2f696d672e736869656c64732e696f2f6e756765742f762f646f746e65742e7363726970742e7376673f6d61784167653d3130383030)](https://www.nuget.org/packages/dotnet.script/) | `net6.0`, `net7.0`          |
| `Dotnet.Script.Core`                  | [![Nuget](https://camo.githubusercontent.com/b79194066652d5ee112ffade6e6d5e9b505a632f4a533120a2ca97372c882008/687474703a2f2f696d672e736869656c64732e696f2f6e756765742f762f446f746e65742e5363726970742e436f72652e7376673f6d61784167653d3130383030)](https://www.nuget.org/packages/Dotnet.Script.Core/) | `net6.0` , `netstandard2.0` |
| `Dotnet.Script.DependencyModel`       | [![Nuget](https://camo.githubusercontent.com/c59b67233016398ec0b24c2ff4b31b3e262f21f8a8809e767f6e8edfb9c92397/687474703a2f2f696d672e736869656c64732e696f2f6e756765742f762f446f746e65742e5363726970742e446570656e64656e63794d6f64656c2e7376673f6d61784167653d3130383030)](https://www.nuget.org/packages/Dotnet.Script.DependencyModel/) | `netstandard2.0`            |
| `Dotnet.Script.DependencyModel.Nuget` | [![Nuget](https://camo.githubusercontent.com/bb9b6c94315ec1c1321681c37a59d1950980c0ab6ef08f81db88aad8dba80d8b/687474703a2f2f696d672e736869656c64732e696f2f6e756765742f762f446f746e65742e5363726970742e446570656e64656e63794d6f64656c2e4e756765742e7376673f6d61784167653d3130383030)](https://www.nuget.org/packages/Dotnet.Script.DependencyModel.Nuget/) | `netstandard2.0`            |

如果有全局.NET 工具支持的话，可以只用.NET CLI输入`dotnet tool install -g dotnet-script`即可安装（要求.NET Core 2.1 以上）。

### scriptcs

这是 **CodeRunner** 内置的CSX运行命令环境实现，年代相比dotnet-script更久远一点，个人更推荐上一个。

官方仓库：[scriptcs/scriptcs: Write C# apps with a text editor, nuget and the power of Roslyn! (github.com)](https://github.com/scriptcs/scriptcs)

它也提供类似的功能：

- 脚本运行环境：`scriptcs xxx.csx`直接运行脚本
- 提供REPL环境
- 提供Nuget包支持，但是方式不如dotnet-script方便

安装是通过Chocolatey进行：`cinst scriptcs `，优势是直接顶层环境变量。

个人对比下来，scriptcs比dotnet-script要慢一点，功能更少，Nuget引入也没那么方便，最后一次更新也更早，个人更推荐**dotnet-script**一点。

# 传统项目作为环境

由于大部分刷题环境不支持CSX，这里还是用传统的CLI方法`dotnet new`搭配VSCode管理项目搭建刷题环境。

- 使用 `dotnet new console`创建一个新的控制台项目
  - 这样在新版本创建的是一个运用**顶层语句**和**隐式全局Using**的项目
  - 要创建老版本带类的项目可以使用 `--use-program-main` 参数
  - 消除隐式Using可以在项目配置中取消`ImplicitUsing`
- 使用`dotnet run`直接运行项目
- 在VSCode中使用C#插件配置`launch.json`和`tasks.json`可以实现单步调试