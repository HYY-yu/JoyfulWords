"use client"

import { useCallback, useEffect, useMemo, useRef, useState, type CSSProperties, type MouseEvent, type ReactNode, type RefObject } from "react"
import {
  DownloadIcon,
  FileIcon,
  FileTextIcon,
  FileUpIcon,
  ImageIcon,
  LayersIcon,
  ListOrderedIcon,
  Loader2Icon,
  MessageSquareQuoteIcon,
  RefreshCwIcon,
  TableIcon,
  TypeIcon,
  UploadCloudIcon,
  Wand2Icon,
} from "lucide-react"

import { LandingHeader } from "@/components/home/landing-header"
import { Button } from "@/components/ui/base/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/base/select"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/base/tabs"
import { Textarea } from "@/components/ui/base/textarea"
import { useToast } from "@/hooks/use-toast"
import {
  absoluteDownloadURL,
  convertMarkdownToWord,
  convertPdfToWord,
  convertPptToWord,
  listWordTemplates,
  uploadWordTemplate,
} from "@/lib/api/file-converter/client"
import type {
  ConversionTaskResponse,
  DocumentConversionMode,
  DocumentTemplateRecord,
  WordMappingRule,
  WordPreviewBlock,
  WordStyleDetails,
  WordTemplateConfig,
} from "@/lib/api/file-converter/types"
import { cn } from "@/lib/utils"

const MAX_FILE_SIZE = 50 * 1024 * 1024

const DEFAULT_MARKDOWN = `# 季度经营报告

## 核心结论

> 本季度增长主要来自自动化交付和重点客户续约。

1. 收入保持增长
2. 客户留存率改善
3. 下一阶段聚焦流程自动化

## 数据表

| 指标 | 本期 | 环比 |
| --- | --- | --- |
| 收入 | 1280 万 | +18% |
| 付费客户 | 420 | +12% |`

type HoverState = {
  title: string
  style: WordStyleDetails
  x: number
  y: number
} | null

interface FileConverterPageContentProps {
  variant?: "page" | "studio"
  initialMarkdown?: string
  initialMarkdownVersion?: number
}

