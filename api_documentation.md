# API 接口文档

## 1. 任务中心模块

### 1.1 任务列表接口

**路径**: `/api/taskcenter/tasks`  
**方法**: GET  
**认证**: 需要用户登录（从请求上下文获取 user_id）

**响应**:
```json
[
  {
    "id": 1,
    "type": "article",
    "status": "create",
    "created_at": "2026-03-29T10:00:00Z",
    "cost": "{\"total\": 10}",
    "details": {
      "article_id": 1,
      "exec_id": "exec_123",
      "is_settle": true
    }
  },
  {
    "id": 2,
    "type": "image",
    "status": "completed",
    "created_at": "2026-03-29T10:05:00Z",
    "cost": "{\"total\": 20}",
    "details": {
      "prompt": "A beautiful landscape",
      "model_name": "dall-e-3",
      "image_urls": "["https://example.com/image1.jpg"]",
      "is_settle": true,
      "completed_at": "2026-03-29T10:10:00Z"
    }
  },
  {
    "id": 3,
    "type": "material",
    "status": "done",
    "created_at": "2026-03-29T10:15:00Z",
    "cost": "{\"total\": 5}",
    "details": {
      "material_type": "news",
      "query": "latest technology news",
      "exec_id": "exec_456",
      "is_settle": false,
      "remark": "Technology news search"
    }
  },
  {
    "id": 4,
    "type": "post_crawl",
    "status": "completed",
    "created_at": "2026-03-29T10:20:00Z",
    "cost": "{\"total\": 15}",
    "details": {
      "snapshot_id": "snap_789",
      "is_settle": true,
      "response": "{\"data\": [...]}"
    }
  }
]
```

### 1.2 任务详情接口

**路径**: `/api/taskcenter/task/:type/:id`  
**方法**: GET  
**认证**: 需要用户登录（从请求上下文获取 user_id）

**路径参数**:
- `type`: 任务类型（article, image, material, post_crawl）
- `id`: 任务ID

**响应**:
- 文章任务:
  ```json
  {
    "id": 1,
    "article_id": 1,
    "is_settle": true,
    "exec_id": "exec_123",
    "operate_type": "create",
    "cost": "{\"total\": 10}",
    "created_at": "2026-03-29T10:00:00Z",
    "updated_at": "2026-03-29T10:00:00Z"
  }
  ```

- 图片生成任务:
  ```json
  {
    "id": 2,
    "user_id": 1,
    "gen_mode": "creator",
    "config": "{}",
    "prompt": "A beautiful landscape",
    "referenced_material_ids": "",
    "reference_image_urls": "",
    "is_settle": true,
    "cost": "{\"total\": 20}",
    "status": "completed",
    "image_urls": "["https://example.com/image1.jpg"]",
    "model_name": "dall-e-3",
    "model_reference_id": "",
    "created_at": "2026-03-29T10:05:00Z",
    "completed_at": "2026-03-29T10:10:00Z"
  }
  ```

- 素材任务:
  ```json
  {
    "id": 3,
    "user_id": 1,
    "material_type": "news",
    "status": "done",
    "remark": "Technology news search",
    "query": "latest technology news",
    "is_settle": false,
    "exec_id": "exec_456",
    "cost": "{\"total\": 5}",
    "created_at": "2026-03-29T10:15:00Z",
    "updated_at": "2026-03-29T10:15:00Z",
    "ai_result": "{}"
  }
  ```

- 社交帖子抓取任务:
  ```json
  {
    "id": 4,
    "user_id": 1,
    "snapshot_id": "snap_789",
    "state": 3,
    "response": "{\"data\": [...]}",
    "is_settle": true,
    "cost": "{\"total\": 15}",
    "created_at": "2026-03-29T10:20:00Z",
    "updated_at": "2026-03-29T10:20:00Z"
  }
  ```

2. WebSocket 模块
2.1 WebSocket 连接接口
连接地址: ws://localhost:8080/ws/connect 认证: 需要用户登录（使用 JWT token）

连接方式:

通过 URL 参数传递 token: ws://localhost:8080/ws/connect?token=YOUR_JWT_TOKEN
或通过 Authorization header 传递 token（部分 WebSocket 客户端支持）
2.2 消息格式
所有 WebSocket 消息都使用 JSON 格式，包含以下字段：

