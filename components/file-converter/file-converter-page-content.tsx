"use client"

import { useEffect, useMemo, useRef, useState, type ReactNode, type RefObject } from "react"
import {
  CheckIcon,
  ClipboardIcon,
  DownloadIcon,
  FileCode2Icon,
  FileTextIcon,
  FileUpIcon,
  Loader2Icon,
  RotateCwIcon,
} from "lucide-react"

import { LandingHeader } from "@/components/home/landing-header"
import { Button } from "@/components/ui/base/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/base/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/base/tabs"
import { Textarea } from "@/components/ui/base/textarea"
import { useToast } from "@/hooks/use-toast"
import { convertTextContent, convertUploadedFile } from "@/lib/api/file-converter/client"
import type { FileConverterFormat, FileConverterSourceTab } from "@/lib/api/file-converter/types"

const MAX_FILE_SIZE = 10 * 1024 * 1024

const FORMAT_LABELS: Record<FileConverterFormat, string> = {
  pdf: "PDF",
  word: "Word",
  json: "JSON",
  markdown: "Markdown",
}

const FORMAT_OPTIONS: FileConverterFormat[] = ["pdf", "word", "json", "markdown"]

const DEFAULT_JSON = `{
  "title": "转换示例",
  "content": [
    "第一段内容",
    {
      "heading": "小节标题",
      "text": "这里可以继续放正文。"
    }
  ]
}`

const DEFAULT_MARKDOWN = `# 转换示例

这是一段 Markdown 内容，可以转换为 PDF、Word 或 JSON。

- 支持标题
- 支持列表
- 支持基础文本结构`

type PreviewResult =
  | {
      kind: "file"
      objectUrl: string
      fileName: string
      contentType: string
      targetType: Extract<FileConverterFormat, "pdf" | "word">
    }
  | {
      kind: "text"
      data: string
      targetType: Extract<FileConverterFormat, "json" | "markdown">
    }

