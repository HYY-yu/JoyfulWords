import { KeywordRecommendation, SearchVolumeData, DifficultyDistribution, CompetitorData } from './types';

export const mockKeywordRecommendations: KeywordRecommendation[] = [
  {
    rank: 1,
    keyword: "内容创作工具",
    msv: 12000,
    difficulty: 65,
    rating: 5,
    advantage: "搜索量高，竞争适中",
    analysis: "这是一个高价值的关键词，月搜索量达到12,000，虽然有一定竞争度，但仍然有很大的优化空间。建议结合长尾关键词策略，如'AI内容创作工具'、'免费内容创作工具'等。"
  },
  {
    rank: 2,
    keyword: "AI写作助手",
    msv: 8500,
    difficulty: 72,
    rating: 5,
    advantage: "增长迅速，商业价值高",
    analysis: "AI写作助手是当前热门话题，搜索量持续增长。虽然竞争激烈，但由于商业转化率高，值得投入。建议重点突出产品的独特功能，如'中文优化'、'多场景适用'等。"
  },
  {
    rank: 3,
    keyword: "文章生成器",
    msv: 6800,
    difficulty: 58,
    rating: 4,
    advantage: "难度适中，转化率高",
    analysis: "该关键词竞争度相对较低，但搜索量稳定。适合作为核心关键词之一。可以通过内容营销和产品功能展示来提升排名。"
  },
  {
    rank: 4,
    keyword: "博客写作软件",
    msv: 5200,
    difficulty: 45,
    rating: 4,
    advantage: "精准定位，竞争小",
    analysis: "这是一个细分市场的关键词，虽然搜索量不是最高，但用户意图明确，转化率较高。竞争度较低，容易获得较好的排名。"
  },
];

export const mockSearchVolumeData: SearchVolumeData[] = [
  { month: "2024-01", desktop: 3200, mobile: 5400 },
  { month: "2024-02", desktop: 3500, mobile: 5800 },
  { month: "2024-03", desktop: 3800, mobile: 6200 },
  { month: "2024-04", desktop: 3600, mobile: 6800 },
  { month: "2024-05", desktop: 4000, mobile: 7200 },
  { month: "2024-06", desktop: 4200, mobile: 7600 },
  { month: "2024-07", desktop: 4500, mobile: 8200 },
  { month: "2024-08", desktop: 4800, mobile: 8800 },
  { month: "2024-09", desktop: 5200, mobile: 9400 },
  { month: "2024-10", desktop: 5600, mobile: 10000 },
  { month: "2024-11", desktop: 6000, mobile: 10800 },
  { month: "2024-12", desktop: 6500, mobile: 11500 }
];

export const mockDifficultyDistribution: DifficultyDistribution[] = [
  { range: "0-20 (简单)", count: 15, percentage: 12.5 },
  { range: "21-40 (较易)", count: 30, percentage: 25.0 },
  { range: "41-60 (中等)", count: 45, percentage: 37.5 },
  { range: "61-80 (较难)", count: 25, percentage: 20.8 },
  { range: "81-100 (极难)", count: 5, percentage: 4.2 }
];

export const mockCompetitorData: CompetitorData[] = [
  { name: "竞争对手 A", visibility: 85, keywords: 1250, traffic: 45000 },
  { name: "竞争对手 B", visibility: 72, keywords: 980, traffic: 38000 },
  { name: "竞争对手 C", visibility: 68, keywords: 850, traffic: 32000 },
  { name: "竞争对手 D", visibility: 55, keywords: 620, traffic: 24000 },
  { name: "您的网站", visibility: 35, keywords: 320, traffic: 12000 }
];

export const mockAnalysisReports: Record<string, string> = {
  "内容创作工具": `## 关键词深度分析报告

### 基础指标
- **月搜索量**: 12,000
- **竞争难度**: 65/100 (中等偏上)
- **搜索趋势**: 稳定增长
- **CPC预估**: ¥8.50-15.20

### 用户意图分析
1. **工具寻找** (40%): 用户正在寻找合适的内容创作工具
2. **功能对比** (30%): 在不同工具间进行比较
3. **学习了解** (20%): 了解内容创作的相关知识
4. **其他** (10%): 包括品牌搜索等

### 优化建议
1. **内容策略**
   - 创建详细的工具对比文章
   - 提供使用教程和最佳实践
   - 分享成功案例和用户评价

2. **技术优化**
   - 优化页面加载速度
   - 确保移动端友好性
   - 使用结构化数据标记

3. **外链建设**
   - 与相关博客建立合作关系
   - 参与行业论坛讨论
   - 创建可分享的资源内容

### 竞争格局
目前排名前5的网站都具备：
- 强大的域名权威度
- 深度的内容覆盖
- 良好的用户体验
- 持续的内容更新

### 预期成果
通过3-6个月的持续优化，预计：
- 进入前20名: 2-3个月
- 进入前10名: 4-6个月
- 流量提升: 300-500%
`
};