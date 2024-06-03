---
title: HTML 表单（form）相关知识
date: '2023/06/01 06:04:46'
alias:
  - post/Development/html-form/index.html
  - post/development/html-form/index.html
---

自己也做了一段时间前端了，最近做项目的时候才发现自己对**表单（form）元素**一无所知，当年写登录框都是两个`<input>`直接拼在一起的（笑）。今天就专门来学习一下表单相关的知识。

本篇将从最基础的表单知识（如定义和概念）等入手 ~~（毕竟之前也没系统了解过）~~ ，再理解表单的本质：我们为什么需要表单、如何设计表单、与POST之间的联系等，最后再了解*antd*中的表单元素`<a-form>`的使用与实践。

<!-- more -->

## 什么是表单

这是一个最基础的问题，就是表单（form）的定义到底是什么样的？（当然，这里只讨论最基本的HTML表单）

> **HTML 表单用于搜集不同类型的用户输入**。HTML 表单包含*表单元素*，表单元素指的是不同类型的 input 元素、复选框、单选按钮、提交按钮等等。
>
> ——W3CSchool

从上述定义来看，我们可以简单地将表单（form）理解为**浏览器内建的一种用户输入集合的数据结构**，浏览器内建的好处在于其通用性和性能优化（基于C++而非JS）。

表单标签`<form>`支持的元素有：

- `<input>`：最重要的表单元素有多种多样的类型
  - 常用的类型：text，password，checkbox，radio，file，button，submit
  - 不太常用的类型：hidden（隐藏的input），reset
  - 隐藏元素的作用：在表单中添加额外信息（如用户信息标识），且对用户不可见
- `<label>`：与input连用，`for`属性与input的`id`属性配合，示例如下：

```html
<form>
	<label for="“name”">姓名</label>
	<input id="name" name="name" type="text" />
</form>
```

- `<select>`：下拉选框，示例如下

```html
<form>
	<select name="city">
		<option value="0">北京</option>
		<option value="1">上海</option>
	</select>
</form>
```

- `<textarea>`：大段文本框（支持多行）

### 如何提交表单

我们有了收集信息的表单元素，要如何将信息提交给服务器呢？

- `submit` 按钮为我们在页面上提交了一个显式的提交入口，除此之外，其他默认方法（如Enter提交）也可以触发提交操作
- **通过`<form>`的`action`和`method`属性定义提交操作**

HTML 表单的提交行为有如下规则：

- **表单只会提交表单中有`name`属性的表单元素** （这一点非常重要）
- `action`虽然名字叫“行为”，但是它实际上**只接收URL** (绝对或相对) ，提交表单时会向这个URL发送HTTP请求（如我的博客中有一个表单，`action`值为`statistics.asp`，那么最终请求的URL就是`chlorinec.top/statistics.asp`）
  - 如果`action`属性被忽略，则**默认是当前页面**
- `method`属性对应了HTTP请求头中的方法
  - **默认情况下为GET方法，在Query中添加信息** （重要！）
    - 适用于简单表单、安全要求较低
    - 明文存储，容易泄露隐私
  - **更多情况下，应该使用POST方法**，它将表单信息存储在报文负载中而非Query Param中
    - 需要注意的是，**表单数据的格式默认并非是JSON格式的**，因此在后端解析表单数据需要使用专用的表单解析方法
    - 可以通过额外定义的方法，使原生表单传递JSON格式数据

默认的POST表单报文如下（示例来自MDN）

```
POST / HTTP/2.0
Host: foo.com
Content-Type: application/x-www-form-urlencoded
Content-Length: 13

say=Hi&to=Mom

```

### 如何验证表单

表单相比一个个单列的数据输入元素的优势就在于它提供了一种将数据组织起来的形式，这样一种（浏览器内建支持）聚合的数据结构可以为我们提供很多便利：

- 对很多操作进行预封装，如提交操作、清空操作，而不必再手写一个数据结构
- 遵守表单规范就可以**用于提交的数据集合格式使在不同网页间保持统一**
- 集合的形式为我们在更高层次的数据操作提供了便利，如**数据校验、数据组合**等（也可以预封装有关）