export function FileConverterPageContent({
  variant = "page",
  initialMarkdown,
  initialMarkdownVersion = 0,
}: FileConverterPageContentProps = {}) {
  const { toast } = useToast()
  const isStudio = variant === "studio"
  const pptInputRef = useRef<HTMLInputElement | null>(null)
  const pdfInputRef = useRef<HTMLInputElement | null>(null)
  const templateInputRef = useRef<HTMLInputElement | null>(null)
  const [mode, setMode] = useState<DocumentConversionMode>("markdown-to-word")
  const [markdown, setMarkdown] = useState(initialMarkdown ?? DEFAULT_MARKDOWN)
  const [pptFile, setPptFile] = useState<File | null>(null)
  const [pdfFile, setPdfFile] = useState<File | null>(null)
  const [templates, setTemplates] = useState<DocumentTemplateRecord[]>([])
  const [selectedTemplateId, setSelectedTemplateId] = useState("")
  const [templateName, setTemplateName] = useState("")
  const [templateFile, setTemplateFile] = useState<File | null>(null)
  const [isLoadingTemplates, setIsLoadingTemplates] = useState(false)
  const [isUploadingTemplate, setIsUploadingTemplate] = useState(false)
  const [isConverting, setIsConverting] = useState(false)
  const [result, setResult] = useState<ConversionTaskResponse | null>(null)
  const [hover, setHover] = useState<HoverState>(null)

  const selectedTemplate = useMemo(
    () => templates.find((item) => item.template_id === selectedTemplateId) ?? null,
    [selectedTemplateId, templates]
  )

  useEffect(() => {
    if (initialMarkdown === undefined) return

    setMode("markdown-to-word")
    setMarkdown(initialMarkdown)
    setResult(null)
  }, [initialMarkdown, initialMarkdownVersion])

  const refreshTemplates = useCallback(async () => {
    setIsLoadingTemplates(true)
    try {
      const records = await listWordTemplates()
      setTemplates(records)
    } catch (error) {
      toast({
        title: "模板读取失败",
        description: error instanceof Error ? error.message : "请稍后重试。",
        variant: "destructive",
      })
    } finally {
      setIsLoadingTemplates(false)
    }
  }, [toast])

  useEffect(() => {
    void refreshTemplates()
  }, [refreshTemplates])

  useEffect(() => {
    if (!selectedTemplateId && templates.length > 0) {
      setSelectedTemplateId(templates[0].template_id)
      return
    }
    if (selectedTemplateId && !templates.some((item) => item.template_id === selectedTemplateId)) {
      setSelectedTemplateId(templates[0]?.template_id ?? "")
    }
  }, [selectedTemplateId, templates])

  const handlePptSelect = (file: File | null) => {
    if (!file) return
    if (!isPptFile(file)) {
      toast({ title: "文件格式不支持", description: "请选择 .pptx 文件。", variant: "destructive" })
      resetFileInput(pptInputRef)
      return
    }
    if (file.size > MAX_FILE_SIZE) {
      toast({ title: "文件过大", description: "请上传 50MB 以内的文件。", variant: "destructive" })
      resetFileInput(pptInputRef)
      return
    }
    setPptFile(file)
  }

  const handlePdfSelect = (file: File | null) => {
    if (!file) return
    if (!isPdfFile(file)) {
      toast({ title: "文件格式不支持", description: "请选择 .pdf 文件。", variant: "destructive" })
      resetFileInput(pdfInputRef)
      return
    }
    if (file.size > MAX_FILE_SIZE) {
      toast({ title: "文件过大", description: "请上传 50MB 以内的文件。", variant: "destructive" })
      resetFileInput(pdfInputRef)
      return
    }
    setPdfFile(file)
  }

  const handleTemplateSelect = (file: File | null) => {
    if (!file) return
    if (!isDocxFile(file)) {
      toast({ title: "文件格式不支持", description: "请选择 .docx 文件。", variant: "destructive" })
      resetFileInput(templateInputRef)
      return
    }
    if (file.size > MAX_FILE_SIZE) {
      toast({ title: "文件过大", description: "请上传 50MB 以内的文件。", variant: "destructive" })
      resetFileInput(templateInputRef)
      return
    }
    setTemplateFile(file)
    if (!templateName) {
      setTemplateName(file.name.replace(/\.docx$/i, ""))
    }
  }

  const handleUploadTemplate = async () => {
    if (!templateFile) {
      toast({ title: "请选择 Word 模板文件", variant: "destructive" })
      return
    }
    setIsUploadingTemplate(true)
    try {
      const record = await uploadWordTemplate(templateFile, templateName.trim())
      setTemplates((current) => [record, ...current.filter((item) => item.template_id !== record.template_id)])
      setSelectedTemplateId(record.template_id)
      setTemplateFile(null)
      setTemplateName("")
      resetFileInput(templateInputRef)
      toast({ title: "模板已解析" })
    } catch (error) {
      toast({
        title: "模板上传失败",
        description: error instanceof Error ? error.message : "请稍后重试。",
        variant: "destructive",
      })
    } finally {
      setIsUploadingTemplate(false)
    }
  }

  const handleConvert = async () => {
    setIsConverting(true)
    setResult(null)
    try {
      let converted: ConversionTaskResponse
      if (mode === "markdown-to-word") {
        converted = await convertMarkdownToWord({ markdown, template_id: selectedTemplateId })
      } else if (mode === "ppt-to-word") {
        converted = await convertPptToWord(assertPptFile(pptFile), selectedTemplateId)
      } else {
        converted = await convertPdfToWord(assertPdfFile(pdfFile), selectedTemplateId)
      }
      setResult(converted)
      toast({ title: "转换完成" })
    } catch (error) {
      toast({
        title: "转换失败",
        description: error instanceof Error ? error.message : "请稍后重试。",
        variant: "destructive",
      })
    } finally {
      setIsConverting(false)
    }
  }

  const canConvert = mode === "markdown-to-word" ? markdown.trim().length > 0 : mode === "ppt-to-word" ? Boolean(pptFile) : Boolean(pdfFile)
  const sourceLabel = mode === "markdown-to-word" ? (isStudio ? "文章 Markdown" : "Markdown") : mode === "ppt-to-word" ? pptFile?.name ?? "PPT" : pdfFile?.name ?? "PDF"
  const downloadHref = result ? absoluteDownloadURL(result.download_url) : ""
  const primaryActionLabel = mode === "markdown-to-word" && isStudio ? "生成 Word" : "开始转换"
  const primaryActionLoadingLabel = mode === "markdown-to-word" && isStudio ? "生成中" : "转换中"

  return (
    <div className={cn("jw-app-shell", isStudio ? "flex h-full min-h-0 flex-col overflow-hidden" : "min-h-screen")}>
      {isStudio ? null : <LandingHeader activeItem="tools" />}

      <main
        className={cn(
          isStudio
            ? "flex min-h-0 flex-1 flex-col overflow-y-auto p-4"
            : "mx-auto flex min-h-screen max-w-[1560px] flex-col overflow-x-hidden px-4 pt-20 pb-5 sm:px-6"
        )}
      >
        <div className="mb-3 flex flex-col items-start justify-between gap-3 sm:flex-row sm:items-center">
          {isStudio ? (
            <div className="min-w-0">
              <p className="text-xs leading-5 text-[var(--jw-muted)]">
                文章 Markdown 转 Word，可套用 Word 模板样式。
              </p>
            </div>
          ) : (
            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-[var(--jw-muted)]">Document Converter</p>
              <h1 className="jw-heading-text text-2xl font-semibold">文件转换</h1>
            </div>
          )}
          <div className="flex w-full items-center gap-2 sm:w-auto sm:justify-end">
            {result ? (
              <Button asChild className="jw-primary-button h-9 flex-1 rounded-md sm:flex-none">
                <a href={downloadHref} download={result.filename}>
                  <DownloadIcon className="size-4" />
                  下载 Word
                </a>
              </Button>
            ) : null}
            <Button
              className="jw-primary-button h-9 flex-1 rounded-md sm:flex-none"
              disabled={!canConvert || isConverting}
              onClick={handleConvert}
            >
              {isConverting ? <Loader2Icon className="size-4 animate-spin" /> : <Wand2Icon className="size-4" />}
              {isConverting ? primaryActionLoadingLabel : primaryActionLabel}
            </Button>
          </div>
        </div>

        <div
          className={cn(
            "grid w-full min-w-0 gap-4 xl:grid-cols-[minmax(420px,0.92fr)_minmax(0,1.08fr)]",
            isStudio ? "min-h-0 flex-1" : "min-h-[calc(100vh-132px)]"
          )}
        >
          <section className="flex min-h-0 min-w-0 flex-col overflow-hidden rounded-lg border border-[var(--jw-border)] bg-[var(--jw-surface-strong)]">
            <div className="border-b border-[var(--jw-border-subtle)] p-4">
              {isStudio ? (
                <div className="flex h-10 items-center gap-2 rounded-md border border-[var(--jw-border-subtle)] bg-[var(--jw-surface)] px-3 text-sm font-medium">
                  <FileTextIcon className="size-4 text-[var(--jw-accent)]" />
                  <span className="truncate">文章 Markdown 转 Word</span>
                </div>
              ) : (
                <Tabs value={mode} onValueChange={(value) => setMode(value as DocumentConversionMode)}>
                  <TabsList className="grid h-10 w-full min-w-0 grid-cols-3 rounded-md">
                    <TabsTrigger value="markdown-to-word" className="min-w-0 px-1 text-xs sm:px-2 sm:text-sm">
                      <FileTextIcon className="size-4" />
                      <span className="truncate">Markdown 转 Word</span>
                    </TabsTrigger>
                    <TabsTrigger value="ppt-to-word" className="min-w-0 px-1 text-xs sm:px-2 sm:text-sm">
                      <LayersIcon className="size-4" />
                      <span className="truncate">PPT 转 Word</span>
                    </TabsTrigger>
                    <TabsTrigger value="pdf-to-word" className="min-w-0 px-1 text-xs sm:px-2 sm:text-sm">
                      <FileIcon className="size-4" />
                      <span className="truncate">PDF 转 Word</span>
                    </TabsTrigger>
                  </TabsList>
                </Tabs>
              )}
            </div>

            <div className="min-h-0 flex-1 p-4">
              {mode === "markdown-to-word" ? (
                <div className="flex h-full min-h-[520px] flex-col gap-2">
                  <label className="text-sm font-medium text-[var(--jw-muted)]">{isStudio ? "文章 Markdown 预览" : "Markdown 输入区"}</label>
                  <Textarea
                    value={markdown}
                    onChange={(event) => setMarkdown(event.target.value)}
                    spellCheck={false}
                    className="min-h-[500px] min-w-0 flex-1 resize-none rounded-md border-[var(--jw-border)] bg-[var(--jw-surface)] font-mono text-sm leading-6"
                  />
                </div>
              ) : (
                <FileUploadArea
                  inputRef={mode === "ppt-to-word" ? pptInputRef : pdfInputRef}
                  file={mode === "ppt-to-word" ? pptFile : pdfFile}
                  uploadIcon={<FileUpIcon className="mb-3 size-10 text-[var(--jw-accent)]" />}
                  summaryIcon={mode === "ppt-to-word" ? <LayersIcon className="size-4" /> : <FileIcon className="size-4" />}
                  title={mode === "ppt-to-word" ? "选择 PPT 文件" : "选择 PDF 文件"}
                  hint={mode === "ppt-to-word" ? ".pptx · 50MB" : ".pdf · 50MB"}
                  accept={mode === "ppt-to-word" ? ".pptx,application/vnd.openxmlformats-officedocument.presentationml.presentation" : ".pdf,application/pdf"}
                  onSelect={(file) => (mode === "ppt-to-word" ? handlePptSelect(file) : handlePdfSelect(file))}
                  onClear={() => {
                    if (mode === "ppt-to-word") {
                      setPptFile(null)
                      resetFileInput(pptInputRef)
                    } else {
                      setPdfFile(null)
                      resetFileInput(pdfInputRef)
                    }
                  }}
                />
              )}
            </div>

            <div className="border-t border-[var(--jw-border-subtle)] p-4">
              {result ? (
                <div className="rounded-md border border-[var(--jw-border-subtle)] bg-[var(--jw-surface)] p-3">
                  <div className="mb-2 flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold">{result.filename}</p>
                      <p className="text-xs text-[var(--jw-muted)]">任务 {result.task_id}</p>
                    </div>
                    <Button asChild variant="outline" size="sm" className="h-8 rounded-md">
                      <a href={downloadHref} download={result.filename}>
                        <DownloadIcon className="size-4" />
                        下载
                      </a>
                    </Button>
                  </div>
                  <pre className="max-h-32 overflow-auto rounded-md bg-[#121826] p-3 text-xs leading-5 text-slate-100">
                    {result.preview_markdown || "已生成 Word 文件"}
                  </pre>
                </div>
              ) : (
                <div className="flex items-center justify-between text-xs text-[var(--jw-muted)]">
                  <span>模板：{selectedTemplate?.name ?? "系统默认模板"}</span>
                  <span>{sourceLabel} → Word</span>
                </div>
              )}
            </div>
          </section>

          <section className="flex min-h-0 min-w-0 flex-col overflow-hidden rounded-lg border border-[var(--jw-border)] bg-[var(--jw-surface-strong)]">
            <div className="border-b border-[var(--jw-border-subtle)] p-4">
              <div className="mb-3 flex items-center justify-between gap-2">
                <h2 className="jw-heading-text text-sm font-semibold">Word 模板</h2>
                <Button variant="outline" size="sm" className="h-8 rounded-md" onClick={() => void refreshTemplates()} disabled={isLoadingTemplates}>
                  {isLoadingTemplates ? <Loader2Icon className="size-4 animate-spin" /> : <RefreshCwIcon className="size-4" />}
                  刷新
                </Button>
              </div>

              <div className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_minmax(320px,0.9fr)]">
                <div className="min-w-0">
                  <label className="mb-1 block text-xs font-medium text-[var(--jw-muted)]">模板选择</label>
                  <Select value={selectedTemplateId || "default"} onValueChange={(value) => setSelectedTemplateId(value === "default" ? "" : value)}>
                    <SelectTrigger className="h-10 w-full bg-[var(--jw-surface)]">
                      <SelectValue placeholder="选择 Word 模板" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="default">系统默认模板</SelectItem>
                      {templates.map((template) => (
                        <SelectItem key={template.template_id} value={template.template_id}>
                          {template.user_id === 0 ? "公共 · " : "我的 · "}
                          {template.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <MappingRules config={selectedTemplate?.config_json} />
                </div>

                <div className="min-w-0">
                  <label className="mb-1 block text-xs font-medium text-[var(--jw-muted)]">上传模板</label>
                  <div className="grid gap-2">
                    <input
                      value={templateName}
                      onChange={(event) => setTemplateName(event.target.value)}
                      placeholder="模板名称"
                      className="h-10 rounded-md border border-[var(--jw-border)] bg-[var(--jw-surface)] px-3 text-sm outline-none focus:border-[var(--jw-accent)]"
                    />
                    <div className="flex min-w-0 gap-2">
                      <Button variant="outline" className="h-10 min-w-0 flex-1 rounded-md" onClick={() => templateInputRef.current?.click()}>
                        <UploadCloudIcon className="size-4" />
                        <span className="truncate">{templateFile?.name ?? "选择 .docx"}</span>
                      </Button>
                      <Button className="jw-primary-button h-10 rounded-md" disabled={isUploadingTemplate || !templateFile} onClick={handleUploadTemplate}>
                        {isUploadingTemplate ? <Loader2Icon className="size-4 animate-spin" /> : <FileUpIcon className="size-4" />}
                        上传
                      </Button>
                    </div>
                    <input
                      ref={templateInputRef}
                      type="file"
                      accept=".docx,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                      className="hidden"
                      onChange={(event) => handleTemplateSelect(event.target.files?.[0] ?? null)}
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="relative min-h-0 flex-1 p-4">
              <TemplatePreview template={selectedTemplate} hover={hover} setHover={setHover} />
              <StyleHoverCard hover={hover} />
            </div>
          </section>
        </div>
      </main>
    </div>
  )
}

function FileUploadArea({
  inputRef,
  file,
  uploadIcon,
  summaryIcon,
  title,
  hint,
  accept,
  onSelect,
  onClear,
}: {
  inputRef: RefObject<HTMLInputElement | null>
  file: File | null
  uploadIcon: ReactNode
  summaryIcon: ReactNode
  title: string
  hint: string
  accept: string
  onSelect: (file: File | null) => void
  onClear: () => void
}) {
  return (
    <div className="flex h-full min-h-[520px] flex-col gap-4">
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        className="flex min-h-[340px] flex-1 flex-col items-center justify-center rounded-md border border-dashed border-[var(--jw-border)] bg-[var(--jw-surface)] px-5 text-center transition-colors hover:border-[var(--jw-accent)] hover:bg-[var(--jw-accent-soft)]"
      >
        {uploadIcon}
        <span className="text-base font-semibold text-foreground">{title}</span>
        <span className="mt-2 text-sm text-[var(--jw-muted)]">{hint}</span>
      </button>
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        className="hidden"
        onChange={(event) => onSelect(event.target.files?.[0] ?? null)}
      />
      {file ? (
        <FileSummary
          icon={summaryIcon}
          name={file.name}
          meta={formatFileSize(file.size)}
          onClear={onClear}
        />
      ) : null}
    </div>
  )
}

function MappingRules({ config }: { config?: WordTemplateConfig }) {
  const rules = config?.mapping_rules ?? bindingsToRules(config?.style_bindings)
  if (!rules.length) return null

  return (
    <div className="mt-3 grid gap-1.5">
      {rules.slice(0, 6).map((rule) => (
        <div key={`${rule.role}-${rule.markdown}`} className="flex min-w-0 items-center justify-between gap-2 rounded-md border border-[var(--jw-border-subtle)] bg-[var(--jw-surface)] px-2.5 py-1.5 text-xs">
          <span className="truncate font-mono text-[var(--jw-muted)]">{rule.markdown}</span>
          <span className="truncate font-medium">{rule.template_style_label || rule.style_name}</span>
        </div>
      ))}
    </div>
  )
}

function TemplatePreview({
  template,
  hover,
  setHover,
}: {
  template: DocumentTemplateRecord | null
  hover: HoverState
  setHover: (value: HoverState) => void
}) {
  const config = template?.config_json
  const blocks = config?.preview?.blocks ?? config?.serialized_content?.blocks ?? []
  const page = config?.page_setup ?? {}

  if (!template || !config) {
    return (
      <div className="flex h-full min-h-[520px] items-center justify-center rounded-md border border-dashed border-[var(--jw-border)] bg-[var(--jw-surface)] p-6 text-center">
        <div>
          <FileTextIcon className="mx-auto mb-3 size-10 text-[var(--jw-muted)]" />
          <p className="text-sm font-medium">系统默认模板</p>
          <p className="mt-1 text-xs text-[var(--jw-muted)]">可上传 Word 模板后查看原内容和样式。</p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex h-full min-h-[520px] flex-col overflow-hidden rounded-md border border-[var(--jw-border)] bg-[var(--jw-surface)]">
      <div className="flex items-center justify-between gap-3 border-b border-[var(--jw-border-subtle)] px-4 py-3">
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold">{template.name}</p>
          <p className="truncate text-xs text-[var(--jw-muted)]">{template.original_filename}</p>
        </div>
        <div className="flex shrink-0 items-center gap-2 text-xs text-[var(--jw-muted)]">
          <span>{config.document?.paragraph_count ?? blocks.length} 段</span>
          <span>{config.document?.table_count ?? 0} 表</span>
          <span>{config.document?.inline_shape_count ?? 0} 图</span>
        </div>
      </div>

      <div className="min-h-0 flex-1 overflow-auto bg-white p-6 text-[#171717]">
        <div
          className="mx-auto min-h-full w-full max-w-[760px] bg-white px-10 py-8 shadow-[0_0_0_1px_rgba(15,23,42,0.08),0_18px_40px_rgba(15,23,42,0.12)]"
          style={{ paddingTop: cmToPx(page.margin_top), paddingBottom: cmToPx(page.margin_bottom) }}
        >
          {blocks.length ? (
            <div className="space-y-3">
              {blocks.map((block, index) => (
                <PreviewBlock
                  key={`${block.type}-${index}`}
                  block={block}
                  config={config}
                  onHover={(event, title, style) => setHover(positionHover(event, title, style))}
                  onLeave={() => setHover(null)}
                />
              ))}
            </div>
          ) : (
            <p className="text-sm text-slate-500">模板没有可展示的正文内容。</p>
          )}
        </div>
      </div>
      {hover ? null : <div className="border-t border-[var(--jw-border-subtle)] px-4 py-2 text-xs text-[var(--jw-muted)]">鼠标悬浮模板内容查看样式详情</div>}
    </div>
  )
}

function PreviewBlock({
  block,
  config,
  onHover,
  onLeave,
}: {
  block: WordPreviewBlock
  config: WordTemplateConfig
  onHover: (event: MouseEvent<HTMLElement>, title: string, style: WordStyleDetails) => void
  onLeave: () => void
}) {
  const style = styleForBlock(block, config)
  const title = roleLabel(block.role ?? block.type)
  const commonProps = {
    onMouseMove: (event: MouseEvent<HTMLElement>) => onHover(event, title, style),
    onMouseLeave: onLeave,
  }

  if (block.type === "table") {
    const rows = block.rows ?? []
    const tableStyle = styleForBlock(block, config)
    return (
      <div {...commonProps} className="overflow-hidden rounded-sm border border-slate-300">
        <table className="w-full border-collapse text-sm">
          <tbody>
            {rows.slice(0, 8).map((row, rowIndex) => (
              <tr key={rowIndex} style={rowIndex === 0 ? tableHeaderStyle(tableStyle) : undefined}>
                {row.map((cell, cellIndex) => (
                  <td key={`${rowIndex}-${cellIndex}`} className="border border-slate-300 px-2 py-1 text-center">
                    {cell}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    )
  }

  if (block.type === "image") {
    return (
      <div {...commonProps} className="flex items-center justify-center rounded-sm border border-dashed border-slate-300 py-8 text-slate-500">
        <ImageIcon className="mr-2 size-5" />
        <span>{block.text || `图片版式 ${block.image_count ?? 1}`}</span>
      </div>
    )
  }

  const Icon = iconForRole(block.role)
  return (
    <div {...commonProps} className="group rounded-sm px-1 py-0.5 outline outline-1 outline-transparent transition-colors hover:bg-sky-50 hover:outline-sky-200">
      <p style={paragraphPreviewStyle(style)} className="break-words">
        {block.role === "list_number" || block.role === "ordered_list" ? <span className="mr-2 text-slate-400">1.</span> : null}
        {block.role === "quote" ? <span className="mr-2 text-slate-400">“</span> : null}
        {Icon ? <Icon className="mr-1 inline size-3.5 align-[-2px] text-slate-400 opacity-0 group-hover:opacity-100" /> : null}
        {block.text || "\u00a0"}
      </p>
    </div>
  )
}

function StyleHoverCard({ hover }: { hover: HoverState }) {
  if (!hover) return null
  const details = styleDetails(hover.style)
  return (
    <div
      className="pointer-events-none fixed z-[80] w-[300px] rounded-md border border-slate-200 bg-white p-3 text-xs text-slate-700 shadow-xl"
      style={{ left: hover.x, top: hover.y }}
    >
      <div className="mb-2 flex items-center justify-between gap-2">
        <p className="font-semibold text-slate-950">{hover.title}</p>
        {hover.style.color ? <span className="size-4 rounded-sm border border-slate-200" style={{ background: normalizeColor(hover.style.color, "#111827") }} /> : null}
      </div>
      <div className="grid grid-cols-2 gap-x-3 gap-y-1.5">
        {details.map(([label, value]) => (
          <div key={label} className="min-w-0">
            <span className="text-slate-400">{label}</span>
            <p className="truncate font-medium text-slate-700">{value}</p>
          </div>
        ))}
      </div>
    </div>
  )
}

function FileSummary({ icon, name, meta, onClear }: { icon: ReactNode; name: string; meta: string; onClear: () => void }) {
  return (
    <div className="rounded-md border border-[var(--jw-border-subtle)] bg-[var(--jw-surface)] p-3">
      <div className="flex min-w-0 items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-2">
          <span className="flex size-8 shrink-0 items-center justify-center rounded-md bg-[var(--jw-accent-soft)] text-[var(--jw-accent)]">{icon}</span>
          <div className="min-w-0">
            <p className="truncate text-sm font-medium">{name}</p>
            <p className="text-xs text-[var(--jw-muted)]">{meta}</p>
          </div>
        </div>
        <Button type="button" variant="ghost" size="sm" className="h-8 rounded-md" onClick={onClear}>
          移除
        </Button>
      </div>
    </div>
  )
}

function positionHover(event: MouseEvent<HTMLElement>, title: string, style: WordStyleDetails): HoverState {
  const width = 320
  const height = 210
  const x = Math.min(event.clientX + 14, Math.max(12, window.innerWidth - width))
  const y = Math.min(event.clientY + 14, Math.max(12, window.innerHeight - height))
  return { title, style, x, y }
}

function styleForBlock(block: WordPreviewBlock, config: WordTemplateConfig): WordStyleDetails {
  if (block.style && Object.keys(block.style).length > 0) return block.style
  const role = block.role ?? block.type
  const styleKey = role === "ordered_list" ? "list_number" : role
  return config.styles?.[styleKey] ?? config.styles?.normal ?? {}
}

function paragraphPreviewStyle(style: WordStyleDetails): CSSProperties {
  return {
    color: normalizeColor(style.color, "#172033"),
    fontFamily: style.font ? `${style.font}, Arial, sans-serif` : undefined,
    fontSize: `${safeNumber(style.size, 11, 7, 42)}pt`,
    fontWeight: style.bold ? 700 : 400,
    fontStyle: style.italic ? "italic" : "normal",
    lineHeight: style.line_spacing ? String(style.line_spacing) : undefined,
    textAlign: textAlign(style.alignment),
    marginTop: ptToPx(style.space_before),
    marginBottom: ptToPx(style.space_after),
    paddingLeft: cmToPx(style.left_indent),
    textIndent: cmToPx(style.first_line_indent),
  }
}

function tableHeaderStyle(style: WordStyleDetails): CSSProperties {
  return {
    background: normalizeColor(style.header_bg, "#1F3864"),
    color: normalizeColor(style.header_font_color, "#FFFFFF"),
    fontWeight: 700,
  }
}

function styleDetails(style: WordStyleDetails): Array<[string, string]> {
  return [
    ["样式", style.style_name || style.style_id || "默认"],
    ["字体", style.font || "继承"],
    ["字号", style.size ? `${style.size} pt` : "继承"],
    ["色号", style.color || "继承"],
    ["加粗", style.bold ? "是" : "否"],
    ["斜体", style.italic ? "是" : "否"],
    ["对齐", style.alignment || "left"],
    ["行距", style.line_spacing ? String(style.line_spacing) : "继承"],
    ["段前", style.space_before ? `${style.space_before} pt` : "0"],
    ["段后", style.space_after ? `${style.space_after} pt` : "0"],
  ]
}

function bindingsToRules(bindings?: Record<string, { markdown?: string; template_style_label?: string; style_name?: string }>): WordMappingRule[] {
  if (!bindings) return []
  return Object.entries(bindings).map(([role, binding]) => ({
    role,
    markdown: binding.markdown ?? role,
    template_style_label: binding.template_style_label ?? binding.style_name ?? "",
    style_name: binding.style_name,
  }))
}

function iconForRole(role?: string) {
  if (role === "heading1" || role === "heading2" || role === "heading3") return TypeIcon
  if (role === "quote") return MessageSquareQuoteIcon
  if (role === "list_number" || role === "ordered_list") return ListOrderedIcon
  if (role === "table") return TableIcon
  if (role === "image") return ImageIcon
  return null
}

function roleLabel(role: string): string {
  return {
    heading1: "标题1",
    heading2: "标题2",
    heading3: "标题3",
    quote: "引用样式",
    table: "标准业务表格样式",
    image: "图片版式",
    list_number: "多级自动编号",
    ordered_list: "多级自动编号",
    normal: "正文",
    paragraph: "正文",
  }[role] ?? role
}

function isDocxFile(file: File): boolean {
  return file.name.toLowerCase().endsWith(".docx") || file.type === "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
}

function isPptFile(file: File): boolean {
  return file.name.toLowerCase().endsWith(".pptx") || file.type === "application/vnd.openxmlformats-officedocument.presentationml.presentation"
}

function isPdfFile(file: File): boolean {
  return file.name.toLowerCase().endsWith(".pdf") || file.type === "application/pdf"
}

function assertPptFile(file: File | null): File {
  if (!file) throw new Error("请选择 PPT 文件")
  return file
}

function assertPdfFile(file: File | null): File {
  if (!file) throw new Error("请选择 PDF 文件")
  return file
}

function resetFileInput(ref: RefObject<HTMLInputElement | null>) {
  if (ref.current) ref.current.value = ""
}

function safeNumber(value: unknown, fallback: number, min: number, max: number): number {
  const number = Number(value)
  if (!Number.isFinite(number)) return fallback
  return Math.min(max, Math.max(min, number))
}

function normalizeColor(value: unknown, fallback: string): string {
  if (typeof value !== "string" || !value.trim()) return fallback
  const color = value.trim()
  if (/^#[0-9a-f]{6}$/i.test(color)) return color
  if (/^[0-9a-f]{6}$/i.test(color)) return `#${color}`
  return fallback
}

function ptToPx(value?: number): number | undefined {
  if (value === undefined || value === null) return undefined
  return safeNumber(value, 0, -80, 120) * 1.333
}

function cmToPx(value: unknown): number | undefined {
  const number = Number(value)
  if (!Number.isFinite(number) || number <= 0) return undefined
  return Math.min(120, number * 18)
}

function textAlign(value?: string): CSSProperties["textAlign"] {
  if (value === "center" || value === "right" || value === "justify") return value
  return "left"
}

function formatFileSize(size: number): string {
  if (size < 1024) return `${size} B`
  if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)} KB`
  return `${(size / 1024 / 1024).toFixed(1)} MB`
}
