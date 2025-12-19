"use client"

import { useState, useMemo } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { CreditCardIcon, SparklesIcon, GlobeIcon } from "lucide-react"
import { useTranslation } from "@/lib/i18n/i18n-context"

import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { toast } from "sonner"

type FormData = {
  content: string
  cardStyle: "热情红" | "魅力蓝" | "活力橙" | "自然绿" | "优雅紫" | "科技银"
  cardLayout: "Markdown" | "脑图"
  language: "中文" | "英文"
  cardCount: number
  cardRequirements?: string
}

const cardStyleColors = {
  "热情红": {
    primary: "rgb(239, 68, 68)",
    secondary: "rgb(254, 226, 226)",
    accent: "rgb(185, 28, 28)",
    gradient: "linear-gradient(135deg, #ef4444 0%, #dc2626 100%)",
  },
  "魅力蓝": {
    primary: "rgb(59, 130, 246)",
    secondary: "rgb(219, 234, 254)",
    accent: "rgb(29, 78, 216)",
    gradient: "linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)",
  },
  "活力橙": {
    primary: "rgb(251, 146, 60)",
    secondary: "rgb(254, 235, 200)",
    accent: "rgb(221, 107, 32)",
    gradient: "linear-gradient(135deg, #fb923c 0%, #ea580c 100%)",
  },
  "自然绿": {
    primary: "rgb(34, 197, 94)",
    secondary: "rgb(220, 252, 231)",
    accent: "rgb(21, 128, 61)",
    gradient: "linear-gradient(135deg, #22c55e 0%, #15803d 100%)",
  },
  "优雅紫": {
    primary: "rgb(147, 51, 234)",
    secondary: "rgb(237, 233, 254)",
    accent: "rgb(109, 40, 217)",
    gradient: "linear-gradient(135deg, #9333ea 0%, #6d28d9 100%)",
  },
  "科技银": {
    primary: "rgb(107, 114, 128)",
    secondary: "rgb(229, 231, 235)",
    accent: "rgb(55, 65, 81)",
    gradient: "linear-gradient(135deg, #6b7280 0%, #374151 100%)",
  },
}

