# 积分检查前端对接指南

本文档说明哪些 API 接口需要积分检查，以及前端如何处理积分不足的情况。

---

## 目录

- [需要积分检查的接口](#需要积分检查的接口)
- [积分不足响应格式](#积分不足响应格式)
- [前端处理建议](#前端处理建议)
- [示例代码](#示例代码)

---

## 需要积分检查的接口

以下接口在调用前会自动检查用户积分是否充足：

| 接口路径 | 方法 | 最低积分要求 | 功能说明 |
|---------|------|-------------|---------|
| `/materials/search` | POST | **40 积分** | 触发素材搜索（通过 n8n） |
| `/social/fetch` | POST | **10 积分** | 抓取社交媒体内容 |
| `/article/ai-write` | POST | **10 积分** | AI 生成文章 |
| `/article/edit` | POST | **10 积分** | AI 编辑文章 |

> **注意**: 这些接口需要在请求头中携带有效的 JWT Token（通过 `Authorization: Bearer <token>`）。

---

## 积分不足响应格式

当用户积分不足时，接口会返回 **HTTP 402 Payment Required** 状态码，响应体格式如下：

### 响应示例

```json
{
  "error": "积分余额不足",
  "data": {
    "current_credits": 25,           // 用户当前积分
    "required_credits": 40,           // 操作所需积分
    "shortage_credits": 15,           // 缺少的积分数量
    "recommended_recharge": 500,      // 推荐充值金额（单位：分，即 $5.00）
    "recommended_recharge_usd": "5.00" // 推荐充值金额（USD 格式化显示）
  }
}
```

### 字段说明

| 字段 | 类型 | 说明 |
|-----|------|-----|
| `error` | string | 错误消息（已根据请求语言本地化） |
| `data.current_credits` | number | 用户当前积分余额 |
| `data.required_credits` | number | 执行该操作所需的最低积分 |
| `data.shortage_credits` | number | 缺少的积分数量 |
| `data.recommended_recharge` | number | 推荐充值金额（单位：分） |
| `data.recommended_recharge_usd` | string | 推荐充值金额（USD 格式，如 "5.00"） |

> **智能推荐逻辑**: 系统会自动计算合理的充值档位，最少推荐 $5.00，向上取整到最近的 $5 档位。

---

## 前端处理建议

### 1. 全局拦截器处理

在 Axios/Fetch 拦截器中统一处理 402 响应，避免在每个接口调用处重复处理。

### 2. 用户体验设计

当检测到 402 响应时，应该：

1. **阻止当前操作的后续流程**（不显示成功状态）
2. **弹窗提示用户**，显示以下信息：
   - 当前积分余额
   - 所需积分
   - 缺少的积分数量
   - 推荐充值金额
3. **提供跳转按钮**，引导用户到积分充值页面

### 3. 弹窗 UI 建议

```
┌─────────────────────────────────────┐
│         积分余额不足                 │
├─────────────────────────────────────┤
│                                     │
│  当前积分：25                        │
│  所需积分：40                        │
│  缺少积分：15                        │
│                                     │
│  建议充值：$5.00                    │
│                                     │
│  [ 前往充值 ]  [ 取消 ]              │
│                                     │
└─────────────────────────────────────┘
```

### 4. 充值页面跳转

跳转到充值页面后，可以：
- 预填充推荐充值金额（`recommended_recharge`）
- 高亮显示推荐的充值档位
- 简化充值流程

---

## 示例代码

### Axios 拦截器示例

```typescript
import axios from 'axios';

const api = axios.create({
  baseURL: process.env.API_BASE_URL,
});

// 响应拦截器
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const { status, data } = error.response || {};

    // 处理积分不足（402）
    if (status === 402 && data?.data) {
      showInsufficientCreditsModal(data.data);
      return Promise.reject(error);
    }

    // 其他错误处理...
    return Promise.reject(error);
  }
);

// 显示积分不足弹窗
function showInsufficientCreditsModal(data: {
  current_credits: number;
  required_credits: number;
  shortage_credits: number;
  recommended_recharge_usd: string;
}) {
  // 使用你的弹窗组件（如 Ant Design Modal, Element Plus Dialog 等）
  Modal.warning({
    title: '积分余额不足',
    content: `
      当前积分：${data.current_credits}
      所需积分：${data.required_credits}
      缺少积分：${data.shortage_credits}

      建议充值：$${data.recommended_recharge_usd}
    `,
    okText: '前往充值',
    cancelText: '取消',
    onOk: () => {
      // 跳转到充值页面，可以传递推荐金额
      router.push({
        path: '/billing/recharge',
        query: {
          amount: data.recommended_recharge_usd,
        },
      });
    },
  });
}

export default api;
```

### React Hook 示例

```typescript
import { useModal } from '@/hooks/useModal';
import { useNavigate } from 'react-router-dom';

interface CreditsData {
  current_credits: number;
  required_credits: number;
  shortage_credits: number;
  recommended_recharge_usd: string;
}

export function useApiError() {
  const navigate = useNavigate();
  const { showModal } = useModal();

  const handleApiError = (error: any) => {
    if (error.response?.status === 402) {
      const data: CreditsData = error.response.data.data;
      handleInsufficientCredits(data);
    }
    // 其他错误处理...
  };

  const handleInsufficientCredits = (data: CreditsData) => {
    showModal({
      title: '积分余额不足',
      content: (
        <div>
          <p>当前积分：<strong>{data.current_credits}</strong></p>
          <p>所需积分：<strong>{data.required_credits}</strong></p>
          <p>缺少积分：<strong>{data.shortage_credits}</strong></p>
          <p>建议充值：<strong>${data.recommended_recharge_usd}</strong></p>
        </div>
      ),
      onConfirm: () => {
        navigate(`/billing/recharge?amount=${data.recommended_recharge_usd}`);
      },
      confirmText: '前往充值',
      cancelText: '取消',
    });
  };

  return { handleApiError };
}
```

### Vue 3 Composition API 示例

```vue
<script setup lang="ts">
import { useRouter } from 'vue-router';
import { ElMessageBox } from 'element-plus';

const router = useRouter();

interface CreditsData {
  current_credits: number;
  required_credits: number;
  shortage_credits: number;
  recommended_recharge_usd: string;
}

async function handleInsufficientCredits(data: CreditsData) {
  try {
    await ElMessageBox.confirm(
      `
        当前积分：${data.current_credits}<br/>
        所需积分：${data.required_credits}<br/>
        缺少积分：${data.shortage_credits}<br/>
        <strong>建议充值：$${data.recommended_recharge_usd}</strong>
      `,
      '积分余额不足',
      {
        confirmButtonText: '前往充值',
        cancelButtonText: '取消',
        type: 'warning',
        dangerouslyUseHTMLString: true,
      }
    );

    // 跳转到充值页面
    router.push({
      path: '/billing/recharge',
      query: {
        amount: data.recommended_recharge_usd,
      },
    });
  } catch {
    // 用户点击取消
  }
}
</script>
```

---

## 国际化支持

错误消息会根据请求的 `Accept-Language` 头自动本地化：

- **中文**: `积分余额不足`
- **英文**: `Insufficient credits balance`

前端无需处理错误消息的翻译，但弹窗中的其他文本需要根据项目国际化配置进行翻译。

---

## 充值页面建议

充值页面应该支持 URL 参数接收推荐金额：

```
/billing/recharge?amount=5.00
```

页面初始化时：
1. 读取 `amount` 参数
2. 自动选中对应的充值档位（如果有）
3. 或者预填充自定义金额输入框

---

## 测试建议

### 测试积分不足场景

1. **手动测试**:
   - 创建一个积分不足的测试账号
   - 调用需要积分的接口
   - 验证弹窗是否正确显示

2. **Mock 测试**:
   ```typescript
   // Mock 402 响应
   mockApi.post('/materials/search').reply(402, {
     error: '积分余额不足',
     data: {
       current_credits: 25,
       required_credits: 40,
       shortage_credits: 15,
       recommended_recharge: 500,
       recommended_recharge_usd: '5.00',
     },
   });
   ```

---

## 常见问题

### Q: 用户充值后是否需要重新发起请求？

**A**: 建议在充值成功后，引导用户重新点击按钮触发原操作，而不是自动重试。这样可以给用户更明确的控制感。

### Q: 如何避免重复弹窗？

**A**: 在拦截器中添加防抖逻辑，或者使用全局状态管理标记是否已有弹窗显示。

### Q: 推荐充值金额可以修改吗？

**A**: 用户可以自由选择任意充值金额，推荐金额仅作为参考。

---

## 相关文档

- [计费管理 API](../API_INDEX.md#计费管理-api-billing)
- [支付 API](../API_INDEX.md#支付-api-payment)
- [项目架构](../ARCHITECTURE.md)

---

**文档版本**: 1.0.0
**最后更新**: 2025-02-09
