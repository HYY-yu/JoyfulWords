"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
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

const chartConfig = {
  desktop: {
    label: "桌面端",
    color: "hsl(var(--chart-2))",
  },
  mobile: {
    label: "移动端",
    color: "hsl(var(--chart-1))",
  },
  difficulty: {
    label: "难度分布",
  },
  competitor: {
    label: "竞争对手分析",
  },
} as const

const COLORS = [
  "hsl(var(--chart-1))",
  "hsl(var(--chart-2))",
  "hsl(var(--chart-3))",
  "hsl(var(--chart-4))",
  "hsl(var(--chart-5))",
]

export function KeywordInsights() {
  return (
    <div className="space-y-6">
      {/* 搜索量趋势 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            关键词搜索量趋势
          </CardTitle>
          <CardDescription>
            过去12个月的搜索量变化趋势
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
              关键词难度分布
            </CardTitle>
            <CardDescription>
              不同难度等级的关键词数量分布
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
              竞争对手分析
            </CardTitle>
            <CardDescription>
              主要竞争对手的SEO表现对比
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
                <p className="text-sm font-medium text-muted-foreground">总关键词数</p>
                <p className="text-2xl font-bold">1,247</p>
                <p className="text-xs text-muted-foreground mt-1">
                  <span className="text-green-600">↑ 12%</span> 较上月
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
                <p className="text-sm font-medium text-muted-foreground">平均搜索量</p>
                <p className="text-2xl font-bold">8,430</p>
                <p className="text-xs text-muted-foreground mt-1">
                  <span className="text-green-600">↑ 8%</span> 较上月
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
                <p className="text-sm font-medium text-muted-foreground">平均难度</p>
                <p className="text-2xl font-bold">52.3</p>
                <p className="text-xs text-muted-foreground mt-1">
                  <span className="text-orange-600">→ 持平</span> 较上月
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
                <p className="text-sm font-medium text-muted-foreground">预估流量</p>
                <p className="text-2xl font-bold">45.2K</p>
                <p className="text-xs text-muted-foreground mt-1">
                  <span className="text-green-600">↑ 23%</span> 较上月
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
          <strong>数据说明:</strong>
        </p>
        <ul className="space-y-1 list-disc list-inside">
          <li>所有数据基于模拟数据，仅供展示用途</li>
          <li>搜索量数据包含桌面端和移动端</li>
          <li>难度分布基于关键词竞争度评估</li>
          <li>竞争对手数据展示可见度指数</li>
          <li>数据更新频率：每月一次</li>
        </ul>
      </div>
    </div>
  )
}