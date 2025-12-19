"use client"

import { useState } from "react"
import { useTranslation } from "@/lib/i18n/i18n-context"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Loader2, Search } from "lucide-react"
import { mockAnalysisReports } from "./mock-data"
import type { KeywordAnalysis as KeywordAnalysisType } from "./types"

interface KeywordAnalysisProps {
  onAnalysisComplete?: (result: KeywordAnalysisType) => void
}

export function KeywordAnalysis({ onAnalysisComplete }: KeywordAnalysisProps) {
  const { t, locale } = useTranslation()
  const [keyword, setKeyword] = useState("")
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [analysis, setAnalysis] = useState<KeywordAnalysisType | null>(null)

  const handleAnalyze = async () => {
    if (!keyword.trim()) return

    setIsAnalyzing(true)

    // 模拟API调用延迟
    await new Promise(resolve => setTimeout(resolve, 2000))

    // 获取mock数据或生成默认分析
    const report = mockAnalysisReports[keyword] || generateDefaultAnalysis(keyword)

    const result = {
      keyword,
      report,
      analyzedAt: new Date()
    }

    setAnalysis(result)
    setIsAnalyzing(false)

    // 通知父组件分析完成
    if (onAnalysisComplete) {
      onAnalysisComplete(result)
    }
  }

  const generateDefaultAnalysis = (kw: string): string => {
    return `## 关键词深度分析报告

### 基础指标
- **关键词**: ${kw}
- **月搜索量**: ${Math.floor(Math.random() * 10000) + 1000}
- **竞争难度**: ${Math.floor(Math.random() * 60) + 40}/100
- **搜索趋势**: 稳定增长
- **CPC预估**: ¥${(Math.random() * 10 + 5).toFixed(2)}-${(Math.random() * 10 + 15).toFixed(2)}

### 用户意图分析
1. **信息获取** (45%): 用户希望了解相关信息
2. **产品/服务寻找** (35%): 寻找具体的解决方案
3. **比较研究** (15%): 对比不同选项
4. **其他** (5%): 包括品牌搜索等

### 优化建议
1. **内容策略**
   - 创建高质量的原创内容
   - 提供详细的解决方案
   - 使用相关的长尾关键词

2. **技术优化**
   - 优化页面标题和描述
   - 提升网站加载速度
   - 确保移动端适配

3. **用户体验**
   - 清晰的导航结构
   - 相关的内部链接
   - 丰富的媒体内容

### 注意事项
- 该分析基于模拟数据
- 实际效果可能因地区、时间等因素而异
- 建议结合多个工具进行综合分析
`
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      handleAnalyze()
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        <div className="flex-1">
          <Label htmlFor="keyword-input" className="sr-only">
            关键词
          </Label>
          <Input
            id="keyword-input"
            placeholder={t("seoGeo.searchInputPlaceholder")}
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            onKeyPress={handleKeyPress}
            className="text-base"
          />
        </div>
        <Button
          onClick={handleAnalyze}
          disabled={!keyword.trim() || isAnalyzing}
          size="default"
          className="px-6"
        >
          {isAnalyzing ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              {t("seoGeo.analyzingBtn")}
            </>
          ) : (
            <>
              <Search className="mr-2 h-4 w-4" />
              {t("seoGeo.analyzeBtn")}
            </>
          )}
        </Button>
      </div>

      {analysis && (
        <Card className="mt-6">
          <CardContent className="p-6">
            <div className="mb-4">
              <h3 className="text-lg font-semibold mb-2">
                {t("seoGeo.keywordLabel")}{analysis.keyword}
              </h3>
              <p className="text-sm text-muted-foreground">
                {t("seoGeo.analyzedAtLabel")}{analysis.analyzedAt.toLocaleString(locale === 'zh' ? 'zh-CN' : 'en-US')}
              </p>
            </div>
            <div className="prose prose-sm max-w-none dark:prose-invert">
              <Textarea
                value={analysis.report}
                readOnly
                className="min-h-[400px] resize-none font-mono text-sm leading-relaxed"
                style={{ whiteSpace: 'pre-wrap' }}
              />
            </div>
          </CardContent>
        </Card>
      )}

      {!analysis && !isAnalyzing && (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Search className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">{t("seoGeo.startAnalysisTitle")}</h3>
            <p className="text-muted-foreground text-center max-w-md">
              {t("seoGeo.startAnalysisDesc")}
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}