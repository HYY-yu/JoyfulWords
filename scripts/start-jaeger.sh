#!/bin/bash

# Jaeger 启动脚本 - 用于本地开发环境的 OpenTelemetry 追踪
#
# 使用方法:
#   ./scripts/start-jaeger.sh
#
# 访问 Jaeger UI: http://localhost:16686

set -e

CONTAINER_NAME="joyful-words-jaeger"

echo "🔍 检查 Jaeger 容器状态..."

if [ "$(docker ps -q -f name=$CONTAINER_NAME)" ]; then
  echo "✅ Jaeger 已经在运行"
  echo "📊 访问 UI: http://localhost:16686"
  exit 0
fi

if [ "$(docker ps -aq -f name=$CONTAINER_NAME)" ]; then
  echo "🔄 启动已存在的 Jaeger 容器..."
  docker start $CONTAINER_NAME
else
  echo "🚀 启动新的 Jaeger 容器..."
  docker run -d \
    --name $CONTAINER_NAME \
    -e COLLECTOR_OTLP_ENABLED=true \
    -p 16686:16686 \
    -p 4318:4318 \
    jaegertracing/all-in-one:latest
fi

echo ""
echo "✅ Jaeger 启动成功!"
echo ""
echo "📊 Jaeger UI: http://localhost:16686"
echo "📡 OTLP Endpoint: http://localhost:4318/v1/traces"
echo ""
echo "💡 使用 Ctrl+C 停止此脚本,容器会继续运行"
echo "   停止容器: docker stop $CONTAINER_NAME"
echo "   删除容器: docker rm $CONTAINER_NAME"
echo ""

# 等待 Jaeger 启动
echo "⏳ 等待 Jaeger 准备就绪..."
until curl -s http://localhost:16686 > /dev/null 2>&1; do
  sleep 1
done

echo "✅ Jaeger 已就绪! 开始追踪吧 🎯"