export function KnowledgeCards() {
  const { t } = useTranslation()

  const dynamicFormSchema = useMemo(() => z.object({
    content: z.string().min(10, t("knowledgeCards.contentMinError")).max(10000, t("knowledgeCards.contentMaxError")),
    cardStyle: z.enum(["热情红", "魅力蓝", "活力橙", "自然绿", "优雅紫", "科技银"], {
      required_error: t("knowledgeCards.styleLabel"),
    }),
    cardLayout: z.enum(["Markdown", "脑图"], {
      required_error: t("knowledgeCards.layoutLabel"),
    }),
    language: z.enum(["中文", "英文"], {
      required_error: t("knowledgeCards.langLabel"),
    }),
    cardCount: z.number().min(1).max(20).default(5),
    cardRequirements: z.string().optional(),
  }), [t])

  const [isGenerating, setIsGenerating] = useState(false)
  const [generatedCards, setGeneratedCards] = useState<string[]>([])

  const form = useForm<FormData>({
    resolver: zodResolver(dynamicFormSchema),
    defaultValues: {
      content: "",
      cardStyle: "热情红",
      cardLayout: "Markdown",
      language: "中文",
      cardCount: 5,
      cardRequirements: "",
    },
  })

  const onSubmit = async (data: FormData) => {
    setIsGenerating(true)

    try {
      // 模拟API调用
      await new Promise(resolve => setTimeout(resolve, 2000))

      // 模拟生成的卡片HTML内容
      const mockCards = Array.from({ length: data.cardCount }, (_, index) => {
        const colors = cardStyleColors[data.cardStyle]
        const isMarkdown = data.cardLayout === "Markdown"

        if (isMarkdown) {
          return `
            <div style="
              background: white;
              border-radius: 12px;
              padding: 24px;
              margin: 16px;
              box-shadow: 0 4px 12px rgba(0,0,0,0.1);
              border-left: 4px solid ${colors.primary};
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
            ">
              <h3 style="
                color: ${colors.primary};
                margin: 0 0 16px 0;
                font-size: 18px;
                font-weight: 600;
              ">
                知识卡片 #${index + 1}
              </h3>
              <div style="color: #374151; line-height: 1.6;">
                <h4 style="color: ${colors.accent}; font-size: 16px; margin: 16px 0 8px 0;">核心概念</h4>
                <p style="margin: 0 0 12px 0;">
                  这是基于您提供的内容生成的第${index + 1}张知识卡片。
                  ${data.language === "中文" ? "包含关键的中文知识点和总结。" : "Contains key English knowledge points and summaries."}
                </p>
                <h4 style="color: ${colors.accent}; font-size: 16px; margin: 16px 0 8px 0;">要点总结</h4>
                <ul style="margin: 0; padding-left: 20px;">
                  <li>重点内容 ${index + 1}</li>
                  <li>关键信息总结</li>
                  <li>实际应用建议</li>
                </ul>
                ${data.cardRequirements ? `
                  <h4 style="color: ${colors.accent}; font-size: 16px; margin: 16px 0 8px 0;">特殊要求</h4>
                  <p style="margin: 0; font-style: italic; color: #6b7280;">
                    根据您的要求：${data.cardRequirements}
                  </p>
                ` : ""}
              </div>
              <div style="
                margin-top: 20px;
                padding-top: 16px;
                border-top: 1px solid #e5e7eb;
                color: #9ca3af;
                font-size: 12px;
                text-align: right;
              ">
                生成时间: ${new Date().toLocaleString('zh-CN')}
              </div>
            </div>
          `
        } else {
          // 脑图样式
          return `
            <div style="
              background: white;
              border-radius: 12px;
              padding: 24px;
              margin: 16px;
              box-shadow: 0 4px 12px rgba(0,0,0,0.1);
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
              position: relative;
              overflow: hidden;
            ">
              <div style="
                position: absolute;
                top: 0;
                left: 0;
                right: 0;
                height: 4px;
                background: ${colors.gradient};
              "></div>
              <div style="text-align: center; margin-bottom: 24px;">
                <div style="
                  display: inline-block;
                  background: ${colors.secondary};
                  color: ${colors.accent};
                  padding: 12px 24px;
                  border-radius: 24px;
                  font-weight: 600;
                  font-size: 16px;
                ">
                  知识点 ${index + 1}
                </div>
              </div>
              <div style="
                background: ${colors.secondary};
                border-radius: 8px;
                padding: 16px;
                margin-bottom: 16px;
                text-align: center;
                font-weight: 500;
                color: ${colors.accent};
              ">
                中心主题：关键知识点 ${index + 1}
              </div>
              <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-bottom: 16px;">
                <div style="background: #f3f4f6; border-radius: 6px; padding: 12px; border-left: 3px solid ${colors.primary};">
                  <strong style="color: ${colors.primary};">分支1</strong><br>
                  <span style="font-size: 14px; color: #4b5563;">相关概念和细节</span>
                </div>
                <div style="background: #f3f4f6; border-radius: 6px; padding: 12px; border-left: 3px solid ${colors.primary};">
                  <strong style="color: ${colors.primary};">分支2</strong><br>
                  <span style="font-size: 14px; color: #4b5563;">应用场景和案例</span>
                </div>
                <div style="background: #f3f4f6; border-radius: 6px; padding: 12px; border-left: 3px solid ${colors.accent};">
                  <strong style="color: ${colors.accent};">分支3</strong><br>
                  <span style="font-size: 14px; color: #4b5563;">关键要点总结</span>
                </div>
                <div style="background: #f3f4f6; border-radius: 6px; padding: 12px; border-left: 3px solid ${colors.accent};">
                  <strong style="color: ${colors.accent};">分支4</strong><br>
                  <span style="font-size: 14px; color: #4b5563;">实际应用建议</span>
                </div>
              </div>
              ${data.cardRequirements ? `
                <div style="background: #fef3c7; border-radius: 6px; padding: 12px; border-left: 3px solid #f59e0b;">
                  <strong style="color: #d97706;">特殊要求：</strong><br>
                  <span style="font-size: 14px; color: #92400e;">${data.cardRequirements}</span>
                </div>
              ` : ""}
              <div style="
                margin-top: 20px;
                text-align: center;
                color: #9ca3af;
                font-size: 12px;
              ">
                ${data.language === "中文" ? "脑图式知识卡片" : "Mind Map Style Card"} - ${new Date().toLocaleString('zh-CN')}
              </div>
            </div>
          `
        }
      })

      setGeneratedCards(mockCards)
      toast.success(`成功生成 ${data.cardCount} 张知识卡片！`)
    } catch (error) {
      toast.error("生成卡片时发生错误，请重试")
    } finally {
      setIsGenerating(false)
    }
  }

  const getCardPreviewHTML = () => {
    const data = form.getValues()
    const colors = cardStyleColors[data.cardStyle]

    if (data.cardLayout === "Markdown") {
      return `
        <div style="
          background: white;
          border-radius: 12px;
          padding: 20px;
          margin: 8px;
          box-shadow: 0 2px 8px rgba(0,0,0,0.1);
          border-left: 4px solid ${colors.primary};
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
        ">
          <h3 style="
            color: ${colors.primary};
            margin: 0 0 12px 0;
            font-size: 16px;
            font-weight: 600;
          ">
            预览卡片
          </h3>
          <p style="color: #6b7280; font-size: 14px; line-height: 1.5; margin: 0;">
            这是卡片样式的预览效果
          </p>
        </div>
      `
    } else {
      return `
        <div style="
          background: white;
          border-radius: 12px;
          padding: 16px;
          margin: 8px;
          box-shadow: 0 2px 8px rgba(0,0,0,0.1);
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
          position: relative;
          overflow: hidden;
        ">
          <div style="
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            height: 3px;
            background: ${colors.gradient};
          "></div>
          <div style="text-align: center; margin-bottom: 16px;">
            <div style="
              display: inline-block;
              background: ${colors.secondary};
              color: ${colors.accent};
              padding: 8px 16px;
              border-radius: 16px;
              font-weight: 600;
              font-size: 14px;
            ">
              脑图预览
            </div>
          </div>
          <div style="
            background: ${colors.secondary};
            border-radius: 6px;
            padding: 12px;
            text-align: center;
            font-weight: 500;
            color: ${colors.accent};
            font-size: 14px;
          ">
            中心主题
          </div>
        </div>
      `
    }
  }

  return (
    <main className="flex-1 overflow-auto flex flex-col">
      {/* Header */}
      <header className="border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-10">
        <div className="px-8 py-6">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary/10">
              <CreditCardIcon className="w-6 h-6 text-primary" />
            </div>
            <div>
              <h2 className="text-2xl font-semibold text-foreground">{t("knowledgeCards.title")}</h2>
              <p className="text-sm text-muted-foreground mt-0.5">{t("knowledgeCards.subtitle")}</p>
            </div>
          </div>
        </div>
      </header>

      <div className="flex-1 p-8 overflow-auto">
        <div className="max-w-6xl mx-auto space-y-8">
          {/* 上部分：表单区域 */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <SparklesIcon className="w-5 h-5" />
                {t("knowledgeCards.configTitle")}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                  {/* 内容输入 */}
                  <FormField
                    control={form.control}
                    name="content"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t("knowledgeCards.contentLabel")}</FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder={t("knowledgeCards.contentPlaceholder")}
                            className="min-h-[120px] resize-none"
                            {...field}
                          />
                        </FormControl>
                        <FormDescription>
                          {t("knowledgeCards.contentDesc")}
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {/* 卡片样式 */}
                    <FormField
                      control={form.control}
                      name="cardStyle"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{t("knowledgeCards.styleLabel")}</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder={t("knowledgeCards.styleLabel")} />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="热情红">🔴 {t("knowledgeCards.styleLabel")}: Red</SelectItem>
                              <SelectItem value="魅力蓝">🔵 {t("knowledgeCards.styleLabel")}: Blue</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    {/* 卡片布局 */}
                    <FormField
                      control={form.control}
                      name="cardLayout"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{t("knowledgeCards.layoutLabel")}</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder={t("knowledgeCards.layoutLabel")} />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="Markdown">📝 Markdown</SelectItem>
                              <SelectItem value="脑图">🧠 Mind Map</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    {/* 语言 */}
                    <FormField
                      control={form.control}
                      name="language"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{t("knowledgeCards.langLabel")}</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder={t("knowledgeCards.langLabel")} />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="中文">🇨🇳 {t("common.zh")}</SelectItem>
                              <SelectItem value="英文">🇺🇸 {t("common.en")}</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* 卡片数量 */}
                    <FormField
                      control={form.control}
                      name="cardCount"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{t("knowledgeCards.countLabel")}</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              min="1"
                              max="20"
                              placeholder="5"
                              {...field}
                              onChange={(e) => field.onChange(parseInt(e.target.value) || 5)}
                            />
                          </FormControl>
                          <FormDescription>
                            {t("knowledgeCards.countDesc")}
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    {/* 卡片要求 */}
                    <FormField
                      control={form.control}
                      name="cardRequirements"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{t("knowledgeCards.reqLabel")}</FormLabel>
                          <FormControl>
                            <Input
                              placeholder={t("knowledgeCards.reqPlaceholder")}
                              {...field}
                            />
                          </FormControl>
                          <FormDescription>
                            {t("knowledgeCards.reqDesc")}
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  {/* 样式预览 */}
                  <div>
                    <FormLabel>{t("knowledgeCards.previewLabel")}</FormLabel>
                    <div className="mt-2 p-4 border rounded-lg bg-muted/20">
                      <iframe
                        srcDoc={getCardPreviewHTML()}
                        className="w-full h-[200px] border-0 rounded"
                        title="Style Preview"
                      />
                    </div>
                  </div>

                  {/* 生成按钮 */}
                  <div className="flex justify-center pt-4">
                    <Button
                      type="submit"
                      size="lg"
                      disabled={isGenerating}
                      className="min-w-[200px]"
                    >
                      {isGenerating ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                          {t("common.generating")}
                        </>
                      ) : (
                        <>
                          <SparklesIcon className="w-4 h-4 mr-2" />
                          {t("knowledgeCards.generateBtn")}
                        </>
                      )}
                    </Button>
                  </div>
                </form>
              </Form>
            </CardContent>
          </Card>

          {/* 下部分：卡片生成区域 */}
          {generatedCards.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <GlobeIcon className="w-5 h-5" />
                  {t("knowledgeCards.resultTitle")} ({generatedCards.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="border rounded-lg">
                  <iframe
                    srcDoc={`
                      <!DOCTYPE html>
                      <html>
                        <head>
                          <meta charset="utf-8">
                          <style>
                            body {
                              margin: 0;
                              padding: 20px;
                              background: #f8fafc;
                              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
                            }
                            .card-container {
                              max-width: 800px;
                              margin: 0 auto;
                            }
                          </style>
                        </head>
                        <body>
                          <div class="card-container">
                            ${generatedCards.join('')}
                          </div>
                        </body>
                      </html>
                    `}
                    className="w-full h-[600px] border-0 rounded"
                    title="Knowledge Card Display"
                  />
                </div>
                <div className="mt-4 flex justify-center gap-4">
                  <Button
                    variant="outline"
                    onClick={() => {
                      const iframe = document.querySelector('iframe[title="Knowledge Card Display"]') as HTMLIFrameElement
                      if (iframe?.contentWindow) {
                        iframe.contentWindow.print()
                      }
                    }}
                  >
                    {t("knowledgeCards.printBtn")}
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => {
                      const blob = new Blob([generatedCards.join('')], { type: 'text/html' })
                      const url = URL.createObjectURL(blob)
                      const a = document.createElement('a')
                      a.href = url
                      a.download = 'knowledge-cards.html'
                      a.click()
                      URL.revokeObjectURL(url)
                    }}
                  >
                    {t("knowledgeCards.downloadBtn")}
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </main>
  )
}