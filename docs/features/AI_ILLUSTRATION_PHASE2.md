# AI 插图第二阶段：按尺寸生成封面

入口：文章详情 → AI 工作室 → AI 插图 → 封面。

- 开始即选择尺寸和标题位置（居中、居上、居下）。生成提交 output_preset。
- 单次生成只面向当前比例，标题字形由 AI 设计并绘制；核心内容位于当前画布中央 50%。
- Worker 保存单张模型输出，前端 cover-preview.tsx 通过 image-proxy 加载、Canvas 居中裁切到精确像素。
- 只展示最终图，下载相同 PNG；没有原图对照或裁切修复入口。
- 尺寸切换保留旧预览并覆盖 loading 蒙版，直到新 PNG 完成加载。过期异步结果取消，失败可刷新，处理中禁止下载。
- 预览尺寸切换不计费；重新生成按当前尺寸重新构图、展示接口单价、使用新幂等键。
- 历史版本切换恢复生成时尺寸/标题位置，历史数据在迁移中统一为单图格式。
- 所有文案提供中英文。信息图、配图本阶段未启用。

后端快照 version=2，结果使用 result.image_url。

验证：pnpm exec tsc --noEmit；pnpm lint；pnpm exec tsx --test lib/api/illustrations/crop-geometry.test.ts。

后端 v65 已统一历史数据为 output_preset + image_url/width/height；前端不再维护 mother_url/crops 兼容分支。升级时先完成旧生成任务并执行迁移，再部署新 API/Worker。
