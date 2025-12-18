"use client"

import type React from "react"

import { useState, useRef } from "react"
import Image from "next/image"
import { ImageIcon, PaperclipIcon, SendIcon, XIcon, UserIcon, BotIcon } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

type Message = {
  id: number
  role: "user" | "assistant"
  content: string
  tags: string[]
  images?: string[]
  timestamp: Date
}

// Example templates
const examples = [
  { id: 1, name: "赛博朋克城市", preview: "/cyberpunk-city-neon.jpg" },
  { id: 2, name: "水彩花卉", preview: "/watercolor-flowers.jpg" },
  { id: 3, name: "未来科技", preview: "/futuristic-technology.png" },
  { id: 4, name: "复古海报", preview: "/vintage-poster-art.jpg" },
  { id: 5, name: "抽象艺术", preview: "/colorful-abstract-art.png" },
  { id: 6, name: "自然风光", preview: "/serene-mountain-lake.png" },
  { id: 7, name: "卡通角色", preview: "/cartoon-character-cute.jpg" },
  { id: 8, name: "建筑设计", preview: "/modern-architecture-cityscape.png" },
]

const mockMessages: Message[] = [
  {
    id: 1,
    role: "user",
    content: "生成一个充满科技感的未来城市",
    tags: ["未来科技", "赛博朋克城市"],
    timestamp: new Date("2024-01-15T10:30:00"),
  },
  {
    id: 2,
    role: "assistant",
    content: "已为您生成图片",
    tags: [],
    images: ["/futuristic-technology.png"],
    timestamp: new Date("2024-01-15T10:30:15"),
  },
  {
    id: 3,
    role: "user",
    content: "创建一幅温馨的水彩花卉画",
    tags: ["水彩花卉"],
    timestamp: new Date("2024-01-15T14:20:00"),
  },
  {
    id: 4,
    role: "assistant",
    content: "已为您生成图片",
    tags: [],
    images: ["/watercolor-flowers.jpg"],
    timestamp: new Date("2024-01-15T14:20:12"),
  },
]