type: 消息类型
payload: 消息内容
2.3 消息类型
2.3.1 客户端发送的消息
消息类型  描述  payload 结构
ping  心跳消息，用于保持连接活跃 {}
2.3.2 服务端发送的消息
消息类型  描述  payload 结构
welcome 连接成功欢迎消息  {"message": "WebSocket connection established", "user_id": 1}
pong  心跳响应  {"timestamp": "now"}
task_update 任务状态更新  {"task_id": 1, "task_type": "image", "status": "processing", "outputs": null, "error": ""}
task_complete 任务完成通知  {"task_id": 1, "task_type": "image", "status": "completed", "outputs": ["https://example.com/image1.jpg"], "error": ""}
task_failed 任务失败通知  {"task_id": 1, "task_type": "image", "status": "failed", "outputs": null, "error": "Failed to process task"}
2.4 前端示例代码
JavaScript



// 假设已经获取了tokenconst token = "YOUR_JWT_TOKEN";const ws = new WebSocket(`ws://localhost:8080/ws/connect?token=${token}`);ws.onopen = function() {  console.log("WebSocket连接成功");  // 发送心跳  setInterval(() => {    ws.send(JSON.stringify({ type:     "ping" }));  }, 30000);};ws.onmessage = function(event) {  const message = JSON.parse(event.data);  console.log("收到消息:", message);    // 处理不同类型的消息  switch(message.type) {    case "welcome":      console.log("连接欢迎消息:", message.      payload);      break;    case "task_update":      console.log("任务状态更新:", message.      payload);      // 更新任务列表中的状态      updateTaskStatus(message.payload.      task_id, message.payload.status);      break;    case "task_complete":      console.log("任务完成:", message.      payload);      // 显示任务完成通知      showTaskCompleteNotification      (message.payload);      break;    case "task_failed":      console.log("任务失败:", message.      payload);      // 显示任务失败通知      showTaskFailedNotification(message.      payload);      break;    case "pong":      console.log("心跳响应");      break;  }};ws.onerror = function(error) {  console.error("WebSocket错误:", error);};ws.onclose = function() {  console.log("WebSocket连接关闭");  // 可以在这里实现重连逻辑};// 更新任务状态的函数function updateTaskStatus(taskId, status) {  // 找到对应的任务并更新状态  const taskElement = document.  querySelector(`[data-task-id="${taskId}  "]`);  if (taskElement) {    taskElement.querySelector(".    task-status").textContent = status;    // 根据状态更新样式    taskElement.className = `task-item     status-${status}`;  }}// 显示任务完成通知function showTaskCompleteNotification(payload) {  const notification = document.  createElement("div");  notification.className = "notification   success";  notification.innerHTML = `    <h3>任务完成</h3>    <p>任务 ${payload.task_id} 已成功完成</    p>    ${payload.outputs ? `<p>生成的图片: $    {payload.outputs.length} 张</p>` : ""}  `;  document.getElementById  ("notifications").appendChild  (notification);    // 3秒后自动关闭  setTimeout(() => {    notification.remove();  }, 3000);}// 显示任务失败通知function showTaskFailedNotification(payload) {  const notification = document.  createElement("div");  notification.className = "notification   error";  notification.innerHTML = `    <h3>任务失败</h3>    <p>任务 ${payload.task_id} 执行失败</p>    ${payload.error ? `<p>错误信息: $    {payload.error}</p>` : ""}  `;  document.getElementById  ("notifications").appendChild  (notification);    // 3秒后自动关闭  setTimeout(() => {    notification.remove();  }, 3000);}
2.5 后端实现说明
连接管理: WebSocket 连接由 WebSocketManager 管理，支持多客户端同时连接
认证验证: 使用 JWT 认证中间件验证连接请求
消息处理: WebSocketHandler 处理客户端消息和服务端推送
任务状态集成: 集成到任务执行器中，当任务状态变更时自动发送通知
定时任务: 每分钟检查一次任务状态，确保状态变更能够及时推送
3. 任务状态说明
3.1 文章任务状态
状态值 描述
create  创建文章
edit  编辑文章
3.2 图片生成任务状态
状态值 描述
pending 待处理
processing  处理中
completed 已完成
failed  失败
3.3 素材任务状态
状态值 描述
doing 处理中
done  已完成
failed  失败
3.4 社交帖子抓取任务状态
状态值 描述
executing 执行中
querying  查询中
completed 已完成
4. 调用示例
4.1 获取任务列表
Bash



运行
curl -X GET "http://localhost:8080/api/taskcenter/tasks" \  -H "Authorization: Bearer YOUR_TOKEN"
4.2 获取任务详情
Bash



运行
curl -X GET "http://localhost:8080/api/taskcenter/task/image/1" \  -H "Authorization: Bearer YOUR_TOKEN"
4.3 建立 WebSocket 连接
JavaScript



// 使用 JavaScript WebSocket APIconst token = "YOUR_JWT_TOKEN";const ws = new WebSocket(`ws://localhost:8080/ws/connect?token=${token}`);
4.4 发送心跳消息
JavaScript



ws.send(JSON.stringify({ type: "ping" }));
