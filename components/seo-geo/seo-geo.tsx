"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Search, TrendingUp, BarChart3 } from "lucide-react"
import { KeywordAnalysis } from "./keyword-analysis"
import { KeywordRecommendations } from "./keyword-recommendations"
import { KeywordInsights } from "./keyword-insights"
import { KeywordAnalysis as KeywordAnalysisType } from "./types"

import { useTranslation } from "@/lib/i18n/i18n-context"
// ...
export function SeoGeo() {
  const { t } = useTranslation()
  const [analysisResult, setAnalysisResult] = useState<KeywordAnalysisType | null>(null)
  const [showResults, setShowResults] = useState(false)

  const handleAnalysisComplete = (result: KeywordAnalysisType) => {
    setAnalysisResult(result)
    setShowResults(true)
  }

  return (
    <main className="flex-1 overflow-auto flex flex-col">
      {/* 标题栏 - 与其他模块保持一致 */}
      <header className="border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-10">
        <div className="px-8 py-6">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary/10">
              <Search className="w-6 h-6 text-primary" />
            </div>
            <div>
              <h2 className="text-2xl font-semibold text-foreground">{t("seoGeo.title")}</h2>
              <p className="text-sm text-muted-foreground mt-0.5">{t("seoGeo.subtitle")}</p>
            </div>
          </div>
        </div>
      </header>

      <div className="flex-1 px-8 py-6 space-y-6">
        {/* 关键词分析部分 */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Search className="h-5 w-5" />
              {t("seoGeo.analysisTitle")}
            </CardTitle>
            <CardDescription>
              {t("seoGeo.analysisDesc")}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <KeywordAnalysis onAnalysisComplete={handleAnalysisComplete} />
          </CardContent>
        </Card>

        {/* 分析结果部分 - 只在分析完成后显示 */}
        {showResults && analysisResult && (
          <>
            {/* 推荐关键词 - 上面 */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5" />
                  {t("seoGeo.recommendationTitle")} (Keyword: &quot;{analysisResult.keyword}&quot;)
                </CardTitle>
                <CardDescription>
                  {t("seoGeo.recommendationDesc")}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <KeywordRecommendations baseKeyword={analysisResult.keyword} />
              </CardContent>
            </Card>

            {/* 关键词洞察 - 下面 */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5" />
                  {t("seoGeo.insightTitle")} (Keyword: &quot;{analysisResult.keyword}&quot;)
                </CardTitle>
                <CardDescription>
                  {t("seoGeo.insightDesc")}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <KeywordInsights />
              </CardContent>
            </Card>
          </>
        )}
      </div>
    </main>
  )
}