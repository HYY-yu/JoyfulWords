"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { useTranslation } from "@/lib/i18n/i18n-context"
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartLegend,
  ChartLegendContent,
} from "@/components/ui/chart"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, PieChart, Pie, Cell, AreaChart, Area, ResponsiveContainer } from "recharts"
import { TrendingUp, Users, BarChart3, Target } from "lucide-react"
import { mockSearchVolumeData, mockDifficultyDistribution, mockCompetitorData } from "./mock-data"

const COLORS = [
  "hsl(var(--chart-1))",
  "hsl(var(--chart-2))",
  "hsl(var(--chart-3))",
  "hsl(var(--chart-4))",
  "hsl(var(--chart-5))",
]

export function KeywordInsights() {
  const { t } = useTranslation()

  const chartConfig = {
    desktop: {
      label: "Desktop",
      color: "hsl(var(--chart-2))",
    },
    mobile: {
      label: "Mobile",
      color: "hsl(var(--chart-1))",
    },
    difficulty: {
      label: t("seoGeo.insights.difficultyTitle"),
    },
    competitor: {
      label: t("seoGeo.insights.competitorTitle"),
    },
  } as const

  return (
    <div className="space-y-6">
      {/* 搜索量趋势 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            {t("seoGeo.insights.searchTrendTitle")}
          </CardTitle>
          <CardDescription>
            {t("seoGeo.insights.searchTrendDesc")}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ChartContainer config={chartConfig} className="h-[300px] w-full">
            <AreaChart data={mockSearchVolumeData}>
              <CartesianGrid vertical={false} />
              <XAxis
                dataKey="month"
                tickLine={false}
                axisLine={false}
                tickMargin={8}
              />
              <YAxis tickLine={false} axisLine={false} />
              <ChartTooltip content={<ChartTooltipContent />} />
              <ChartLegend content={<ChartLegendContent />} />
              <Area
                type="monotone"
                dataKey="mobile"
                stackId="a"
                stroke="var(--color-mobile)"
                fill="var(--color-mobile)"
                fillOpacity={0.6}
              />
              <Area
                type="monotone"
                dataKey="desktop"
                stackId="a"
                stroke="var(--color-desktop)"
                fill="var(--color-desktop)"
                fillOpacity={0.6}
              />
            </AreaChart>
          </ChartContainer>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* 难度分布 */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              {t("seoGeo.insights.difficultyTitle")}
            </CardTitle>
            <CardDescription>
              {t("seoGeo.insights.difficultyDesc")}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ChartContainer config={chartConfig} className="h-[250px] w-full">
              <PieChart>
                <Pie
                  data={mockDifficultyDistribution}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ range, percentage }) => `${range}: ${percentage}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="count"
                >
                  {mockDifficultyDistribution.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <ChartTooltip content={<ChartTooltipContent />} />
              </PieChart>
            </ChartContainer>
          </CardContent>
        </Card>

        {/* 竞争对手分析 */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              {t("seoGeo.insights.competitorTitle")}
            </CardTitle>
            <CardDescription>
              {t("seoGeo.insights.competitorDesc")}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ChartContainer config={chartConfig} className="h-[250px] w-full">
              <BarChart data={mockCompetitorData}>
                <CartesianGrid vertical={false} />
                <XAxis
                  dataKey="name"
                  tickLine={false}
                  axisLine={false}
                  tickMargin={8}
                  angle={-45}
                  textAnchor="end"
                  height={80}
                />
                <YAxis tickLine={false} axisLine={false} />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Bar dataKey="visibility" fill="hsl(var(--chart-1))" radius={4} />
              </BarChart>
            </ChartContainer>
          </CardContent>
        </Card>
      </div>

      {/* 关键指标汇总 */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">{t("seoGeo.insights.stats.totalKeywords")}</p>
                <p className="text-2xl font-bold">1,247</p>
                <p className="text-xs text-muted-foreground mt-1">
                  <span className="text-green-600">↑ 12%</span> {t("seoGeo.insights.stats.vsLastMonth")}
                </p>
              </div>
              <Target className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">{t("seoGeo.insights.stats.avgSearchVolume")}</p>
                <p className="text-2xl font-bold">8,430</p>
                <p className="text-xs text-muted-foreground mt-1">
                  <span className="text-green-600">↑ 8%</span> {t("seoGeo.insights.stats.vsLastMonth")}
                </p>
              </div>
              <TrendingUp className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">{t("seoGeo.insights.stats.avgDifficulty")}</p>
                <p className="text-2xl font-bold">52.3</p>
                <p className="text-xs text-muted-foreground mt-1">
                  <span className="text-orange-600">→ </span> {t("seoGeo.insights.stats.vsLastMonth")}
                </p>
              </div>
              <BarChart3 className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">{t("seoGeo.insights.stats.estTraffic")}</p>
                <p className="text-2xl font-bold">45.2K</p>
                <p className="text-xs text-muted-foreground mt-1">
                  <span className="text-green-600">↑ 23%</span> {t("seoGeo.insights.stats.vsLastMonth")}
                </p>
              </div>
              <Users className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 说明文字 */}
      <div className="text-sm text-muted-foreground bg-muted/30 p-4 rounded-lg">
        <p className="mb-2">
          <strong>{t("seoGeo.insights.dataDescTitle")}</strong>
        </p>
        <ul className="space-y-1 list-disc list-inside">
          {Array.isArray(t("seoGeo.insights.dataDescItems")) && 
            t("seoGeo.insights.dataDescItems").map((item: string, idx: number) => (
              <li key={idx}>{item}</li>
            ))}
        </ul>
      </div>
    </div>
  )
}