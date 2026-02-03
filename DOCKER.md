# Docker 部署指南

## 概述

本项目使用多阶段 Dockerfile 构建镜像，支持开发和生产环境。

## 文件说明

- `Dockerfile` - 多阶段构建定义
- `.dockerignore` - Docker 构建时排除的文件
- `docker-compose.yml` - 开发环境编排
- `Makefile` - 快捷命令

## 快速开始

### 开发环境

```bash
# 使用 docker-compose 启动开发环境
make dev

# 或直接使用 docker-compose
docker-compose up app
```

开发环境特性：
- 热重载支持
- 挂载本地代码到容器
- 完整的开发依赖

### 生产构建

```bash
# 构建生产镜像
make build

# 运行生产容器
make prod
```

生产环境特性：
- 精简的运行时镜像
- 非 root 用户运行
- 内置健康检查
- 最小化镜像体积

## Docker 镜像构建阶段

### Stage 1: Dependencies
安装项目依赖，利用 Docker 缓存层加速后续构建。

### Stage 2: Builder
构建 Next.js 应用，生成 `.next` 目录。

### Stage 3: Production
生产运行时镜像，只包含必要文件。

### Stage 4: Development
开发环境镜像，包含完整开发工具和热重载。

## 环境变量

创建 `.env.production` 文件：

```bash
# API 配置
NEXT_PUBLIC_API_BASE_URL=https://api.example.com

# 应用配置
NEXT_PUBLIC_APP_URL=https://app.example.com

# OpenTelemetry 配置
OTEL_SERVICE_NAME=joyful-words-frontend
NEXT_PUBLIC_ENABLE_TELEMETRY=true

# 功能开关
NEXT_PUBLIC_FEATURE_IMAGE_GENERATION=doing
NEXT_PUBLIC_FEATURE_KNOWLEDGE_CARDS=doing
NEXT_PUBLIC_FEATURE_SEO_GEO=doing
```

## 常用命令

### 构建

```bash
# 标准构建
make build

# 多架构构建（AMD64 + ARM64）
make build-multi
```

### 运行

```bash
# 开发环境
make dev

# 生产环境（需要先设置环境变量）
make prod

# 指定环境文件运行
docker run -d \
  --name joyful-words \
  -p 3000:3000 \
  --env-file .env.production \
  joyful-words:latest
```

### 清理

```bash
# 停止并删除容器
make clean

# 或使用 docker-compose
docker-compose down -v
```

## 健康检查

容器启动后，可以通过以下方式检查健康状态：

```bash
# 检查容器健康状态
docker ps

# 手动调用健康检查接口
curl http://localhost:3000/api/health
```

## 生产部署建议

1. **使用环境变量管理敏感信息**
   ```bash
   docker run -e NEXT_PUBLIC_API_BASE_URL=https://api.example.com ...
   ```

2. **限制容器资源**
   ```bash
   docker run --memory="512m" --cpus="1" ...
   ```

3. **使用反向代理**
   推荐使用 Nginx 或 Caddy 作为反向代理

4. **日志管理**
   ```bash
   docker run --log-driver json-file --log-opt max-size=10m ...
   ```

5. **安全加固**
   - 使用非 root 用户（已配置）
   - 定期更新基础镜像
   - 扫描镜像漏洞

## 故障排查

### 构建失败

```bash
# 查看构建日志
docker build --target production -t joyful-words:latest . --progress=plain

# 清理缓存重新构建
docker builder prune -a
```

### 容器无法启动

```bash
# 查看容器日志
docker logs joyful-words

# 进入容器调试
docker exec -it joyful-words sh
```

### 开发环境热重载不工作

确保 `docker-compose.yml` 中正确配置了 volume 挂载。