export function ImageGeneration() {
  const [input, setInput] = useState("")
  const [tags, setTags] = useState<string[]>([])
  const [uploadedImages, setUploadedImages] = useState<File[]>([])
  const [hoveredExample, setHoveredExample] = useState<number | null>(null)
  const [messages, setMessages] = useState<Message[]>(mockMessages)
  const [isChatExpanded, setIsChatExpanded] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleExampleClick = (name: string) => {
    setTags([...tags, name])
  }

  const removeTag = (index: number) => {
    setTags(tags.filter((_, i) => i !== index))
  }

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    setUploadedImages([...uploadedImages, ...files])
  }

  const removeImage = (index: number) => {
    setUploadedImages(uploadedImages.filter((_, i) => i !== index))
  }

  const handleSubmit = () => {
    if (!input.trim() && tags.length === 0) return

    const newMessage: Message = {
      id: messages.length + 1,
      role: "user",
      content: input,
      tags: [...tags],
      timestamp: new Date(),
    }

    setMessages([...messages, newMessage])
    setIsChatExpanded(true)
    setInput("")
    setTags([])
    setUploadedImages([])

    // Simulate assistant response after 1 second
    setTimeout(() => {
      const assistantMessage: Message = {
        id: messages.length + 2,
        role: "assistant",
        content: "正在为您生成图片...",
        tags: [],
        timestamp: new Date(),
      }
      setMessages((prev) => [...prev, assistantMessage])
    }, 1000)
  }

  return (
    <main className="flex-1 overflow-auto">
      {/* Header */}
      <header className="border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-10">
        <div className="px-8 py-6">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary/10">
              <ImageIcon className="w-6 h-6 text-primary" />
            </div>
            <div>
              <h2 className="text-2xl font-semibold text-foreground">图片生成</h2>
              <p className="text-sm text-muted-foreground mt-0.5">AI-powered image generation tools</p>
            </div>
          </div>
        </div>
      </header>

      {/* Content Area */}
      <div className="p-8 max-w-5xl mx-auto">
        {isChatExpanded && messages.length > 0 && (
          <div className="mb-6 space-y-4 animate-in slide-in-from-top-4 fade-in duration-500">
            {messages.map((message) => (
              <div
                key={message.id}
                className={cn("flex gap-4", message.role === "user" ? "justify-end" : "justify-start")}
              >
                {message.role === "assistant" && (
                  <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <BotIcon className="w-4 h-4 text-primary" />
                  </div>
                )}

                <div
                  className={cn(
                    "max-w-[70%] rounded-lg p-4",
                    message.role === "user" ? "bg-primary text-primary-foreground" : "bg-card border border-border",
                  )}
                >
                  {message.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mb-2">
                      {message.tags.map((tag, idx) => (
                        <span
                          key={idx}
                          className={cn(
                            "px-2 py-0.5 rounded text-xs font-medium",
                            message.role === "user" ? "bg-primary-foreground/20" : "bg-primary/10 text-primary",
                          )}
                        >
                          [{tag}]
                        </span>
                      ))}
                    </div>
                  )}

                  <p className="text-sm leading-relaxed">{message.content}</p>

                  {message.images && message.images.length > 0 && (
                    <div className="mt-3 grid grid-cols-2 gap-2">
                      {message.images.map((img, idx) => (
                        <Image
                          key={idx}
                          src={img || "/placeholder.svg"}
                          alt="Generated"
                          width={200}
                          height={128}
                          className="w-full h-32 object-cover rounded-md"
                        />
                      ))}
                    </div>
                  )}

                  <p className="text-xs opacity-60 mt-2">
                    {message.timestamp.toLocaleTimeString("zh-CN", {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </p>
                </div>

                {message.role === "user" && (
                  <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center flex-shrink-0">
                    <UserIcon className="w-4 h-4 text-primary-foreground" />
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Chat Input Area */}
        <div className="bg-card border border-border rounded-lg shadow-sm">
          {/* Tags Display */}
          {tags.length > 0 && (
            <div className="p-4 border-b border-border flex flex-wrap gap-2">
              {tags.map((tag, index) => (
                <div
                  key={index}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-primary/10 text-primary rounded-md text-sm font-medium"
                >
                  <span>[{tag}]</span>
                  <button onClick={() => removeTag(index)} className="hover:text-primary/80 transition-colors">
                    <XIcon className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Uploaded Images Display */}
          {uploadedImages.length > 0 && (
            <div className="p-4 border-b border-border">
              <div className="flex flex-wrap gap-3">
                {uploadedImages.map((file, index) => (
                  <div key={index} className="relative group">
                    <div className="w-20 h-20 rounded-lg border border-border bg-muted overflow-hidden">
                      <Image
                        src={URL.createObjectURL(file) || "/placeholder.svg"}
                        alt={file.name}
                        width={80}
                        height={80}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <button
                      onClick={() => removeImage(index)}
                      className="absolute -top-2 -right-2 w-5 h-5 bg-destructive text-destructive-foreground rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <XIcon className="w-3 h-3" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Input Area */}
          <div className="p-4">
            <div className="flex items-end gap-3">
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileSelect}
                accept="image/*"
                multiple
                className="hidden"
              />

              <button
                onClick={() => fileInputRef.current?.click()}
                className="p-2.5 rounded-lg border border-border hover:bg-accent hover:text-accent-foreground transition-colors"
                title="上传参考图"
              >
                <PaperclipIcon className="w-5 h-5" />
              </button>

              <textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="描述你想要生成的图片..."
                className="flex-1 resize-none bg-transparent border-0 focus:outline-none text-foreground placeholder:text-muted-foreground min-h-[44px] max-h-[200px] py-2.5"
                rows={1}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault()
                    handleSubmit()
                  }
                }}
              />

              <Button
                onClick={handleSubmit}
                size="icon"
                className="rounded-lg"
                disabled={!input.trim() && tags.length === 0}
              >
                <SendIcon className="w-5 h-5" />
              </Button>
            </div>
          </div>
        </div>

        {/* Example Templates */}
        {!isChatExpanded && (
          <div className="mt-8 pt-8 border-t border-dashed border-border/60 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <h3 className="text-lg font-semibold text-foreground mb-4">案例参考</h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
              {examples.map((example) => (
                <div key={example.id} className="relative">
                  <button
                    onClick={() => handleExampleClick(example.name)}
                    onMouseEnter={() => setHoveredExample(example.id)}
                    onMouseLeave={() => setHoveredExample(null)}
                    className={cn(
                      "w-full px-4 py-3 rounded-lg border border-border bg-card text-card-foreground",
                      "hover:border-primary hover:bg-primary/5 transition-all duration-200",
                      "text-sm font-medium text-center",
                    )}
                  >
                    {example.name}
                  </button>

                  {/* Hover Preview Image */}
                  {hoveredExample === example.id && (
                    <div className="absolute left-1/2 -translate-x-1/2 top-full mt-2 z-20 animate-in fade-in slide-in-from-top-2 duration-200">
                      <div className="bg-popover border border-border rounded-lg shadow-lg overflow-hidden">
                        <Image
                          src={example.preview || "/placeholder.svg"}
                          alt={example.name}
                          width={192}
                          height={128}
                          className="w-48 h-32 object-cover"
                        />
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </main>
  )
}
