# OpenTelemetry 集成指南

本文档说明如何使用 JoyfulWords 中集成的 OpenTelemetry 分布式追踪功能。

## 📖 概述

JoyfulWords 已集成 OpenTelemetry,支持前后端分布式追踪:
- ✅ **服务端自动追踪**: Next.js SSR、API Routes、Server Actions
- ✅ **前端 API 追踪**: 所有通过 `apiClient` 的请求自动注入 trace headers
- ✅ **前后端关联**: 同一个 trace ID 可以追踪完整的用户请求链路

## 🚀 快速开始

### 1. 启动 Jaeger (开发环境)

在第一个终端启动 Jaeger UI:

```bash
docker run -d --name jaeger \
  -e COLLECTOR_OTLP_ENABLED=true \
  -p 16686:16686 \
  -p 4318:4318 \
  jaegertracing/all-in-one:latest
```

访问 Jaeger UI: http://localhost:16686

### 2. 启动开发服务器

在第二个终端:

```bash
pnpm dev
```

开发服务器会自动加载 OpenTelemetry 配置并开始发送 traces。

### 3. 查看追踪数据

1. 打开应用并执行一些操作(如登录、创建文章)
2. 访问 http://localhost:16686
3. 在 Service 下拉菜单选择 "joyful-words-frontend"
4. 点击 "Find Traces" 查看所有追踪记录
5. 点击具体的 trace 查看详细的 span 树

## 🔍 验证 Trace Headers

### 在浏览器中验证

1. 打开浏览器开发者工具 (F12)
2. 切换到 Network 标签
3. 在应用中执行一个操作(如登录)
4. 点击对应的 API 请求
5. 查看 Request Headers 中的 `traceparent` header

**预期格式**:
```
traceparent: 00-4bf92f3577b34da6a3ce929d0e0e4736-00f067aa0ba902b7-01
          ▲  └─────────────trace_id─────────────┬─span_id─┘ ▲
          │                                      │          │
          version                          parent_span_id  flags
```

### 使用测试脚本

```bash
node test-trace-headers.js
```

## 📊 理解 Trace 数据

### Trace 生命周期

一个完整的用户请求 trace 包含:

1. **HTTP Request** (Next.js 自动创建)
   - `GET /auth/login` - 页面加载
   - `POST /auth/login` - API 调用

2. **Server Actions** (如果使用)
   - `createArticle` - 创建文章
   - `updateProfile` - 更新用户资料

3. **API Requests** (通过 apiClient)
   - 所有 API 请求都会携带 `traceparent` header
   - 后端 OpenTelemetry 会自动关联

### Span 属性

每个 span 包含丰富的属性:
- `http.method`: HTTP 方法 (GET, POST, etc.)
- `http.url`: 请求 URL
- `http.status_code`: 响应状态码
- `net.peer.name`: 目标主机名
- 自定义属性 (如果在代码中添加)

## 🔧 配置选项

### 环境变量

在 `.env.local` 中配置:

```bash
# === OpenTelemetry 配置 ===

# 服务名称 (会显示在 Jaeger 中)
OTEL_SERVICE_NAME=joyful-words-frontend

# OTLP Trace Exporter Endpoint
# 开发环境: 本地 Jaeger
OTEL_EXPORTER_OTLP_ENDPOINT=http://localhost:4318/v1/traces

# 生产环境: 使用你的 collector
# OTEL_EXPORTER_OTLP_ENDPOINT=https://otel.your-domain.com/v1/traces

# Next.js OTel 详细日志 (仅开发环境)
NEXT_OTEL_VERBOSE=1
```

### 生产环境配置

创建 `.env.production`:

```bash
# 生产环境使用采样率减少数据量
OTEL_TRACES_SAMPLER=traceidratio
OTEL_TRACES_SAMPLER_ARG=0.1  # 10% 采样

# 使用生产环境 collector
OTEL_EXPORTER_OTLP_ENDPOINT=https://otel.your-domain.com/v1/traces
```

**采样率建议**:
- 开发环境: 100% (全部记录)
- 生产环境: 10-20% (推荐)
- 高流量应用: 1-5%

## 🎯 后端集成

### 接收 Trace Headers

你的后端需要接收并处理 `traceparent` header:

