---
title: 从零开始 Hadoop 虚拟机伪集群环境教程
abbrlink: 1679475366
date: 2022-01-25 00:00:00
---



# 序言

**本教程直接面向华中科技大学计算机专业大数据导论课程结业项目，是基础向教程，不涉及进阶应用**

经过一学期的大数据导论学习后，我们突然接到了结业大作业——进行一次大数据分析项目的通知。

刚刚学习了一些大纲类型的知识的我们自然是不知所措的，经过资料查阅后我们决定通过**虚拟机搭建Hadoop集群进行伪分布式计算完成该项目**~~，然后就开始了安装了20次虚拟机的折磨之路。~~

由于我本人非常反感由于某些原因（如网络教程版本，库名修改等）去在仅使用基础功能的项目中强行使用老版本的，一个正常软件的正常迭代一定是不会删除功能的，一定会有更好的实现方法来替代。只要思想不滑坡，办法总比困难多，这也是本文诞生的初衷之一，遇到问题就要去解决问题，而不是盲目地退回老版本。

本博客同时也作为 [视频教程](待定) 的台本方便各位查阅，对Linux基础操作不熟悉的同学可以对着视频一步步操作，对应代码可以直接复制博客中代码。

## 搭建环境

- CentOS v7.9.2009
- jdk-8u202-linux-x64（1.8.202）
- Hadoop-v3.3.1
- VMWare Workstation Player 16

## 推荐下载地址

