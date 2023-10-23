---
title: WebSocket 应用研究
heroImage: '../../../assets/images/covers/web-socket.png'
tags:
  - websocket
pubDate: 2023-07-09T00:00:00.000Z
description: >-
  WebSocket 是基于 TCP 的一种新的应用层网络协议。它实现了浏览器与服务器全双工通信，即允许服务器主动发送信息给客户端。因此，在
  WebSocket 中，浏览器和服务器只需要完成一次握手，两者之间就直接可以创建持久性的连接，并进行双向数据传输，客户端和服务器之间的数据交换变得更加简单。
slug: '2808426581'
category: 前端
---

## 了解WebSocket协议

在 WebSocket 出现之前，如果我们想实现实时通信，比较常采用的方式是 Ajax 轮询，即在特定时间间隔（比如每秒）由浏览器发出请求，服务器返回最新的数据。这样做的问题有：

- HTTP头部重复信息较多，有效载荷少
- 服务器**被动**接收浏览器的请求然后响应，数据没有更新时仍然要接收并处理请求，导致服务器 CPU 占用

WebSocket协议的出现解决了上述问题：

- WebSocket建立连接后不再发送HTTP头，WebSocket 的头部信息少，通常只有 2Bytes 左右，能节省带宽
- WebSocket 支持服务端主动推送消息，更好地支持实时通信

由于上述特点，WS广泛应用于**视频弹幕、在线聊天、音视频通话、实时定位**等场景。

> 🌟WebSocket已经成为HTML5标准之一，被目前所有主流浏览器支持，内部提供`WebSocket()` API

### 通信原理解析

> WebSocket 是基于 TCP 的一种新的应用层网络协议。它实现了浏览器与服务器全双工通信，即允许服务器主动发送信息给客户端。因此，在 WebSocket 中，浏览器和服务器只需要完成一次握手，两者之间就直接可以创建持久性的连接，并进行双向数据传输，客户端和服务器之间的数据交换变得更加简单。

WebSocket的特点如下：

- 握手时使用**HTTP协议请求协议升级**，握手成功后使用**TCP**直接通信
- **独立**的应用层协议，**端口**默认复用**HTTP的80（ws）**和**HTTPS的443（wss）**
- **全双工**通信，双方都可以主动向对方推送信息

