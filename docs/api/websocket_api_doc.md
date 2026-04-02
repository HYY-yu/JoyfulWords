# WebSocket 接口文档

## 连接信息

### 连接地址
```
ws://localhost:8080/ws?token={token}
```

### 连接参数
| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| token | string | 是 | 用户认证令牌 |

## 消息结构

### 通用消息格式
```json
{
  "type": "消息类型",
  "payload": "消息内容"
}
```

## 客户端发送的消息

### 心跳消息 (ping)
**类型**: `ping`
**作用**: 维持WebSocket连接活跃
**请求示例**:
```json
{
  "type": "ping",
  "payload": {}
}
```

**响应示例**:
```json
{
  "type": "pong",
  "payload": {
    "timestamp": "now"
  }
}
```

## 服务端发送的消息

### 连接成功消息 (welcome)
**类型**: `welcome`
**作用**: 通知客户端连接成功
**示例**:
```json
{
  "type": "welcome",
  "payload": {
    "message": "WebSocket connection established",
    "user_id": 123,
    "status": "success"
  }
}
```

### 任务更新消息 (task_update)
**类型**: `task_update`
**作用**: 通知客户端任务状态更新
**示例**:
```json
{
  "type": "task_update",
  "payload": {
    "task_id": 123,
    "task_type": "image",
    "status": "pending"
  }
}
```

### 任务完成消息 (task_complete)
**类型**: `task_complete`
**作用**: 通知客户端任务完成
**示例**:
```json
{
  "type": "task_complete",
  "payload": {
    "task_id": 123,
    "task_type": "image",
    "status": "success",
    "outputs": {
      "image_urls": [
        "https://example.com/image1.jpg",
        "https://example.com/image2.jpg"
      ]
    }
  }
}
```

### 任务失败消息 (task_failed)
**类型**: `task_failed`
**作用**: 通知客户端任务失败
**示例**:
```json
{
  "type": "task_failed",
  "payload": {
    "task_id": 123,
    "task_type": "image",
    "status": "failed",
    "error": "Task failed"
  }
}
```

## 消息类型说明

| 消息类型 | 方向 | 说明 |
|---------|------|------|
| ping | 客户端→服务端 | 心跳请求 |
| pong | 服务端→客户端 | 心跳响应 |
| welcome | 服务端→客户端 | 连接成功通知 |
| task_update | 服务端→客户端 | 任务状态更新通知 |
| task_complete | 服务端→客户端 | 任务完成通知 |
| task_failed | 服务端→客户端 | 任务失败通知 |

## 字段说明

### TaskUpdatePayload 结构
| 字段 | 类型 | 说明 |
|------|------|------|
| task_id | int64 | 任务ID |
| task_type | string | 任务类型，如 "image" |
| status | string | 任务状态，如 "pending", "processing", "success", "failed" |
| outputs | object | 任务结果，仅在任务完成时返回 |
| error | string | 错误信息，仅在任务失败时返回 |

## 连接流程

1. 客户端通过 `ws://localhost:8080/ws?token={token}` 建立WebSocket连接
2. 服务端验证token并建立连接
3. 服务端发送 `welcome` 消息通知客户端连接成功
4. 客户端定期发送 `ping` 消息维持连接
5. 服务端在任务创建、状态更新时发送相应的通知消息
6. 客户端接收并处理服务端发送的消息

## 错误处理

- **401 Unauthorized**: token未提供或无效
- **500 Internal Server Error**: WebSocket连接建立失败

## 代码示例

### 客户端连接示例 (JavaScript)
```javascript
const token = "your-auth-token";
const ws = new WebSocket(`ws://localhost:8080/ws?token=${token}`);

ws.onopen = function() {
  console.log("WebSocket connected");
};

ws.onmessage = function(event) {
  const message = JSON.parse(event.data);
  console.log("Received message:", message);
  
  switch (message.type) {
    case "welcome":
      console.log("Connection established");
      break;
    case "task_update":
      console.log("Task updated:", message.payload);
      break;
    case "task_complete":
      console.log("Task completed:", message.payload);
      break;
    case "task_failed":
      console.log("Task failed:", message.payload);
      break;
    case "pong":
      console.log("Heartbeat received");
      break;
  }
};

ws.onerror = function(error) {
  console.error("WebSocket error:", error);
};

ws.onclose = function() {
  console.log("WebSocket disconnected");
};

// 发送心跳
setInterval(() => {
  ws.send(JSON.stringify({ type: "ping", payload: {} }));
}, 30000);
```