"use client"

import { useState } from "react"
import { useTranslation } from "@/lib/i18n/i18n-context"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Card, CardContent } from "@/components/ui/card"
import { Star, TrendingUp, Eye } from "lucide-react"
import { KeywordRecommendation } from "./types"
import { mockKeywordRecommendations } from "./mock-data"

interface KeywordRecommendationsProps {
  baseKeyword?: string
}

function StarRating({ rating }: { rating: number }) {
  return (
    <div className="flex items-center gap-1">
      {[1, 2, 3, 4, 5].map((star) => (
        <Star
          key={star}
          className={`h-4 w-4 ${
            star <= rating
              ? "fill-yellow-400 text-yellow-400"
              : "fill-gray-200 text-gray-200 dark:fill-gray-700 dark:text-gray-700"
          }`}
        />
      ))}
      <span className="ml-1 text-sm text-muted-foreground">({rating}/5)</span>
    </div>
  )
}

export function KeywordRecommendations({ baseKeyword }: KeywordRecommendationsProps) {
  const { t } = useTranslation()
  const [selectedKeyword, setSelectedKeyword] = useState<KeywordRecommendation | null>(null)

  const getDifficultyText = (diff: number) => {
    if (diff <= 30) return t("seoGeo.recommendations.difficultyLevels.easy")
    if (diff <= 50) return t("seoGeo.recommendations.difficultyLevels.quiteEasy")
    if (diff <= 70) return t("seoGeo.recommendations.difficultyLevels.medium")
    return t("seoGeo.recommendations.difficultyLevels.hard")
  }

  function DifficultyBadge({ difficulty }: { difficulty: number }) {
    const getDifficultyColor = (diff: number) => {
      if (diff <= 30) return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
      if (diff <= 50) return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200"
      if (diff <= 70) return "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200"
      return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200"
    }

    return (
      <Badge className={getDifficultyColor(difficulty)}>
        {difficulty} - {getDifficultyText(difficulty)}
      </Badge>
    )
  }

  return (
    <div className="space-y-4">
      {/* 关键词推荐表格 - 使用与素材列表相同的样式 */}
      <div className="border border-border rounded-lg overflow-hidden">
        <table className="w-full">
          <thead className="bg-muted/50 border-b border-border">
            <tr>
              <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground w-16">{t("seoGeo.recommendations.table.rank")}</th>
              <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">{t("seoGeo.recommendations.table.keyword")}</th>
              <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground w-24">{t("seoGeo.recommendations.table.msv")}</th>
              <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground w-24">{t("seoGeo.recommendations.table.difficulty")}</th>
              <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground w-32">{t("seoGeo.recommendations.table.rating")}</th>
              <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">{t("seoGeo.recommendations.table.advantage")}</th>
              <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground w-24 text-center">{t("seoGeo.recommendations.table.actions")}</th>
            </tr>
          </thead>
          <tbody>
            {mockKeywordRecommendations.map((item) => (
              <tr key={item.rank} className="border-b border-border last:border-b-0 hover:bg-muted/30">
                <td className="py-3 px-4 text-sm">
                  <span className="font-medium">#{item.rank}</span>
                </td>
                <td className="py-3 px-4 text-sm font-medium">{item.keyword}</td>
                <td className="py-3 px-4 text-sm">{item.msv.toLocaleString()}</td>
                <td className="py-3 px-4 text-sm">
                  <DifficultyBadge difficulty={item.difficulty} />
                </td>
                <td className="py-3 px-4 text-sm">
                  <StarRating rating={item.rating} />
                </td>
                <td className="py-3 px-4 text-sm text-muted-foreground max-w-md">
                  <div className="line-clamp-2">{item.advantage}</div>
                </td>
                <td className="py-3 px-4 text-sm text-center">
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setSelectedKeyword(item)}
                        className="h-8 px-3"
                      >
                        <Eye className="h-3.5 w-3.5 mr-1" />
                        {t("common.preview")}
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
                      <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                          <TrendingUp className="h-5 w-5" />
                          {t("seoGeo.recommendations.dialog.title")}{item.keyword}
                        </DialogTitle>
                      </DialogHeader>
                      <div className="space-y-4 mt-4">
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                          <Card>
                            <CardContent className="p-4 text-center">
                              <p className="text-2xl font-bold text-primary">#{item.rank}</p>
                              <p className="text-sm text-muted-foreground">{t("seoGeo.recommendations.table.rank")}</p>
                            </CardContent>
                          </Card>
                          <Card>
                            <CardContent className="p-4 text-center">
                              <p className="text-2xl font-bold text-primary">{item.msv.toLocaleString()}</p>
                              <p className="text-sm text-muted-foreground">{t("seoGeo.recommendations.dialog.msvLabel")}</p>
                            </CardContent>
                          </Card>
                          <Card>
                            <CardContent className="p-4 text-center">
                              <p className="text-2xl font-bold text-primary">{item.difficulty}</p>
                              <p className="text-sm text-muted-foreground">{t("seoGeo.recommendations.dialog.difficultyLabel")}</p>
                            </CardContent>
                          </Card>
                          <Card>
                            <CardContent className="p-4 text-center">
                              <div className="flex justify-center">
                                <StarRating rating={item.rating} />
                              </div>
                              <p className="text-sm text-muted-foreground mt-1">{t("seoGeo.recommendations.table.rating")}</p>
                            </CardContent>
                          </Card>
                        </div>

                          <div className="space-y-3">
                            <div>
                              <h4 className="font-semibold mb-2">{t("seoGeo.recommendations.table.advantage")}</h4>
                              <p className="text-sm text-muted-foreground bg-muted/50 p-3 rounded">
                                {item.advantage}
                              </p>
                            </div>
  
                            <div>
                              <h4 className="font-semibold mb-2">{t("seoGeo.analysisTitle")}</h4>
                            <Card>
                              <CardContent className="p-4">
                                <div className="prose prose-sm max-w-none dark:prose-invert">
                                  <p className="text-sm leading-relaxed whitespace-pre-wrap">
                                    {item.analysis}
                                  </p>
                                </div>
                              </CardContent>
                            </Card>
                          </div>
                        </div>
                      </div>
                    </DialogContent>
                  </Dialog>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="text-sm text-muted-foreground bg-muted/30 p-4 rounded-lg">
        <p className="mb-2">
          <strong>{t("seoGeo.recommendations.notesTitle")}</strong>
        </p>
        <ul className="space-y-1 list-disc list-inside">
          {Array.isArray(t("seoGeo.recommendations.notesItems")) && 
            t("seoGeo.recommendations.notesItems").map((item: string, idx: number) => (
              <li key={idx}>{item}</li>
            ))}
        </ul>
      </div>
    </div>
  )
}