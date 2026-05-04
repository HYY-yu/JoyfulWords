# Grafana Faro / OpenTelemetry 集成指南

本文档记录 JoyfulWords 前端的 Grafana Frontend Observability 与 OpenTelemetry 接入方式。

## 当前实现

- 浏览器端: `lib/otel/client-instrumentation.ts` 使用 `@grafana/faro-web-sdk` 初始化 Faro,并通过 `@grafana/faro-web-tracing` 自动采集 Web Vitals、错误、资源、导航和 `fetch` traces。
- Next.js server 端: `instrumentation.ts` 使用 `@vercel/otel` 注册服务端 OpenTelemetry。
- 前后端 trace 关联:
  - 浏览器请求 API 时,Faro fetch instrumentation 会向允许的 API origin 注入 W3C `traceparent`/`tracestate`。
  - Next.js `proxy.ts` 会写入 `server-timing: traceparent;desc="..."`,用于 Grafana 将 RUM 页面加载与服务端 trace 关联。
  - `apiClient` 仍保留手动 `traceparent` fallback,但主链路以 Faro 自动 instrumentation 为准。

## 环境变量

`.env.local` 示例:

```bash
# 开关
NEXT_PUBLIC_ENABLE_TELEMETRY=true

# Grafana Frontend Observability collector URL
NEXT_PUBLIC_FARO_URL=https://faro-collector-prod-xxx.grafana.net/collect/xxxxxxxx
NEXT_PUBLIC_FARO_APP_NAME=joyful-words-browser
NEXT_PUBLIC_FARO_APP_NAMESPACE=joyfulwords
NEXT_PUBLIC_FARO_APP_VERSION=development

# 允许向这些浏览器端 API origin 传播 trace headers,逗号分隔
NEXT_PUBLIC_FARO_PROPAGATE_TRACE_URLS=http://localhost:8080,https://api.joyword.link

# Next.js server spans
OTEL_SERVICE_NAME=joyful-words-frontend
OTEL_SERVICE_NAMESPACE=joyfulwords
OTEL_EXPORTER_OTLP_ENDPOINT=http://localhost:4318
OTEL_EXPORTER_OTLP_PROTOCOL=http/protobuf

# Grafana Cloud OTLP 需要认证时配置,格式示例:
# OTEL_EXPORTER_OTLP_HEADERS=Authorization=Basic <base64(instanceId:token)>

# Next.js server outgoing fetch trace propagation,逗号分隔
OTEL_PROPAGATE_TRACE_URLS=http://localhost:8080,https://api.joyword.link

# 生产建议采样
OTEL_TRACES_SAMPLER=traceidratio
OTEL_TRACES_SAMPLER_ARG=0.1
```

注意: 新增 `NEXT_PUBLIC_*` 时必须同步 `Dockerfile.prod` 和 `.drone.yml`,否则 Next.js 客户端构建产物里会拿不到变量。

## 本地验证

启动本地 collector 或 Jaeger:

```bash
docker run -d --name jaeger \
  -e COLLECTOR_OTLP_ENABLED=true \
  -p 16686:16686 \
  -p 4318:4318 \
  jaegertracing/all-in-one:latest
```

启动前端:

```bash
pnpm dev
```

浏览器 Network 验证:

- API 请求 Request Headers 应出现 `traceparent`。
- 页面或重定向响应 Headers 应出现 `server-timing: traceparent;desc="00-..."`。
- Grafana Frontend Observability 中应能看到 browser spans,并能通过 trace ID 关联到服务端 traces。

## 后端契约

Go 后端需要同时满足:

- CORS `Access-Control-Allow-Headers` 包含 `traceparent,tracestate,baggage,authorization,content-type,accept-language`。
- HTTP middleware 从请求头提取 W3C Trace Context,再进入业务 handler。
- 日志字段里保留 trace ID / span ID,401/402/5xx 等关键路径不要吞错。

Go 后端伪代码:

```go
propagator := propagation.TraceContext{}
ctx := propagator.Extract(r.Context(), propagation.HeaderCarrier(r.Header))
r = r.WithContext(ctx)
next.ServeHTTP(w, r)
```

## 故障排查

- 没有浏览器数据: 检查 `NEXT_PUBLIC_ENABLE_TELEMETRY=true` 和 `NEXT_PUBLIC_FARO_URL`。
- API 请求没有 `traceparent`: 检查 `NEXT_PUBLIC_FARO_PROPAGATE_TRACE_URLS` 是否包含 API origin。
- CORS preflight 失败: 后端没有允许 `traceparent`/`tracestate`/`baggage`。
- 服务端 spans 没上报: 检查 `OTEL_EXPORTER_OTLP_ENDPOINT`、`OTEL_EXPORTER_OTLP_PROTOCOL`、`OTEL_EXPORTER_OTLP_HEADERS`。
- RUM 和 server trace 没关联: 检查响应是否有 `server-timing` header,以及浏览器是否允许读取该 header。

## 参考

- Grafana Frontend Observability Next.js 接入文档: https://grafana.com/docs/grafana-cloud/monitor-applications/frontend-observability/get-started/instrument-nextjs/
- Next.js OpenTelemetry 文档: https://nextjs.org/docs/app/guides/open-telemetry
- W3C Trace Context: https://www.w3.org/TR/trace-context/