那么，为什么我们需要验证表单呢？这就要提到一句著名的原则了：后端永远不要相信前端传回的数据（前端亦然）。换句话说就是，**你在任何情况下拿到了源自非自己的数据时都应该校验格式**，你的后端同事如此，你的用户更应如此！~~因为你永远不知道你的顾客会不会在你的酒馆点一份炒饭然后拿起汤姆逊一顿突突把服务器打得稀巴烂。~~

对于数据校验（data validation），一般有两种方式：

- 客户端校验：在HTML中这发生在浏览器中，它可以**实时**地反馈用户的输入结果，通常发生在正式提交之前，有较好的用户体验
  - HTML校验：自定义性较差，但性能较好（由浏览器的C++代码实现）
  - JS校验：自定义程度高，一般用于复杂表单
- 服务端校验：需要在表单提交后才能得到校验结果，用户体验较差，通常只作为数据库清洁的**最后防线**（主战场仍在客户端）

#### HTML校验：校验属性

**校验属性**允许你对表单元素定义一些规则，除此之外你还可以设计一些**CSS伪类来自定义校验结果的反馈形式**。

- **CSS伪类：`:valid`和`:invalid`将分别定义校验通过和失败时表单元素的样式**
- `required` 属性：必填字段
- `pattern` 属性：基于**正则表达式**进行字符串匹配
- 限制输入的长度：`minlength`和`maxlength`

#### JS校验

> JS中直接通过DOM或者ref去读取表单元素的值进行校验（设置valid状态）是非常灵活的，这里就不再赘述。

JS和DOM提供了**一套用于校验的API**来反应校验结果到元素上，可以在绝大多数的**表单元素**中调用（`HTMLXXXElement`），**校验成功与否（invalid事件）仍会反映在伪类上**！

校验相关**方法**：

- `checkValidity()`方法会立刻进行一次校验，返回bool值，可能**触发`invalid`事件**
- `reportValidity()`方法会返回当前校验结果，并反映校验消息给用户
- `setCustomValidity(message)`方法为元素添加一个自定义的错误消息；如果设置了自定义错误消息，该元素被认为是无效的，则显示指定的错误。

校验相关**属性**：（懒得打字了，直接截图MDN了）

