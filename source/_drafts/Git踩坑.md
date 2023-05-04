---
title: Git踩坑
tags:
---

fdsa你好

### 分支管理

> Git 分支实际上是**指向更改快照的指针**。

几乎每一种版本控制系统都以某种形式支持分支，一个分支代表一条独立的开发线。使用分支意味着你可以从开发主线上分离开来，然后在不影响主线的同时继续工作。

- 列出所有分支：`git branch`
  - 创建：`git branch <name>`
  - 删除：`git branch -d <name>`
- 切换分支：`git checkout <name>`
- 合并分支：`git merge <name>`（注意合并是将目标分支的Commit合并到当前分支）

### SSH-Key

