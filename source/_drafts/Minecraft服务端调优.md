## Forge模组服

### 优化MOD

#### 零配置（开箱即用）

- [PassivePregen](https://modrinth.com/mod/passivepregen)：自动加载玩家周围区块
- [Fastload](https://modrinth.com/mod/fastload)：更改地图加载逻辑，加快速度
- [Canary](https://modrinth.com/mod/canary)：知名元素周期表中`Lithium`的Forge版本，提供全局的MC优化
- [Pluto](https://modrinth.com/mod/pluto)：网络优化MOD，`Krypton`（一个不那么知名的元素周期表）的Forge版本
- [Starlight (Forge)](https://modrinth.com/mod/starlight-forge)：知名的光照管线优化MOD
- [FerriteCore](https://github.com/malte0811/FerriteCore)：知名高版本内存优化MOD
- [Memory Leak Fix](https://modrinth.com/mod/memoryleakfix)：搭配`FerriteCore`使用的内存优化
- [Does Potato Tick?](https://www.mcmod.cn/class/9249.html)：距离玩家较远的实体不再Tick
- [Limited Chunkloading](https://www.mcmod.cn/class/9490.html)：玩家下线后他设置的常加载区块不再加载
- [Smooth Chunk Save](https://www.mcmod.cn/class/6170.html)：平滑区块保存，而不是每隔x秒统一保存

#### 需要配置



- [Lag Removal](https://www.mcmod.cn/class/4081.html)：自动实体清理
- [Adaptive Performance Tweaks](https://www.mcmod.cn/class/4734.html)：自适应性能优化套件，注意**需要安装它的一系列子模块作为依赖**
- [spark](https://www.curseforge.com/minecraft/mc-mods/spark)：不可或缺的性能分析工具
- 

```shell
java -Xms6G -Xmx6G -XX:+UseG1GC -XX:+UnlockExperimentalVMOptions -XX:MaxGCPauseMillis=100 -XX:+DisableExplicitGC -XX:TargetSurvivorRatio=90 -XX:G1NewSizePercent=50 -XX:G1MaxNewSizePercent=80 -XX:G1MixedGCLiveThresholdPercent=35 -XX:+AlwaysPreTouch -XX:+ParallelRefProcEnabled -Dusing.aikars.flags=mcflags.emc.gs -jar paperclip.jar
```