![image-20230531123546724](https://picgo-1308055782.cos.ap-chengdu.myqcloud.com/picgo-core/2023/05/20230531123548.png)

## 深入表单

### 为什么我们需要表单

其实如果从程序员角度出发，这个问题已经被我们回答了：**如果有一个已经造好了的轮子，它能满足我们的现有需求，还具有性能优势和兼容性优势，我们没有任何理由不去使用它而去再造一个自己的轮子** —— 这就是使用表单的最淳朴的理由。

但现在我们跳脱出程序员的框架，假设我们是一个产品经理或者说从用户的角度，我们再思考一下这个问题。

首先，需要明确一点的是，表单提交（或者说信息填写）对于用户来说是烦人的，这点从你每次填问卷星时的心情就能看出。那表单要如何改善这个填写体验呢？

答案仍是**内建功能**，像**自动补全、自动校验**等功能都是浏览器提供给表单的功能，如果你单列每个元素，再使用自己定义的数据结构进行集合和提交，就无法调用这些浏览器功能，这是表单独一无二的体验（与浏览器功能深度绑定），而不仅仅是免去了重复造轮子这么简单。

> 对于浏览器（底层实现）而言，表单为信息收集提供了统一的标准和接口，有助于其对该功能进行专门的优化和实现。
>
> 对于开发者而言，表单为信息收集提供了一套预定义的行为，简化了开发步骤。
>
> 对于用户而言，表单为信息填写优化了流程，自动填充等功能优化了用户体验。

### 如何设计表单

{% note info %}设计部分内容，待补充{% endnote %}

### 理解表单数据

HTTP中，提交数据的方式，最常用的就是GET和POST，这也对应着表单的两种提交方式。

- GET把参数编程键值对通过QueryString的方式放在URL尾部，如`example.com/api/user?id=123456&region=zh-cn`
- POST把数据以键值对的方式放在HTML报文的Payload中，但这个方式一定是键值对吗？其实不然。我们参考W3C文档发现提交表单会经历如下步骤：
  1. 进行表单校验，确定哪些控件值要被纳入（valid且有`name`属性，即所谓的successful controls）
  2. 构建**键值对**（control-name/current-value）的数据结构
  3. 根据指定的编码类型**对键值对进行编码**
  4. 提交编码后的值到`action`指定的url

从上面的步骤中我们可以清楚地看到，在第三步中我们可以修改编码类型，对应表单的`enctype`属性，而这个属性与HTTP请求头中的`Content-Type`字段相对应：

- `application/x-www-form-urlencoded`：**GET方法的默认编码，且不可修改**；POST也默认为此编码，但表达当时略有不同（直接写成键值对而非Query）
- `multipart/form-data`：一种分部二进制的编码方式，使用**表单上传文件**时必须使用此格式. 请求体被分割成多部分，每部分使用 --boundary分割
- `application/json`：JSON格式，但**老版本HTML原生表单并不支持这种格式，只有新版本的HTML才支持**，对于不支持的格式会Fallback到默认值
  - 根据键值对自动生成对象，并序列化为JSON
  - **当表单存在多个重名的表单域时，按JSON数组编码**
  - **当表单控件名（`name`属性）出现了复杂结构，如嵌套对象（`obj[key]`）或数组（`arr[0]`）这样的结构时，会自动生成对应对象**，其中缺失的数组序号会用`null`替代
  - JSON还可以用于**文件上传**

一个使用JSON的表单例子如下：

```html
<form enctype="application/json">
	<input name="pet[0][species]" value="Dahut" />
	<input name="pet[0][name]" value="Hypatia" />
	<input name="pet[1][species]" value="Felis Stultus" />
	<input name="pet[1][name]" value="Billie" />
</form>
```

其生成的JSON如下：

```json
{
	"pet": [
		{
			"species": "Dahut",
			"name": "Hypatia"
		},
		{
			"species": "Felis Stultus",
			"name": "Billie"
		}
	]
}
```

## 组件库中的表单

这里以**Antd1.x+Vue2**为背景介绍组件库中的表单概念，与HTML表单的区别与共性，以及具体使用方法。不同的组件库的表单设计思路可能略有不同（如mui和antd），不同框架对表单的操作模式也不同，但总体设计思路都是大同小异的。

> antd中的表单和表单项都使用antd的`Grid`布局（24等分的flex布局）。

- 在使用表单时需要用`this.form = this.$form.createForm(this, [options])`进行绑定（或者说包装）
  - 经 `Form.create()` 包装过的组件会自带 `this.form` 属性，即可以**直接在组件的`this`中获取表单的属性和方法**
  - `getFieldsXXX(args)` 方法可以获取表单中控件的值，args用于指定控件，留空则获取所有
  - 使用`this.form.validateFields(values, err)`进行表单校验并获取表单值
- **使用`v-decorator`指令进行表单绑定而不是`name`属性**

## 参考资料

- [HTML 表单 (w3school.com.cn)](https://www.w3school.com.cn/html/html_forms.asp)
- [发送表单数据 - 学习 Web 开发 | MDN (mozilla.org)](https://developer.mozilla.org/zh-CN/docs/Learn/Forms/Sending_and_retrieving_form_data)
- [表单数据校验 - 学习 Web 开发 | MDN (mozilla.org)](https://developer.mozilla.org/zh-CN/docs/Learn/Forms/Form_validation)
- [四种常见的 POST 提交数据方式 | JerryQu 的小站 (imququ.com)](https://imququ.com/post/four-ways-to-post-data-in-http.html)
- [JSON编码格式提交表单数据详解 – WEB骇客 (webhek.com)](https://www.webhek.com/post/html-json-form-submission/)
- [深入理解POST的本质\_51CTO博客\_get post本质区别](https://blog.51cto.com/cnn237111/1113546)
- [表单设计：掌握表单设计方法（表单体验篇） | 人人都是产品经理 (woshipm.com)](https://www.woshipm.com/pd/4332910.html)
- [B端页面——详细表单设计流程 | 人人都是产品经理 (woshipm.com)](https://www.woshipm.com/pd/4369965.html)
