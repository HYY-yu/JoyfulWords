# Tally.so Hidden Fields 配置

## 表单信息
- 表单 ID: Zj2jda
- 用途: 收集用户反馈和需求

## Hidden Fields
1. **user_id**: 用户 ID (来自 AuthContext.user.id)
2. **email**: 用户邮箱 (来自 AuthContext.user.email)

## URL 参数示例
```
https://tally.so/Zj2jda?user_id=123&email=user@example.com
```

## 配置步骤

### 1. 登录 Tally.so
访问：https://tally.so/login

### 2. 打开表单编辑器
选择表单 ID 为 `Zj2jda` 的表单，进入编辑模式

### 3. 添加 Hidden Fields

1. 点击 "Add a question" 按钮
2. 选择 "Hidden field" 类型
3. 创建第一个 hidden field：
   - Field Key: `user_id`
   - Label: "User ID"
4. 创建第二个 hidden field：
   - Field Key: `email`
   - Label: "User Email"

### 4. 保存并发布表单
点击右上角的 "Publish" 按钮

### 5. 验证 Hidden Fields 配置
在浏览器中访问：
```
https://tally.so/Zj2jda?user_id=123&email=test@example.com
```

检查表单是否自动填充了这些值（hidden fields 不会在表单中显示，但会在提交时包含）

## 代码实现

在 `TallyFeedbackButton` 组件中，用户信息通过 `useTallyPopup` 的 `open` 方法传递：

```typescript
open({
  user_id: user?.id ? String(user.id) : '',
  email: user?.email || '',
})
```

这样当用户打开反馈表单时，`user_id` 和 `email` 会自动作为隐藏字段提交。

## 修改日期
- 2026-01-21: 初始配置
