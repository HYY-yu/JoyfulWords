# Tally.so 反馈收集功能

## 功能描述

全局悬浮反馈按钮，用户可以在任何页面快速提交反馈和需求建议。

## 技术实现

- **库**: react-tally
- **加载策略**: 懒加载（首次点击时加载）
- **用户信息**: 自动通过 URL hidden fields 传递
- **国际化**: 支持中英文切换

## 使用方法

1. 登录后，页面右下角会显示"反馈"按钮
2. 点击按钮打开反馈表单弹窗
3. 填写并提交反馈

## Hidden Fields

表单自动包含以下用户信息（隐藏字段）：
- `user_id`: 用户 ID
- `email`: 用户邮箱

## 配置

- **表单 ID**: Zj2jda
- **组件位置**: `/components/feedback/`
- **集成位置**: `/app/layout.tsx`

## 组件结构

```
components/feedback/
├── tally-feedback-button.tsx    # 反馈按钮组件
├── feedback-error-boundary.tsx  # 错误边界
└── index.ts                     # 导出索引
```

## 特性

- ✅ 仅对已登录用户显示
- ✅ 懒加载 Tally 脚本（性能优化）
- ✅ 错误边界保护
- ✅ 支持中英文切换
- ✅ 适配 light/dark 主题
- ✅ 自动传递用户信息
- ✅ 弹窗模式（不跳转页面）

## 修改日期

- 2026-01-21: 初始实现