export function FileConverterPageContent() {
  const { toast } = useToast()
  const fileInputRef = useRef<HTMLInputElement | null>(null)
  const [targetType, setTargetType] = useState<FileConverterFormat>("markdown")
  const [activeTab, setActiveTab] = useState<FileConverterSourceTab>("file")
  const [uploadedFile, setUploadedFile] = useState<File | null>(null)
  const [uploadedFormat, setUploadedFormat] = useState<Extract<FileConverterFormat, "pdf" | "word"> | null>(null)
  const [jsonText, setJsonText] = useState(DEFAULT_JSON)
  const [markdownText, setMarkdownText] = useState(DEFAULT_MARKDOWN)
  const [isConverting, setIsConverting] = useState(false)
  const [result, setResult] = useState<PreviewResult | null>(null)
  const [copied, setCopied] = useState(false)

  const sourceType = useMemo(() => {
    if (activeTab === "file") return uploadedFormat
    return activeTab
  }, [activeTab, uploadedFormat])

  useEffect(() => {
    return () => {
      if (result?.kind === "file") {
        URL.revokeObjectURL(result.objectUrl)
      }
    }
  }, [result])

  const handleFileSelect = (file: File | null) => {
    if (!file) return

    const format = detectFileFormat(file)
    if (!format) {
      toast({
        title: "文件格式不支持",
        description: "文件上传仅支持 .pdf 和 .docx。",
        variant: "destructive",
      })
      if (fileInputRef.current) fileInputRef.current.value = ""
      return
    }

    if (file.size > MAX_FILE_SIZE) {
      toast({
        title: "文件过大",
        description: "请上传 10MB 以内的文件。",
        variant: "destructive",
      })
      if (fileInputRef.current) fileInputRef.current.value = ""
      return
    }

    setUploadedFile(file)
    setUploadedFormat(format)
  }

  const handleConvert = async () => {
    const currentSourceType = sourceType
    // The page rejects no-op and unsupported pairs before any network call so
    // users get immediate feedback and the API stays focused on real work.
    if (!currentSourceType) {
      toast({
        title: "缺少源内容",
        description: "请先上传文件或输入文本。",
        variant: "destructive",
      })
      return
    }

    if (currentSourceType === targetType) {
      toast({
        title: "源格式与目标格式相同，无需转换",
      })
      return
    }

    if (isPDFWordPair(currentSourceType, targetType)) {
      toast({
        title: "暂不支持 PDF 与 Word 之间的相互转换",
        variant: "destructive",
      })
      return
    }

    if (activeTab === "json" && !isValidJSON(jsonText)) {
      toast({
        title: "JSON 内容格式无效",
        description: "请修正后再转换。",
        variant: "destructive",
      })
      return
    }

    setIsConverting(true)
    setCopied(false)

    try {
      const converted =
        activeTab === "file"
          ? await convertUploadedFile(uploadedFile as File, targetType)
          : await convertTextContent({
              source_type: activeTab,
              target_type: targetType,
              content: activeTab === "json" ? jsonText : markdownText,
            })

      if (result?.kind === "file") {
        URL.revokeObjectURL(result.objectUrl)
      }

      if (converted.kind === "file") {
        setResult({
          kind: "file",
          objectUrl: URL.createObjectURL(converted.blob),
          fileName: converted.fileName,
          contentType: converted.contentType,
          targetType: targetType as Extract<FileConverterFormat, "pdf" | "word">,
        })
      } else {
        setResult({
          kind: "text",
          data: targetType === "json" ? formatJSONForDisplay(converted.data) : converted.data,
          targetType: targetType as Extract<FileConverterFormat, "json" | "markdown">,
        })
      }

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

  const handleCopy = async () => {
    if (!result || result.kind !== "text") return

    await navigator.clipboard.writeText(result.data)
    setCopied(true)
    toast({ title: "已复制到剪贴板" })
    window.setTimeout(() => setCopied(false), 1600)
  }

  const handleDownload = () => {
    if (!result || result.kind !== "file") return

    const link = document.createElement("a")
    link.href = result.objectUrl
    link.download = result.fileName
    document.body.appendChild(link)
    link.click()
    link.remove()
  }

  return (
    <div className="jw-app-shell min-h-screen">
      <LandingHeader activeItem="fileConverter" />

      <main className="mx-auto max-w-[1500px] px-4 pt-24 pb-5 sm:px-6 lg:pb-6">
        <div className="mb-4 flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-sm font-medium text-[var(--jw-accent)]">File Converter</p>
            <h1 className="jw-heading-text text-3xl font-semibold">文件转换</h1>
          </div>
          <p className="max-w-2xl text-sm text-[var(--jw-muted)]">
            支持 PDF、Word、JSON、Markdown 的文本化与文档化转换，文件上传限制 10MB。
          </p>
        </div>

        <div className="grid min-h-[680px] gap-4 xl:grid-cols-[430px_minmax(0,1fr)]">
          <section className="flex min-h-[680px] flex-col overflow-hidden rounded-lg border border-[var(--jw-border)] bg-[var(--jw-surface-strong)] shadow-[var(--jw-card-shadow)]">
            <div className="border-b border-[var(--jw-border-subtle)] p-4">
              <label className="mb-2 block text-sm font-medium text-[var(--jw-muted)]">目标格式</label>
              <Select value={targetType} onValueChange={(value) => setTargetType(value as FileConverterFormat)}>
                <SelectTrigger className="h-10 w-full bg-[var(--jw-surface)]">
                  <SelectValue placeholder="选择目标格式" />
                </SelectTrigger>
                <SelectContent>
                  {FORMAT_OPTIONS.map((format) => (
                    <SelectItem key={format} value={format}>
                      {FORMAT_LABELS[format]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <Tabs
              value={activeTab}
              onValueChange={(value) => setActiveTab(value as FileConverterSourceTab)}
              className="min-h-0 flex-1 gap-0"
            >
              <div className="border-b border-[var(--jw-border-subtle)] p-4">
                <TabsList className="grid h-10 w-full grid-cols-3 rounded-md">
                  <TabsTrigger value="file">文件上传</TabsTrigger>
                  <TabsTrigger value="json">JSON</TabsTrigger>
                  <TabsTrigger value="markdown">Markdown</TabsTrigger>
                </TabsList>
              </div>

              <div className="min-h-0 flex-1 p-4">
                <TabsContent value="file" className="h-full">
                  <FileUploadPanel
                    file={uploadedFile}
                    format={uploadedFormat}
                    inputRef={fileInputRef}
                    onFileSelect={handleFileSelect}
                    onClear={() => {
                      setUploadedFile(null)
                      setUploadedFormat(null)
                      if (fileInputRef.current) fileInputRef.current.value = ""
                    }}
                  />
                </TabsContent>
                <TabsContent value="json" className="h-full">
                  <EditorPanel
                    label="JSON 源内容"
                    value={jsonText}
                    onChange={setJsonText}
                    language="json"
                  />
                </TabsContent>
                <TabsContent value="markdown" className="h-full">
                  <EditorPanel
                    label="Markdown 源内容"
                    value={markdownText}
                    onChange={setMarkdownText}
                    language="markdown"
                  />
                </TabsContent>
              </div>
            </Tabs>

            <div className="border-t border-[var(--jw-border-subtle)] p-4">
              <div className="mb-3 flex items-center justify-between text-xs text-[var(--jw-muted)]">
                <span>源格式：{sourceType ? FORMAT_LABELS[sourceType] : "待选择"}</span>
                <span>目标格式：{FORMAT_LABELS[targetType]}</span>
              </div>
              <Button
                className="jw-primary-button h-11 w-full rounded-md"
                onClick={handleConvert}
                disabled={isConverting}
              >
                {isConverting ? <Loader2Icon className="size-4 animate-spin" /> : <RotateCwIcon className="size-4" />}
                {isConverting ? "转换中" : "开始转换"}
              </Button>
            </div>
          </section>

          <section className="flex min-h-[680px] flex-col overflow-hidden rounded-lg border border-[var(--jw-border)] bg-[var(--jw-surface-strong)] shadow-[var(--jw-card-shadow)]">
            <div className="flex h-14 items-center justify-between border-b border-[var(--jw-border-subtle)] px-4">
              <div className="flex items-center gap-2">
                <span className="flex size-8 items-center justify-center rounded-md bg-[var(--jw-accent-soft)] text-[var(--jw-accent)]">
                  <FileTextIcon className="size-4" />
                </span>
                <div>
                  <h2 className="jw-heading-text text-sm font-semibold">结果展示</h2>
                  <p className="text-xs text-[var(--jw-muted)]">预览框</p>
                </div>
              </div>
              {result?.kind === "file" ? (
                <div className="flex items-center gap-2">
                  <Button variant="outline" size="sm" className="h-8 rounded-md" asChild>
                    <a href={result.objectUrl} target="_blank" rel="noreferrer">
                      <FileCode2Icon className="size-4" />
                      预览
                    </a>
                  </Button>
                  <Button size="sm" className="jw-primary-button h-8 rounded-md" onClick={handleDownload}>
                    <DownloadIcon className="size-4" />
                    下载
                  </Button>
                </div>
              ) : result?.kind === "text" ? (
                <Button variant="outline" size="sm" className="h-8 rounded-md" onClick={handleCopy}>
                  {copied ? <CheckIcon className="size-4" /> : <ClipboardIcon className="size-4" />}
                  {copied ? "已复制" : "复制"}
                </Button>
              ) : null}
            </div>

            <div className="min-h-0 flex-1 p-4">
              <ResultPreview result={result} />
            </div>
          </section>
        </div>
      </main>
    </div>
  )
}

function FileUploadPanel({
  file,
  format,
  inputRef,
  onFileSelect,
  onClear,
}: {
  file: File | null
  format: Extract<FileConverterFormat, "pdf" | "word"> | null
  inputRef: RefObject<HTMLInputElement | null>
  onFileSelect: (file: File | null) => void
  onClear: () => void
}) {
  return (
    <div className="flex h-full flex-col gap-4">
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        className="flex min-h-[240px] w-full flex-1 flex-col items-center justify-center rounded-lg border border-dashed border-[var(--jw-border)] bg-[var(--jw-surface)] px-5 text-center transition-colors hover:border-[var(--jw-accent)] hover:bg-[var(--jw-accent-soft)]"
      >
        <FileUpIcon className="mb-3 size-10 text-[var(--jw-accent)]" />
        <span className="text-base font-semibold text-foreground">选择 PDF 或 Word 文件</span>
        <span className="mt-2 text-sm text-[var(--jw-muted)]">仅支持 .pdf、.docx，最大 10MB</span>
      </button>
      <input
        ref={inputRef}
        type="file"
        accept=".pdf,.docx,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
        className="hidden"
        onChange={(event) => onFileSelect(event.target.files?.[0] ?? null)}
      />

      {file && format ? (
        <div className="rounded-lg border border-[var(--jw-border-subtle)] bg-[var(--jw-surface)] p-3">
          <div className="flex min-w-0 items-center justify-between gap-3">
            <div className="min-w-0">
              <p className="truncate text-sm font-medium">{file.name}</p>
              <p className="text-xs text-[var(--jw-muted)]">
                {FORMAT_LABELS[format]} · {formatFileSize(file.size)}
              </p>
            </div>
            <Button type="button" variant="ghost" size="sm" className="h-8 rounded-md" onClick={onClear}>
              移除
            </Button>
          </div>
        </div>
      ) : null}
    </div>
  )
}

function EditorPanel({
  label,
  value,
  onChange,
  language,
}: {
  label: string
  value: string
  onChange: (value: string) => void
  language: "json" | "markdown"
}) {
  return (
    <div className="flex h-full min-h-[440px] flex-col gap-2">
      <label className="text-sm font-medium text-[var(--jw-muted)]">{label}</label>
      <Textarea
        value={value}
        onChange={(event) => onChange(event.target.value)}
        spellCheck={false}
        className="min-h-[420px] flex-1 resize-none rounded-lg border-[var(--jw-border)] bg-[var(--jw-surface)] font-mono text-sm leading-6"
        aria-label={language === "json" ? "JSON 源内容" : "Markdown 源内容"}
      />
    </div>
  )
}

function ResultPreview({ result }: { result: PreviewResult | null }) {
  if (!result) {
    return (
      <div className="flex h-full min-h-[560px] items-center justify-center rounded-lg border border-dashed border-[var(--jw-border)] bg-[var(--jw-surface)] p-6 text-center">
        <div>
          <FileCode2Icon className="mx-auto mb-3 size-10 text-[var(--jw-muted)]" />
          <p className="text-sm font-medium text-foreground">转换结果会显示在这里</p>
          <p className="mt-2 text-sm text-[var(--jw-muted)]">PDF 将以内嵌预览展示，Word 会生成可下载文件。</p>
        </div>
      </div>
    )
  }

  if (result.kind === "file") {
    if (result.targetType === "pdf") {
      return (
        <iframe
          src={result.objectUrl}
          title="PDF 预览"
          className="h-full min-h-[560px] w-full rounded-lg border border-[var(--jw-border)] bg-white"
        />
      )
    }

    // Browsers generally cannot render DOCX inline, so the preview frame
    // confirms generation while the header actions expose preview/download.
    return (
      <div className="flex h-full min-h-[560px] items-center justify-center rounded-lg border border-[var(--jw-border)] bg-[var(--jw-surface)] p-6 text-center">
        <div className="max-w-sm">
          <FileTextIcon className="mx-auto mb-3 size-12 text-[var(--jw-accent)]" />
          <p className="truncate text-base font-semibold">{result.fileName}</p>
          <p className="mt-2 text-sm text-[var(--jw-muted)]">Word 文件已生成。浏览器通常不会直接内嵌渲染 DOCX，可使用上方预览或下载按钮打开。</p>
        </div>
      </div>
    )
  }

  return (
    <pre className="h-full min-h-[560px] overflow-auto rounded-lg border border-[var(--jw-border)] bg-[#10151f] p-4 text-sm leading-6 text-slate-100">
      <HighlightedCode code={result.data} language={result.targetType} />
    </pre>
  )
}

function HighlightedCode({ code, language }: { code: string; language: "json" | "markdown" }) {
  if (language === "json") {
    return <code>{highlightJSON(code)}</code>
  }

  return <code>{highlightMarkdown(code)}</code>
}

function highlightJSON(code: string): ReactNode[] {
  const matcher = /("(?:\\u[\dA-Fa-f]{4}|\\[^u]|[^\\"])*"(?=\s*:))|("(?:\\u[\dA-Fa-f]{4}|\\[^u]|[^\\"])*")|(\btrue\b|\bfalse\b|\bnull\b)|(-?\d+(?:\.\d+)?(?:[eE][+-]?\d+)?)|([{}[\],:])/g
  return tokenize(code, matcher, (match, index) => {
    const token = match[0]
    let className = "text-slate-100"
    if (match[1]) {
      className = "text-sky-300"
    } else if (/^"/.test(token)) {
      className = "text-emerald-300"
    } else if (/^(true|false|null)$/.test(token)) {
      className = "text-violet-300"
    } else if (/^-?\d/.test(token)) {
      className = "text-amber-300"
    } else if (/^[{}[\],:]$/.test(token)) {
      className = "text-slate-400"
    }
    return (
      <span key={index} className={className}>
        {token}
      </span>
    )
  })
}

function highlightMarkdown(code: string): ReactNode[] {
  return code.split(/(\n)/).map((part, index) => {
    if (part === "\n") return part
    if (/^#{1,6}\s/.test(part)) {
      return (
        <span key={index} className="text-sky-300">
          {part}
        </span>
      )
    }
    if (/^\s*[-*]\s/.test(part)) {
      return (
        <span key={index} className="text-emerald-300">
          {part}
        </span>
      )
    }
    if (/^```/.test(part)) {
      return (
        <span key={index} className="text-violet-300">
          {part}
        </span>
      )
    }
    return part
  })
}

function tokenize(
  code: string,
  matcher: RegExp,
  renderToken: (match: RegExpMatchArray, index: number) => ReactNode,
): ReactNode[] {
  const nodes: ReactNode[] = []
  let lastIndex = 0
  let index = 0
  for (const match of code.matchAll(matcher)) {
    if (match.index === undefined) continue
    if (match.index > lastIndex) {
      nodes.push(code.slice(lastIndex, match.index))
    }
    nodes.push(renderToken(match, index))
    index += 1
    lastIndex = match.index + match[0].length
  }
  if (lastIndex < code.length) {
    nodes.push(code.slice(lastIndex))
  }
  return nodes
}

function detectFileFormat(file: File): Extract<FileConverterFormat, "pdf" | "word"> | null {
  const name = file.name.toLowerCase()
  if (name.endsWith(".pdf") || file.type === "application/pdf") return "pdf"
  if (name.endsWith(".docx") || file.type === "application/vnd.openxmlformats-officedocument.wordprocessingml.document") {
    return "word"
  }
  return null
}

function isPDFWordPair(sourceType: FileConverterFormat, targetType: FileConverterFormat): boolean {
  return (sourceType === "pdf" && targetType === "word") || (sourceType === "word" && targetType === "pdf")
}

function isValidJSON(value: string): boolean {
  try {
    JSON.parse(value)
    return true
  } catch {
    return false
  }
}

function formatJSONForDisplay(value: string): string {
  try {
    return JSON.stringify(JSON.parse(value), null, 2)
  } catch {
    return value
  }
}

function formatFileSize(size: number): string {
  if (size < 1024) return `${size} B`
  if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)} KB`
  return `${(size / 1024 / 1024).toFixed(1)} MB`
}