- CentOS 下载地址：THU镜像站（亲测可以满速）
  - [下载列表 7.9.2009](https://mirrors.tuna.tsinghua.edu.cn/centos/7.9.2009/isos/x86_64/)
    - 选择如图所示选项，也可以直接点击下方下载链接（一样的）![image-20211118211934439](https://gitee.com/KiritoKing/blog-images/raw/master/img/image-20211118211934439.png)
  - [完整包下载地址 7.9.2009](https://mirrors.tuna.tsinghua.edu.cn/centos/7.9.2009/isos/x86_64/CentOS-7-x86_64-DVD-2009.iso)
- jdk 下载地址
  - Oracle 官方（需要网络环境+注册登录账号）
    - 注意选择 Linux x64 Compressed Archive![image-20220125145331983](https://gitee.com/KiritoKing/blog-images/raw/master/image-20220125145331983.png)
    - [Java Archive Downloads - Java SE 8u211 and later (oracle.com)](https://www.oracle.com/java/technologies/javase/javase8u211-later-archive-downloads.html)
    - [jdk17 Downloads | Oracle](https://www.oracle.com/java/technologies/downloads/)
  - 阿里网盘：分享已被删除
- Hadoop 下载地址（THU镜像）：[hadoop-v3.3.1](https://mirrors.tuna.tsinghua.edu.cn/apache/hadoop/common/hadoop-3.3.1/hadoop-3.3.1.tar.gz)
- VMWare Player 下载地址（官方）：[VMware Workstation Player - VMware Customer Connect](https://customerconnect.vmware.com/en/downloads/info/slug/desktop_end_user_computing/vmware_workstation_player/16_0)

## 搭建目标

搭建一个1主机+2从机的Hadoop伪分布式集群（因为并没有真正利用到分布式的特性，只是采用了分布式的形式所以叫伪分布式），并进行简单的wordcount示例计算



---

# Hadoop 安装与配置

## Ⅰ 系统安装与基础配置

- 虚拟机环境：VMWare Workstation 16 Player

  - 选择该软件的原因有
    - 普适性强：网络上有很多相关资料可供查阅
    - 免费：支持正版！苦逼大学生自然是用不起企业级的Pro版本的~~（如果家境优渥可以考虑一下）另外希望学校可以把Workstation Pro也纳入正版平台~~
    - 如果有方法可以用Pro版，更加稳定（有虚拟网络编辑器）
  - **没有虚拟网络编辑器，DHCP动态分配可能导致后续网段不稳定**

- 系统选择：CentOS 7 64-bit

  - CentOS，大家的选择！稳定又轻量！而且还免费！
  - 安装的时候可以选择最小安装，毕竟安一个桌面没啥用还费资源

  ### 安装步骤

  #### 虚拟机创建与系统安装

  **VMWare Player的下载与安装不会的建议自行百度**

  1. 在Player中选择新建一个虚拟机<img src="https://gitee.com/KiritoKing/blog-images/raw/master/image-20220125151247755.png" alt="image-20220125151247755" style="zoom:80%;" />
  2. 在弹出窗口中选择 稍后安装（如果此时选择直接安装会默认安装桌面GUI，会占用大量资源且没有作用~~当然如果你电脑强到可以随便霍霍当我没说~~）![image-20220125151343588](https://gitee.com/KiritoKing/blog-images/raw/master/image-20220125151343588.png)
  3. 一直下一步直到这一步，名称和位置都自己选一下![image-20220125151613126](https://gitee.com/KiritoKing/blog-images/raw/master/image-20220125151613126.png)
  4. 然后一直下一步到完成即可
  5. 在这个界面双击打开虚拟机![image-20220125151804649](https://gitee.com/KiritoKing/blog-images/raw/master/image-20220125151804649.png)
  6. 进入虚拟机后会弹出一个是否连接的对话框，选择是
  7. 进入页面后选择如下选项![image-20220125151910390](https://gitee.com/KiritoKing/blog-images/raw/master/image-20220125151910390.png)
  8. 在弹出窗口中选择 **使用ISO映像** 并选择下载的镜像，并勾选 **已连接**![image-20220125152107128](https://gitee.com/KiritoKing/blog-images/raw/master/image-20220125152107128.png)
  9. 确定后通过如下方式重启虚拟机，等待进入安装界面![](https://gitee.com/KiritoKing/blog-images/raw/master/image-20220125152152847.png)
  10. 首先选择语言![image-20220125152349280](https://gitee.com/KiritoKing/blog-images/raw/master/image-20220125152349280.png)
  11. 继续后依次配置需要配置的三项![image-20220125152816041](https://gitee.com/KiritoKing/blog-images/raw/master/image-20220125152816041.png)
      - 网络配置![image-20220125152456308](C:/Users/kirito/AppData/Roaming/Typora/typora-user-images/image-20220125152456308.png)
      - 软件选择![image-20220125152837008](https://gitee.com/KiritoKing/blog-images/raw/master/image-20220125152837008.png)
      - 安装位置：点进去等一下会自己完成![image-20220125152856153](https://gitee.com/KiritoKing/blog-images/raw/master/image-20220125152856153.png)
  12. 安装过程中需要自己创建Root密码（双击进去自己设置）![image-20220125153010053](https://gitee.com/KiritoKing/blog-images/raw/master/image-20220125153010053.png)
  13. 等待安装完成后点击界面中的重启进入系统![image-20220125153336841](https://gitee.com/KiritoKing/blog-images/raw/master/image-20220125153336841.png)
  14. 出现以下界面说明安装成功**（注意Linux系统输入密码没有占位符，看不到输入了多少位，且在虚拟机中不要使用小键盘输入）**![image-20220125153409080](https://gitee.com/KiritoKing/blog-images/raw/master/image-20220125153409080.png)

  #### 系统基础配置

  ##### 安装远程Shell工具：XShell【可选】

  - 直接百度搜索安装即可
  - 以下操作都可以在虚拟机中直接完成，但是在Shell中操作和输入更方便（可以粘贴代码）

  

  1. 登入系统（用户名为root），安装ifconfig包并查询IP，执行以下指令

  ``` shell
  # 搜索名为ifconfig的包
  yum search ifconfig
  # 安装查询到的包 -y表示全部同意
  yum install net-tools.x86_64 -y
  # 查询指令
  ifconfig
  # 检验网络是否连通
  ping www.baidu.com
  ```

  - 安装界面![](https://gitee.com/KiritoKing/blog-images/raw/master/image-20220125154032692.png)

  - 查询界面

    - 记下ens33中的inet项，它表示了内网IP地址，后面多处使用到它

    ![image-20220125154109867](https://gitee.com/KiritoKing/blog-images/raw/master/image-20220125154109867.png)

  2. 连接XShell![image-20220125154505293](https://gitee.com/KiritoKing/blog-images/raw/master/image-20220125154505293.png)
     1. 点击左上角新建，随便起一个名字，在主机一栏中填**你查询到的IP地址**![image-20220125154725076](https://gitee.com/KiritoKing/blog-images/raw/master/image-20220125154725076.png)
     2. 选择用户身份验证，用户名root，密码写你自己注册的密码![image-20220125154612249](https://gitee.com/KiritoKing/blog-images/raw/master/image-20220125154612249.png)
     3. 弹出窗口中选择接受并保存![image-20220125154839909](https://gitee.com/KiritoKing/blog-images/raw/master/image-20220125154839909.png)
     4. 出现以下画面说明登录成功![image-20220125154906789](https://gitee.com/KiritoKing/blog-images/raw/master/image-20220125154906789.png)



---



## Ⅱ 配置Linux系统（主机和从机都要进行相同配置）

1. 关闭防火墙：防火墙会阻止结点之间的连接

   ```shell
   systemctl stop firewalld
   systemctl disable firewalld
   ```

   ![image-20211113165510665](https://gitee.com/KiritoKing/blog-images/raw/master/image-20211113165510665.png)

   出现以上界面说明配置成功

2. 设置主机名并重启（也可以所有都配置完了再重启）

``` 
hostnamectl set-hostname NAME #此处NAME自己取
```

3. 修改hosts：方便通过主机名登录，避免每次都敲IP

   - 调用编辑器：`vi /etc/hosts`

   - 进入编辑器后按i键，下方的提示会变为 -编辑模式-

   - 通过方向键进行移动，除了不能使用数字小键盘和鼠标操作和其他文本编辑器相同

   - 在hosts中应录入你所有虚拟机结点的IP和你取的名字（名字尽量和设置的主机名相同）

   - 录入完后按ESC，然后输入:wq（可以自行百度了解更多vim命令）

   - 后期你也可以在一台主机上配置完hosts后通过scp复制到其他主机上

   - 定义完成后可以通过相同的ping主机名方法检查是否设置成功和连通

     <img src="https://gitee.com/KiritoKing/blog-images/raw/master/img/image-20211113170300589.png" alt="image-20211113170300589" style="zoom:80%;" />

4. 配置ssh登录

```shell
# 在本机生成密钥和公钥，一路回车即可
ssh-keygen -b 1024 -t rsa
# HOST-NAME是你在hosts中定义的主机名，也可以直接输入IP
ssh-copy-id HOST-NAME
```

- copy-id命令需要根据提示输入root密码

- 在本机copy-id将本机公钥发送给目标机器，表示可以从本机免密登录目标机器

- 根据需要我们只需要配置主机到每个从机、自身到自身的免密登录即可

  ![image-20211113170925513](https://gitee.com/KiritoKing/blog-images/raw/master/image-20211113170925513.png)

5. 设置密钥访问权限 `chmod 600 /root/.ssh/authorized_keys #可以自己百度chmod命令说明` 

---

## Ⅲ Hadoop 环境配置（只用在主机配置，从机复制即可）

### Java 配置

1. 安装rz包：方便从宿主机传文件到虚拟机，也可以通过FTP软件实现~~但我感觉rz会快一点~~

   - 命令

   ```shell
   # 安装命令
   yum install lrzsz.x86_64 -y
   # 调用命令
   rz #上传文件到当前目录
   sz FILE-NAME #下载这个文件到宿主机
   ```

   - 注意：不要使用rz上传除了单文件外的任何文件（包括文件夹和多个文件），这可能导致文件系统错乱~~被这样搞坏了好多个虚拟机呜呜~~
   - 如果你改了名字没有重启一定要重启来再用rz，会报错的！

2. 上传本地jdk包和hadoop包到虚拟机

3. 使用tar命令解压两个包 `tar -xzvf FILE.tar.gz`

4. 配置环境变量：免得后面再改一次就放在hadoop部分一起配置了

### Hadoop 配置

1. 进入配置文件夹 `cd /root/hadoop-3.3.1/etc/hadoop #这里hadoop-3.3.1是你自己的文件夹的名字`
2. 挨个用vim修改配置文件 `yum install vim-enhanced.x86_64 -y #这里推荐装一个vim包会舒服一点`

```xml
// 以下是需要修改的配置文件

// core-site.xml
<property>
	<name>fs.defaultFS</name>
	<value>hdfs://master:9000</value>
</property>
<property>
	<name>hadoop.tmp.dir</name>
	<value>/root/hdtmp</value>
</property>

// hdfs-site.xml
<property>
	<name>dfs.replication</name>
    <value>2</value>
</property>
// 以下不是必须配置
<property>
	<name>dfs.namenode.rpc-address</name>
	<value>master:9000</value>
</property>
<property>
	<name>dfs.namenode.name.dir</name>
	<value>/root/hdtmp/name</value>
</property>
<property>
	<name>dfs.datanode.data.dir</name>
    <value>/root/hdtmp/data</value>
</property>
        
// mapred-site.xml
<property>
	<name>mapreduce.framework.name</name>
	<value>yarn</value>
</property>

// yarn-site.xml
<property>
	<name>yarn.resourcemanager.hostname</name>
	<value>master</value>
</property>
<property>
	<name>yarn.nodemanager.aux-services</name>
	<value>mapreduce_shuffle</value>
</property>
```

3. 修改启动脚本

   - hadoop-3.3.1/etc/hadoop/hadoop-env.sh

     - 找到JAVA_HOME这个选项（默认是被注释的）
     - 修改为你解压的JAVA的**绝对路径**（偷懒用环境变量可能会报错）<img src="https://gitee.com/KiritoKing/blog-images/raw/master/image-20211113173312105.png" alt="image-20211113173312105" style="zoom:80%;" />

   - hadoop-3.3.1/sbin

     - start-dfs.sh & stop-dfs.sh 开头添加以下语句

     ```
     HDFS_DATANODE_USER=root
     HADOOP_SECURE_DN_USER=hdfs
     HDFS_NAMENODE_USER=root
     HDFS_SECONDARYNAMENODE_USER=root
     ```

     - start-yarn.sh & stop-yarn.sh 开头添加以下语句

     ```
     YARN_RESOURCEMANAGER_USER=root
     HADOOP_SECURE_DN_USER=yarn
     YARN_NODEMANAGER_USER=root
     ```

4. 修改etc/hadoop/workers文件（hadoop2.x版本为slaves 3.x版本为workers）

   - 先删除自带的localhost
   - 添加你**所有的主机名**到其中（hosts中定义的）
   - 若未定义hosts也可以输入直接输入从机IP

5. 修改环境变量

   - 进入环境变量文件 `vim /root/.bash_profile`
   - 添加以下配置（根据自己的目录进行修改命令）

   ```
   export JAVA_HOME=/root/jdk1.8.0_202
   export HADOOP_HOME=/root/hadoop-3.3.1
   export PATH=$HADOOP_HOME/bin:$HADOOP_HOME/sbin:$JAVA_HOME/bin:$PATH
   ```

   - 刷新环境变量 `source /root/.bash_profile` 

6. 创建临时文件目录：与core-site.xml中的hadoop.tmp.dir指定的目录一致

   - 创建目录的命令 `mkdir dirname`

7. 重新启动虚拟机后主机配置就完成了

8. 复制配置环境到从机

   - 复制命令 `scp -r FILE root@HOST-NAME: DIR`
     - 可以直接复制整个文件夹
     - 配置了ssh免密登录后不需要输入密码
   - 需要复制的文件
     - jdk 目录：必须
     - hadoop 目录：必须
     - .bash_profile：不复制可以自己设定
     - hosts：不复制可以自己设定（但是需要确保囊括了所有主机）



---



# Hadoop实战演练

## 启动Hadoop集群

1. 测试Hadoop安装情况：分别输入hadoop，java，若没有出现无法识别说明配置成功

2. 格式化Hadoop `hadoop namenode -format`

   - **只能在你指定的主机进行格式化**（通常命名为master），格式化后该节点称为namenode，负责任务的分配
   - **切记只能格式化一次**，如果不清空临时文件就再次格式化会导致clusterID不相同，dataNode和nameNode无法连接的情况
   - 如果要重置集群（重新格式化），需要删除每个节点hadoop目录下的log文件夹和指定的hdtmp文件夹

3. 启动Hadoop集群

   - 启动集群 `start-all.sh`![image-20211113175801543](https://gitee.com/KiritoKing/blog-images/raw/master/image-20211113175801543.png)

   - 检查机器启动情况 `jps`

     - 主机

     ![image-20211113175819853](https://gitee.com/KiritoKing/blog-images/raw/master/image-20211113175819853.png)

     - 从机

       <img src="https://gitee.com/KiritoKing/blog-images/raw/master/image-20211113175923255.png" alt="image-20211113175923255" style="zoom:150%;" />

   - 如果jps结果与上图一致表示集群启动成功，可以运行算例

## 运行PI算例

hadoop内置了很多测试算例，存放在share/hadoop/mapreduce/hadoop-mapreduce-examples-3.3.1.jar 中

- 调用jar包命令 `yarn jar XXX`
  - 开头的命令yarn表示集群模式，hadoop表示单机模式，一般就用yarn
  - jar表示执行后面路径的jar文件
- 调用PI算例 `yarn jar /root/hadoop-3.3.1/share/hadoop/mapreduce/hadoop-mapreduce-examples-3.3.1.jar pi 10 10`
  - pi表示指定上面那么多算例中的pi算例
  - 10 10表示计算精度

如果出现下图结果表示集群正式搭建成功

![image-20211113180744318](https://gitee.com/KiritoKing/blog-images/raw/master/image-20211113180744318.png)

## 试用HDFS和WordCount算例

### 我对HDFS的理解

- HDFS是Hadoop的文件格式，和yarn的资源分配一同提供了一个多节点的集群化计算平台，说人话就是hadoop用hdfs（文件管理系统）和yarn（资源分配系统）将很多个计算机虚拟成了一个计算机来方便运算
- 刚刚我们的pi算例调用了yarn进程，利用mapreduce将一个运算任务分配给了所有结点（map）最后统合起来（reduce）【严格地来说yarn的工作原理不是简单的分配任务】，但是没有调用hdfs（至少看起来没有），所以现在我们的wordcount示例就用hdfs试一试
- **wordcount使用的文件必须来自hdfs**
- 理解了wordcount的示例就掌握了hadoop程序的基础写法

### HDFS操作命令

```shell
# 在对应路径创建目录
hdfs dfs -mkdir DIR

# 读取对应路径的文件
hdfs dfs -cat DIR

# 列举对应目录的文件
hdfs dfs -ls DIR

# 上传文件到对应目录
hdfs dfs -put FILE DIR

# 下载对应目录的文件到本地目录
hdfs dfs -get DIR
```

### 试运行Wordcount

```shell
hdfs dfs -mkdir wctest
hdfs dfs -put test wctest # test是你自己的文本文件
#wctest/test.output是输出的目录
yarn jar /root/hadoop-3.3.1/share/hadoop/mapreduce/hadoop-mapreduce-examples-3.3.1.jar wordcount wctest/test wctest/test.output 
```

- 运行结果：运行完毕后在test.output会生成如下文件![image-20211113182429289](https://gitee.com/KiritoKing/blog-images/raw/master/image-20211113182429289.png)
  - _SUCCESS是空文件，表示运算成功
  - part-r-00000是运行结果的文件，可以使用`hdfs dfs -cat`访问![image-20211113182617248](https://gitee.com/KiritoKing/blog-images/raw/master/image-20211113182617248.png)