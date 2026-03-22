# 素材搜索拆分为"搜索"和"素材库"两个独立 Tab

## 背景

当前"素材搜索"主 tab 内包含搜索栏、素材库子 tab、生成记录子 tab。用户希望将搜索和素材库拆分为两个独立的主 tab，使职责更清晰。

## 设计

### 主 Tab 结构

5 个主 tab，顺序如下：

1. **搜索** (search)
2. **素材库** (materialLibrary)
3. **竞品跟踪** (competitorTracking)
4. **文章撰写** (articleWriting)
5. **文章管理** (articleManager)

### 搜索 Tab

从现有 `MaterialSearch` 组件中提取搜索相关功能。

**结构：**
- 顶部：三个分类 tab（资料/新闻/图片），复用现有 `MaterialSearchBar` 的分类切换
- 中部：搜索输入框 + 搜索按钮
- 下部：生成记录列表，复用 `MaterialLogTable`

**交互流程：**
1. 选择分类 tab → 输入关键词 → 点击搜索
2. 触发异步搜索 API
3. 自动展示生成记录，3 秒轮询状态更新
4. 搜索完成后素材自动进入素材库

**组件：** 新建 `components/materials/material-search-tab.tsx`
- 复用 `MaterialSearchBar`（搜索栏 + 分类 tab）
- 复用 `MaterialLogTable`（生成记录）
- 使用 `useMaterials` hook 中的搜索和日志相关逻辑

### 素材库 Tab

从现有 `MaterialSearch` 组件中提取素材库相关功能。

**结构：**
- 顶部：三个分类 tab（资料/新闻/图片），切换当前显示的素材类型
- 每个分类下：
  - 名称搜索输入框
  - 上传按钮（自动设定当前分类类型）
  - 素材列表（复用 `MaterialTable`，预设 type 筛选为当前分类）
  - 分页

**组件：** 新建 `components/materials/material-library-tab.tsx`
- 复用 `MaterialTable`（素材列表）
- 复用 `MaterialDialogs`（编辑/删除/上传对话框）
- 使用 `useMaterials` hook 中的素材列表相关逻辑
- 上传时自动绑定当前分类类型

### 需要修改的文件

1. **`components/content-writing.tsx`** — 主 tab 配置
   - 将 `materialSearch` tab 替换为 `search` 和 `materialLibrary` 两个 tab
   - 更新 tab 配置数组和对应的渲染逻辑

2. **新建 `components/materials/material-search-tab.tsx`** — 搜索 tab 组件
   - 从 `material-search.tsx` 提取搜索 + 生成记录逻辑

3. **新建 `components/materials/material-library-tab.tsx`** — 素材库 tab 组件
   - 从 `material-search.tsx` 提取素材库逻辑
   - 添加分类 tab 切换，切换时更新 type 筛选参数
   - 上传按钮自动绑定当前分类

4. **`lib/i18n/locales/zh.ts`** — 中文翻译
   - 添加新的 tab 名称键值
   - 添加素材库分类 tab 相关翻译

5. **`lib/i18n/locales/en.ts`** — 英文翻译
   - 同步添加对应英文翻译

6. **`components/materials/material-search.tsx`** — 可能删除或保留作为旧引用
   - 功能已拆分到两个新组件，该文件可删除

### 不变的部分

- `lib/api/materials/` — API 客户端和类型定义不变
- `lib/hooks/use-materials.ts` — hook 逻辑不变
- `components/materials/material-search-bar.tsx` — 搜索栏组件复用
- `components/materials/material-table.tsx` — 素材表格组件复用
- `components/materials/material-log-table.tsx` — 生成记录表格复用
- `components/materials/material-dialogs.tsx` — 对话框组件复用
- `components/article/editor-material-panel.tsx` — 编辑器右侧面板不受影响

### i18n 新增键值

```
contentWriting.tabs.search: "搜索" / "Search"
contentWriting.tabs.materialLibrary: "素材库" / "Material Library"
```

现有 `contentWriting.tabs.materialSearch` 可移除。
