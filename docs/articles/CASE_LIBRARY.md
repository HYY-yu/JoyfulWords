# 文章管理案例库

文章管理 `/articles` 的个人文章筛选栏上方只显示当前选中设计风格的一篇已发布案例。复用顶部设计选择器已保存的偏好及 `illustration-design-changed` 事件，切换后同步更新，不添加第二套选择器。未设置偏好时沿用默认 `minimal-business`；没有对应案例时显示空状态，不展示其他风格。

入口采用横版布局，左侧封面、右侧风格名、标题、简介和阅读入口，手机保持横向排布。

点击进入 `/articles/cases/[slug]` 阅读快照。此页面只读：正文、配套图片、可展开的素材列表，以及可编辑 PPT 下载。不调用私人文章详情或编辑 API，不复制案例，不更改用户默认设计。

## API 合同

- `GET /api/v1/cases` 返回 `{ items: CaseSummary[] }`。
- `GET /api/v1/cases/:slug` 返回卡片字段及 `articles`、`materials`、`artifacts`。
- 使用现有登录会话与自动刷新；所有登录用户可看 `published` 案例，草稿/归档返回 404。
- 发现标题/摘要及界面支持中英文；正文无对应语言时显示已有原文，不伪造翻译。
- API 失败显示重试，空库显示准备中；页面不填充虚假案例。

## 内容渲染

HTML 正文转为白名单 React 元素，不执行原始 HTML，不透传事件属性、脚本、嵌入式内容或样式。Markdown 使用现有 ReactMarkdown。资产和来源链接只接受 HTTP(S)。真实生成的图片使用远程稳定地址，PPT 链接指向实际 PPTX。

`CaseShowcase` 为列表入口；`CaseContent` 为只读正文；API 类型及客户端在 `lib/api/cases/client.ts`。发布条件和来源校验由后端案例发布工具负责。

## 验证

```sh
pnpm exec tsc --noEmit
pnpm lint
node --import tsx --test lib/api/cases/client.test.ts
```

浏览器验收应覆盖风格切换后仅显示对应案例、详情正文/素材/PPT、中英切换、手机横版布局和未发布 slug 的 404 提示。