```typescript
// Node.js + Express 示例
import { propagation, context } from '@opentelemetry/api'

app.use((req, res, next) => {
  // 从请求中提取 trace context
  const ctx = propagation.extract(context.active(), req.headers)

  // 在 trace context 中执行请求处理
  context.with(ctx, () => {
    next()
  })
})
```

### 验证后端接收

在后端日志中打印 traceparent:

```typescript
console.log('Received traceparent:', req.headers['traceparent'])
```

你应该看到与前端相同的 trace ID。

## 📈 性能影响

### 包体积

- **服务端**: 0 KB (无影响)
- **客户端**: ~15 KB (gzipped) - 仅当启用客户端追踪时

### 运行时开销

- **服务端**: ~5-10% (可通过采样降低)
- **客户端**: <2% (现代浏览器)

### 优化建议

1. **使用采样**: 生产环境使用 10-20% 采样率
2. **批量导出**: 使用 `BatchSpanProcessor` (已默认启用)
3. **按需启用**: 仅在需要调试时启用详细日志

## 🛠️ 故障排查

### 问题: Traces 未出现在 Jaeger

**检查清单**:
- [ ] Jaeger 容器是否运行? `docker ps | grep jaeger`
- [ ] 端口是否正确? http://localhost:4318/v1/traces
- [ ] 环境变量是否设置? `echo $OTEL_EXPORTER_OTLP_ENDPOINT`
- [ ] 服务器是否重启? 重启开发服务器以加载新配置

**调试命令**:
```bash
# 检查 Jaeger 是否接收 traces
curl http://localhost:4318/v1/traces

# 检查环境变量
echo $OTEL_EXPORTER_OTLP_ENDPOINT
```

### 问题: Traceparent header 未出现

**检查清单**:
- [ ] 浏览器 Network tab 是否检查了正确的请求?
- [ ] 是否使用了 `apiClient` 调用 API?
- [ ] 控制台是否有错误?

**验证方法**:
1. 在浏览器控制台执行:
   ```javascript
   console.log('Trace headers:', localStorage.getItem('traceparent'))
   ```

2. 在 `lib/api/client.ts` 中添加调试日志:
   ```typescript
   const traceHeaders = injectTraceHeaders()
   console.log('[Trace] Injecting headers:', traceHeaders)
   ```

### 问题: 前后端 Trace ID 不一致

**可能原因**:
1. 后端未接收 `traceparent` header
2. 后端 OpenTelemetry 未正确配置
3. CORS 配置阻止了自定义 headers

**解决方案**:
1. 检查后端 CORS 配置:
   ```typescript
   // 允许 traceparent header
   res.setHeader('Access-Control-Allow-Headers', 'Content-Type, traceparent')
   ```

2. 确认后端提取 context:
   ```typescript
   const ctx = propagation.extract(context.active(), req.headers)
   ```

## 📚 相关资源

- [Next.js OpenTelemetry 文档](https://nextjs.org/docs/app/guides/open-telemetry)
- [OpenTelemetry JavaScript 文档](https://opentelemetry.io/docs/languages/js/)
- [W3C Trace Context 规范](https://www.w3.org/TR/trace-context/)
- [Jaeger 文档](https://www.jaegertracing.io/docs/)

## 🎓 下一步

### 进阶功能

1. **添加自定义 Spans**
   ```typescript
   import { trace } from '@opentelemetry/api'

   const tracer = trace.getTracer('joyful-words')

   await tracer.startActiveSpan('custom-operation', async (span) => {
     span.setAttribute('custom.attribute', 'value')
     // 你的代码
     span.end()
   })
   ```

2. **记录错误和异常**
   ```typescript
   try {
     // 你的代码
   } catch (error) {
     span.recordException(error)
     span.setStatus({ code: SpanStatusCode.ERROR })
     throw error
   }
   ```

3. **添加业务属性**
   ```typescript
   span.setAttribute('user.id', userId)
   span.setAttribute('article.id', articleId)
   span.setAttribute('feature.name', 'content-writing')
   ```

### 生产环境部署

推荐的生产环境工具:

1. **SigNoz** (开源, 自托管)
   - 文档: https://signoz.io/

2. **Highlight.io** (SaaS, 免费 tier)
   - 文档: https://highlight.io/

3. **Datadog** (企业级)
   - 文档: https://docs.datadoghq.com/tracing/

## 🤝 贡献

如果发现问题或有改进建议,请提交 issue 或 PR。

---

**最后更新**: 2025-12-30
**版本**: 1.0.0