![WS对比HTTP](https://picgo-1308055782.cos.ap-chengdu.myqcloud.com/picgo-core/2023/07/20230709002811.png 'WS对比HTTP')

#### 建立连接

直接向WS服务器发送请求切换协议的报文（默认就是HTTP的端口，也可以指定端口）

![](https://picgo-1308055782.cos.ap-chengdu.myqcloud.com/picgo-core/2023/07/20230709002816.png)

- 客户端请求包含`Connection: Upgrade` 表示要升级协议，以及`Upgrade: websocket`字段说明要切换到WS协议，以上报文创建工作由浏览器中的`WebSocket` 功能完成
- 服务器返回状态码101表示协议切换完成，可以进行全双工通信，在上方的“消息”可以查看

![](https://picgo-1308055782.cos.ap-chengdu.myqcloud.com/picgo-core/2023/07/20230709002824.png)

#### 数据交换

> 🚦需要注意的是，这些工作在实际使用时**由服务端和浏览器自动完成，使用者不需要关心**。

WebSocket协议使用自己的帧（frame）结构传递信息，**一条WS消息可能被分成若干WS帧进行发送，在接收端重新组装**。

WS帧结构如下图所示：

![](https://picgo-1308055782.cos.ap-chengdu.myqcloud.com/picgo-core/2023/07/20230709002931.png)

WS报文头和HTTP不同，不包括繁杂的Header信息，只包含基础的三项：

- `FIN` 表示当前帧是否是当前消息的最后帧
- `opcode` 操作码，表示当前请求的类型
  - 0x0，表示该帧是一个**延续帧**（这意味着服务器应该将帧的数据连接到从该客户端接收到的最后一个帧）；
  - 0x1，传输数据是文本；
  - 0x2，传输数据是二进制数据；
  - 0x3-7：保留的操作代码，用于后续定义的非控制帧；
  - 0x8：表示连接断开；
  - 0x9：表示这是一个心跳请求（ping）；
  - 0xA：表示这是一个心跳响应（pong）；
  - 0xB-F：保留的操作代码，用于后续定义的控制帧；
- `len` 表示载荷的长度

#### 维持连接：心跳机制

由于WebSocket是全双工、保持连接的机制，我们需要通过一定手段来确定连接正常没有断开或者服务是否可用，这就是**心跳机制**。

可以看见，上面的操作码中定义了用于心跳请求和响应的位，可以通过**定时发送**对应数据包来确定让对方知道自己在线且正常工作，确保通信有效。如果对方无法响应，便可以弃用旧连接，发起新的连接了。

在JS中我们可以简单地用`setInterval()` 创建定时器发送消息即可。

### Node.js 实践

通过用Node.js原生的`ws` 库实现一个基础的WebSocket聊天室，理解WebSocket在实际使用过程中的调用流程和抽象模型。

#### 创建服务端

首先初始化一个项目，这里使用 `pnpm init` ，并安装依赖 `pnpm add ws`。

> 这里基于个人爱好，我在`package.json` 中写入了 `"type": "module"` 以启用ESM，如果你习惯使用CJS请留意代码中的导入部分。

在写代码之前，我们先阅读ws的[文档](https://github.com/websockets/ws/blob/HEAD/doc/ws.md '文档')和处理流程：

> 🌟服务端使用 `WebSocketServer` 创建一个服务端实例，对于每个连接创建一个 `WebSocket` 实例，一个`WebSocketServer` 实例管理多个`WebSocket` 实例。`WebSocketServer`通过`connection` 事件与`WebSocket` 实例连接，每个`WebSocket` 实例对应实际的WS连接。

- 整个处理流程**基于事件驱动**，即**在`connection`事件中获取当前连接的\*\***`WebSocket`\***\* 实例并给它绑定对应的事件处理器**
  - `connection` ：连接事件，一切操作的起点，**只有它绑定在Server上**
    - `socket` 参数可以获得当前连接的WebSocket实例
    - `request` 参数可以获得当前连接请求的所有HTTP报文信息，如Origin、Cookie等
  - `message` ：接收到某个Socket传来的消息的事件，参数为`data` ，即消息的载荷，可以是文本、Buffer或二进制
  - `close` ：服务关闭事件，**由于WebSocket是全双工协议，在服务正式关闭时（任何一方**\*\*`close()`）双方都会收到关闭报文和对应事件\*\*​
- `WebSocketServer` 实例可以**管理所有连接的Sockets**（默认可以多连接），使用`clients` 属性获取与当前服务器连接的所有`WebSocket`实例 **（可以用来实现广播）**
- `WebSocket` 实例对应了一个WebSocket连接，常用的API如下：
  - `Event` 接口：一般包含了`type`, `data`, `target` 等属性可以调用
    - `type` ：事件属性，如message, close, connection等
    - `data`：有效载荷
    - `target`：一般对应`WebSocket`实例
  - `url` 属性：目标WS服务器地址
  - `send(data, [options], [callback])` 方法：向**对方**发送信息（服务端也可以调用）
  - `close([ErrorCode], [data])` 方法：关闭连接

创建一个**基础服务端**和一个**用于测试的客户端**，代码如下：

```javascript
// server.js
import { WebSocketServer, WebSocket } from 'ws'

const server = new WebSocketServer({ port: 4567 })

function broadcast(msg, user, source) {
	server.clients.forEach((client) => {
		if (client.readyState === WebSocket.OPEN && client !== source) {
			client.send(`[${user}] ${msg}`)
		}
	})
}

server.on('connection', (socket, req) => {
	const user = req.headers.origin
	console.log(`[Server] connected: ${user}`)
	socket.on('message', (msg) => {
		console.log(`From ${user}: ${msg}`)
		socket.send(`[Echo] You sent -> ${msg}`)
		broadcast(msg, user, socket)
		if (msg === 'bye') {
			socket.close(0, 'Bye')
		}
	})
	socket.on('close', (code, reason) => {
		console.log(`[Server] Connection closed with code: ${code} for ${reason}`)
	})
})

console.log('WebSocket Server started at port 4567...')

// client.js
import { WebSocket } from 'ws'

const socket = new WebSocket('ws://localhost:4567', {
	origin: (Math.random() * 10).toFixed(0).toString()
})

socket.addEventListener('open', (e) => {
	console.log(`Connected to server: ${e.target.url}`)
	socket.send('Hello Server from NodeJS Client!')
})

socket.addEventListener('message', (e) => {
	// e.type=事件类型，open|message|close
	console.log(e.data)
})

socket.addEventListener('close', (e) => {
	console.log(`Type=${e.type}\nCode=${e.code}\nReason=${e.reason}`)
})

let count = 0

setInterval(() => {
	socket.send(count++)
}, 1000)
```

可以看到，在上面的代码中我们利用`clients` 属性手写实现了**广播**功能，所谓WS“不提供”的功能，这里我们能窥见一点WebSocket的本质属性——它只是一种服务协议，提供了一种全双工的沟通方式，而上层的调用和实现、需要什么功能则完全由开发者决定，就像HTTP一样是一种“基础设施”。

运行效果如下：

![](https://picgo-1308055782.cos.ap-chengdu.myqcloud.com/picgo-core/2023/07/20230709002940.png)

#### 创建前端页面

首先使用`pnpm create vite` 创建一个SPW应用，这里使用React+Typescript+SWC的方案，你也可以根据自己的喜好选择。然后按照流程`pnpm install` 安装依赖、`pnpm run dev`启动开发服务器。

##### 手写WebSocket

我们使用上面写的服务端作为WebSocket服务器，改写`./src/App.tsx`，代码如下：

```tsx
import { useEffect, useMemo, useRef, useState } from 'react'
import './App.css'

function App() {
	const ws = useRef<WebSocket | null>(null)
	const [connected, setConnected] = useState<boolean>(false)
	const [host, setHost] = useState<string>('localhost:4567')
	const [send, setSend] = useState<string>('')
	const [messages, setMessages] = useState<
		{
			category: 'message' | 'error' | 'info'
			message: string
		}[]
	>([])

	const handleConnect = () => {
		if (ws.current && ws.current.readyState === WebSocket.OPEN) {
			messages.push({ category: 'info', message: 'Already connected!' })
			return
		}
		ws.current = new WebSocket('ws://' + host)
		ws.current.addEventListener('open', () => {
			messages.push({ category: 'info', message: 'Connected to ' + ws.current!.url })
			setMessages([...messages])
			setConnected(true)
		})
		ws.current.addEventListener('message', (event) => {
			messages.push({ category: 'message', message: event.data as string })
			setMessages([...messages])
		})
		ws.current.addEventListener('close', () => {
			messages.push({ category: 'info', message: 'Disconnected from ' + ws.current!.url })
			setMessages([...messages])
		})
		ws.current.addEventListener('error', () => {
			messages.push({ category: 'error', message: 'Error Connection' })
			setMessages([...messages])
		})
	}

	const handleDisconnect = () => {
		if (ws.current && ws.current.readyState === WebSocket.OPEN) {
			ws.current.close()
			setMessages([])
			setConnected(false)
		}
	}

	const handleSendMessage = () => {
		if (ws.current && ws.current.readyState === WebSocket.OPEN) {
			ws.current.send(send)
		}
	}

	const texts = useMemo(() => {
		return messages.map(({ category, message }, index) => {
			return (
				<div className={category} key={index}>
					{`[${category.toUpperCase()}] ${message}`}
				</div>
			)
		})
	}, [messages])

	useEffect(() => {
		return () => {
			handleDisconnect()
		}
	}, [])

	return (
		<div>
			<div className='flex-container'>
				<input value={host} onChange={(e) => setHost(e.target.value)} />
				<button disabled={connected} onClick={handleConnect}>
					Connect
				</button>
				<button disabled={!connected} onClick={handleDisconnect}>
					Disconnect
				</button>
			</div>
			{connected && (
				<div className='flex-container sender'>
					<input
						value={send}
						onChange={(e) => {
							setSend(e.target?.value)
						}}
					/>
					<button onClick={handleSendMessage}>Send</button>
					<button onClick={() => setMessages([])}>Clear</button>
				</div>
			)}
			<div className='log-div'>{texts}</div>
		</div>
	)
}

export default App
```

部分CSS样式如下：

```css
.flex-container {
	display: flex;
	gap: 10px;
	flex-wrap: wrap;
	justify-content: center;
}

.log-div {
	background-color: aliceblue;
	border-radius: 10px;
	height: 500px;
	overflow-y: scroll;
	overflow-x: hidden;
	margin: 20px 0;
	display: flex;
	flex-direction: column;
	align-items: flex-start;
	justify-content: flex-start;
	padding: 5px 10px;
	width: 100%;
}

.log-div div {
	margin: 5px 0;
}

.log-div .info {
	color: #888;
}

.log-div .error {
	color: #ff0000;
}

.sender {
	margin: 10px 0;
}

.sender input {
	width: 500px;
}
```

从代码中我们可以看到我们使用了`ref` 管理WS实例（不会随视图渲染改变的变量），并使用几个`state` 来管理消息列表、连接状态和输入框缓存，最后将连接和发送操作封装为可调用的方法。

最终效果如下图所示，可以看到尽管来自同一域名，我们的WebSocket服务器也能区分不同会话。

![](https://picgo-1308055782.cos.ap-chengdu.myqcloud.com/picgo-core/2023/07/20230709002946.png)

##### 使用`react-use-websocket`

在上面的开发过程中我们可以发现，建立WebSocket连接其实是一个可以抽象的逻辑，以供重复调用，在React中也就是抽象为一个Hook，每次需要用到WebSocket的时候就调用这个Hook。

这里我们使用一个名为`react-use-websocket`的npm包，先安装它 `pnpm add react-use-websocket` （如果你使用React17及以下请安装3.0.0版本）。使用封装好的包的好处是节省开发时间和提供更健壮和全面的封装，避免自己开发时没有考虑到的边界情况引发的Bugs（但不是绝对的）。

`react-use-websocket` 提供的API如下（Copy自官方文档），可以看到它直接为我们封装好了一系列的行为（如**心跳重连**、JSON封装等），将基础的`ReadyState`属性、`send` 操作等暴露了出来：

```typescript
type UseWebSocket = (
  //Url can be return value of a memoized async function.
  url: string | () => Promise<string>,
  options: {
    fromSocketIO?: boolean;
    queryParams?: { [field: string]: any };
    protocols?: string | string[];
    share?: boolean;
    onOpen?: (event: WebSocketEventMap['open']) => void;
    onClose?: (event: WebSocketEventMap['close']) => void;
    onMessage?: (event: WebSocketEventMap['message']) => void;
    onError?: (event: WebSocketEventMap['error']) => void;
    onReconnectStop?: (numAttempts: number) => void;
    shouldReconnect?: (event: WebSocketEventMap['close']) => boolean;
    reconnectInterval?: number | ((lastAttemptNumber: number) => number);
    reconnectAttempts?: number;
    filter?: (message: WebSocketEventMap['message']) => boolean;
    retryOnError?: boolean;
    eventSourceOptions?: EventSourceInit;
  } = {},
  shouldConnect: boolean = true,
): {
  sendMessage: (message: string, keep: boolean = true) => void,
  //jsonMessage must be JSON-parsable
  sendJsonMessage: (jsonMessage: JsonValue, keep: boolean = true) => void,
  //null before first received message
  lastMessage: WebSocketEventMap['message'] | null,
  //null before first received message. If message.data is not JSON parsable, then this will be a static empty object
  lastJsonMessage: JsonValue | null,
  // -1 if uninstantiated, otherwise follows WebSocket readyState mapping: 0: 'Connecting', 1 'OPEN', 2: 'CLOSING', 3: 'CLOSED'
  readyState: number,
  // If using a shared websocket, return value will be a proxy-wrapped websocket, with certain properties/methods protected
  getWebSocket: () => (WebSocketLike | null),
}
```

使用`react-use-websocket` 改写后的代码如下：

```tsx
import { useEffect, useMemo, useRef, useState } from 'react'
import useWebSocket from 'react-use-websocket'
import './App.css'
import { WebSocketLike } from 'react-use-websocket/dist/lib/types'

function App() {
	const ws = useRef<WebSocketLike | null>(null)
	const senderRef = useRef<HTMLInputElement>(null)
	const [shouldConnect, setShouldConnect] = useState<boolean>(false)
	const [host, setHost] = useState<string>('localhost:4567')
	const [messages, setMessages] = useState<
		{
			category: 'message' | 'error' | 'info'
			message: string
		}[]
	>([])

	const { sendMessage, lastMessage, readyState, getWebSocket } = useWebSocket(
		'ws://' + host,
		{
			onOpen: () => {
				ws.current = getWebSocket()
			},
			shouldReconnect: () => shouldConnect
		},
		shouldConnect
	)

	const connected = readyState === 1

	useEffect(() => {
		if (lastMessage) {
			// eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
			const { data } = lastMessage
			setMessages((prev) => {
				return [...prev, { category: 'message', message: data as string }]
			})
		}
	}, [lastMessage])

	const texts = useMemo(() => {
		return messages.map(({ category, message }, index) => {
			return (
				<div className={category} key={index}>
					{`[${category.toUpperCase()}] ${message}`}
				</div>
			)
		})
	}, [messages])

	const handleConnect = () => {
		setShouldConnect(true)
	}

	const handleDisconnect = () => {
		if (ws.current) {
			ws.current.close()
		}
	}

	useEffect(() => {
		return () => {
			handleDisconnect()
		}
	}, [])

	return (
		<div>
			<div className='flex-container'>
				<input value={host} onChange={(e) => setHost(e.target.value)} />
				<button disabled={connected} onClick={handleConnect}>
					Connect
				</button>
				<button disabled={!connected} onClick={handleDisconnect}>
					Disconnect
				</button>
			</div>
			{connected && (
				<div className='flex-container sender'>
					<input ref={senderRef} />
					<button
						onClick={() => {
							if (senderRef.current) {
								sendMessage(senderRef.current.value)
								senderRef.current.value = ''
							}
						}}
					>
						Send
					</button>
				</div>
			)}
			<div className='log-div'>{texts}</div>
		</div>
	)
}

export default App
```

可以看到，我们使用了`react-use-websocket` 后由于用其暴露的属性进行了逻辑重写，包括使用`useEffect` 来更新消息队列、直接使用`sendMessage()` 来发送消息以及直接使用`readyState` 来判断连接状态。相较于之前的实现，封装后的代码显然减小了重复代码量。

需要注意的是，由于该Hook将WebSocket实例封装在了内部，外部采用状态驱动的函数式形式，因此无法通过新建实例的方式对同一WS地址进行断开和重连（即手动控制连接状态），只能依赖以下两种方式：

- 将`shouldConnect` 和`shouldReconnect` 绑定到一个外部的`connect` 状态中，**等待重连来重新建立连接**（上面代码的方法）
- 通过刷新输入Hook的`url` 参数可以做到**立刻新建`WebSocket`实例并重连（推荐）**，实践中可以在重连后立刻清空状态，等待用户重新输入
- 如果不需要用户控制连接，后台维护连接的话就不需要将`connect` 操作暴露给用户

#### 使用WebSocket传输文件

WebSocket中使用ArrayBuffer传输文件，在`react-use-websocket`中直接将文件用`sendMessage()` 传输出去即可，`ws` 接收到的参数中`isBin` 就是`true` ，如下图所示：

![](https://picgo-1308055782.cos.ap-chengdu.myqcloud.com/picgo-core/2023/07/20230709002953.png)

因此，使用ArrayBuffer传输文件的方案有下：

- 直接传输文件，WebSocket可以接收`Blob` 对象（`File` 是`Blob` 的子类）进行传输
- 使用JSON包装后传输，这时需要将文件手动读取为ArrayBuffer传输
- 高级操作：**在服务端读取已传输字节数和总长度，返回传输百分比**

## socket.io 库

> 🚦[Socket.IO](http://Socket.IO 'Socket.IO') **不是** WebSocket实现。尽管它**尽可能使用 WebSocket 作为传输协议**，但它一方面**可能回退到其他传输方式（如Ajax轮询）**，另一方面其**每条消息都被附上了额外的数据来实现自身逻辑，如轮询回退、自动重连等**。
> 这就是**为什么 WebSocket 客户端将无法成功连接到 **[**Socket.IO**](http://Socket.IO 'Socket.IO')** 服务器，而 **[**Socket.IO**](http://Socket.IO 'Socket.IO')** 客户端也将无法连接到普通 WebSocket 服务器**，虽然Socket.io的传输协议使用了WebSocket，但它们在接口上并不是兼容的。

[Socket.IO](http://Socket.IO 'Socket.IO') 是一个多语言、跨平台的库，可以在客户端和服务器之间实现 **低延迟**, **双向** 和 **基于事件的** 通信。通常情况下，它建立在 [WebSocket](https://fr.wikipedia.org/wiki/WebSocket 'WebSocket') 协议之上，并提供额外的保证，例如回退到 HTTP 长轮询或自动重新连接。它提供以下额外特性：

- HTTP 长轮询回退：如果无法建立 WebSocket 连接，连接将回退到 HTTP 长轮询
- 自动重新连接：[Socket.IO](http://Socket.IO 'Socket.IO') 包含一个**心跳机制**，它会定期检查连接的状态
- 数据包缓冲：当客户端断开连接时，数据包会自动缓冲，并在重新连接时发送
- 广播和多路复用
  - 服务器端可以通过**广播向所有客户端或特定子集**发送信息
  - 多路复用：通过**命名空间**机制使用**单个连接拆分出多个信道**![](https://picgo-1308055782.cos.ap-chengdu.myqcloud.com/picgo-core/2023/07/20230709002958.png)

### 工作原理

socket.io默认工作在WebSocket上，在轮询模式中则回退到HTTP，但其报文内容是一致的。socket.io通过在报文负载中附上额外信息来确保自身额外功能的实现。

如`socket.emit("hello", "world")` 将作为单个 WebSocket 帧发送，其中包含`42["hello","world"]`：

- `4` 是 [Engine.IO](http://Engine.IO 'Engine.IO') “消息”数据包类型
- `2` 是 [Socket.IO](http://Socket.IO 'Socket.IO') “消息”数据包类型
- `["hello","world"]`是参数数组被`JSON.stringify()`过的版本

你可能注意到了上面有engine.io和socket.io两种不同的数据包类型标识符，这**对应了Socket.io 两个不同的层**：

- 底层通道 Engine.IO：**负责建立服务器和客户端之间的低级连接**，如WebSocket连接、轮询回退、断线检测（心跳机制）等，**向上提供一个全双工连接的抽象**
  - **默认使用HTTP长轮询建立连接，后续尝试升级协议为WebSocket**
    - HTTP 长轮询：由连续的 HTTP 请求组成，WebSocket的回退策略
      - 长时间运行的 `GET` 请求，用于从服务器接收数据
      - 短时 `POST` 请求，用于向服务器发送数据
    - WebSocket 传输：由WebSocket 连接组成，它在服务器和客户端之间提供双向和低延迟的通信通道
  - 向下实现可交付保证，**向上屏蔽通讯实现细节，并提供上层功能所需的API**（如拓展的事件体系）
- 上层封装Socket.IO：在Engine.IO建立连接后添加**面向用户的附加功能**，如自动重连、多路复用等

#### `Socket` 实例

这里的Socket概念和WebSocket类似，对应一个连接，其具有以下额外属性：

- `id` 属性：每个新连接都分配有一个随机的 20 个字符的标识符
- `handshake` 属性：握手信息
- `conn` 属性：底层连接信息

##### 房间

房间是在**服务器端可见的客户端的集合**，它包含一个或多个客户端。

- 每个Socket创建后会加入由**其自己的 id 标识的房间**，这意味着您可以将其用于私人消息传递
- `socket.rooms()` 可以查看当前Socket所在房间的集合
- `socket.join(roomName: string)` 可以使socket加入某个房间
- `io.to(room).emit(event, ...args)` 可以**向房间内所有客户端广播事件**
  - `to()` 支持级联，同时向多个房间发送
  - 若从`socket` 发送广播，则除了发送者外房间内所有客户端都会收到广播

##### 中间件

中间件函数是为每个传入连接执行的函数，Socket.io里的中间件和其他地方的中间件含义是相同的，通常用于登录检测等领域。

#### 消息类型与事件处理

> [Socket.IO](http://Socket.IO 'Socket.IO') API 的灵感来自 Node.js EventEmitter，这意味着您可以在一侧发出事件并在另一侧注册侦听器

和普通的WebSocket一样，Socket.io也是**基于事件驱动的双工通讯**

- `io.on('connection', (socket) ⇒ {...})` 是服务端**一切事件的起点**，需要在回调中给每个socket绑定事件
- `socket.on(event: string, callback: (...args) ⇒ void)` 是**对Socket连接注册事件监听**的方法
  - `socket.once()` 是签名和`on()` 相同的**一次性监听函数**
  - `socket.onAny(listener)` 可用于**监听任意事件**
  - `disconnect` 和 `disconnecting` ：在服务端发出的特殊事件，Socket 实例在断开连接时触发，`payload` 为断开原因
  - `event` 是**可以自定义的**，只要不覆盖任何现有事件就可以是任何类型的字段，这**对应了原版WebSocket的`type`字段**，但不同之处是原版WebSocket中只能使用`send()` 方法，`type` 固定为`message` ，但**这里是可以完全自定义的**
- `socket.off(event: string)` 用于移除指定监听器
- `socket.emit(event: string, ...args: any)` 是**向对方发送事件**的方法
  - `socket.send(..args)` 方法仍是支持的，将发送一个默认的`message` 事件
  - 可以发送任意数量的参数，并且**支持所有可序列化的数据结构**，**包括像Buffer 或 TypedArray这样的二进制对象**，并且**无需`JSON.stringify()`，因为它会为您完成**
  - 可以在`emit` 中添加回调，只需要把最后一个参数设为回调函数，在服务端进行调用即可

#### 广播事件

- `socket.broadcast.emit(event, ...args)` 会向**除发送者外的所有客户端**发送消息

#### 命名空间和多路复用

> 🚦待完成

### Node.js 实践

#### 创建后端服务器

```javascript
import { Server } from 'socket.io'

const io = new Server({
	cors: 'http://127.0.0.1:5173/'
})

let progress = 0

io.on('connection', (socket) => {
	console.log(`[Server] Connection established with ${socket.id}`)

	// 模拟进度
	const timer = setInterval(() => {
		if (progress < 100) {
			socket.emit('progress', progress)
			socket.send(`${progress}% 这是一条模拟日志`)
			progress++
		} else {
			socket.emit('progress', progress)
			socket.send('Done')
			progress = 0
			clearInterval(timer)
			socket.disconnect()
		}
	}, 100)

	// 基础回声
	socket.on('message', (data) => {
		console.log(`[Message] ${data}`)
		socket.send(`[Echo] You sent -> ${data}`)
	})

	// 断开连接
	socket.on('disconnect', (reason) => {
		clearInterval(timer)
		progress = 0
		console.log(`[Server] Connection with ${socket.id} closed with ${reason}`)
	})
})

io.listen(4567)
```

在这个例子中我使用自定义事件`progress` 模拟了一个后台进程向前端输出日志和进度的过程。

> 🌟需要注意的是，在前后端分离的情况下我们需要手动指定跨域，就像上面的`cors: 'http://127.0.0.1:5173/',` 一样

#### 修改前端页面

这里我们沿用上一个WebSocket的例子，先安装依赖 `pnpm add socket.io-client` 。

直接抽象出一个`useSocket` Hook进行封装：

```tsx
// useSocket.ts

/* eslint-disable react-hooks/exhaustive-deps */
import { useEffect, useRef, useState } from 'react'
import { io } from 'socket.io-client'

export default function useSocket(url: string, autoConnect = false) {
	const socket = useRef(io(url, { autoConnect }))
	const [isConnected, setIsConnected] = useState(socket.current.connected)
	const [latestMessage, setLatestMessage] = useState<unknown>(null)
	const [progress, setProgress] = useState<number>(0)

	useEffect(() => {
		socket.current.on('connect', () => {
			setIsConnected(true)
			setLatestMessage('Connected!')
		})
		socket.current.on('disconnect', () => {
			setIsConnected(false)
			alert('Disconnected!')
		})
		socket.current.on('message', (data) => {
			setLatestMessage(`${Date.now()}: ${data as string}`)
		})
		socket.current.on('progress', (progress: number) => {
			setProgress(progress)
		})
		return () => {
			socket.current.off('connect')
			socket.current.off('disconnect')
			socket.current.off('message')
			socket.current.off('progress')
		}
	}, [])

	const handleSendMessage = (message: string) => {
		socket.current.send(message)
	}

	return {
		isConnected,
		latestMessage,
		progress,
		sendMessage: handleSendMessage,
		socket: socket.current
	}
}

// App.tsx

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import './App.css'
import useSocket from './useSocket'

const inputTypes = ['text', 'file']

function App() {
	const senderRef = useRef<HTMLInputElement>(null)

	const [inputType, setInputType] = useState<string>(inputTypes[0])

	const [host, setHost] = useState<string>('localhost:4567')

	const { isConnected, latestMessage, progress, socket, sendMessage } = useSocket('http://' + host)

	const [messages, setMessages] = useState<
		{
			category: 'message' | 'error' | 'info'
			message: string
		}[]
	>([])

	useEffect(() => {
		if (latestMessage) {
			// eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
			setMessages((prev) => {
				return [...prev, { category: 'message', message: latestMessage as string }]
			})
		}
	}, [latestMessage])

	const texts = useMemo(() => {
		return messages.map(({ category, message }, index) => {
			return (
				<div className={category} key={index}>
					{`[${category.toUpperCase()}] ${message}`}
				</div>
			)
		})
	}, [messages])

	const handleConnect = () => {
		socket.connect()
	}

	const handleDisconnect = useCallback(() => {
		socket.disconnect()
	}, [socket])

	useEffect(() => {
		return () => {
			handleDisconnect()
		}
	}, [handleDisconnect])

	return (
		<div>
			<div className='flex-container'>
				<input value={host} onChange={(e) => setHost(e.target.value)} />
				<button disabled={isConnected} onClick={handleConnect}>
					Connect
				</button>
				<button disabled={!isConnected} onClick={handleDisconnect}>
					Disconnect
				</button>
			</div>
			{isConnected && (
				<div className='flex-container sender'>
					<select
						value={inputType}
						onChange={(e) => {
							setInputType(e.target.value)
						}}
					>
						{inputTypes.map((type, index) => {
							return (
								<option key={index} value={type}>
									{type}
								</option>
							)
						})}
					</select>
					<div>{progress}%</div>
					<input type={inputType} ref={senderRef} />
					<button
						onClick={() => {
							if (senderRef.current) {
								if (inputType === 'text') sendMessage(senderRef.current.value)
								senderRef.current.value = ''
							}
						}}
					>
						Send
					</button>
				</div>
			)}
			<div className='log-div'>{texts}</div>
		</div>
	)
}

export default App
```

最终运行效果如下：

![](https://picgo-1308055782.cos.ap-chengdu.myqcloud.com/picgo-core/2023/07/20230709003014.gif)
