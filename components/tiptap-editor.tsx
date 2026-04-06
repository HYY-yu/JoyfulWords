"use client";

import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Underline from "@tiptap/extension-underline";
import { Markdown } from "@tiptap/markdown";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { TiptapToolbar } from "./ui/editor/tiptap-toolbar";
import { CustomImage, CustomHighlight, CustomTextAlign, CustomLink, AIPendingBlock } from "@/lib/tiptap-extensions";
import { ImageMenu } from "./ui/editor/image-menu";
import { LinkMenu } from "./ui/editor/link-menu";
import { AIRewriteDialog } from "./ui/ai/ai-rewrite-dialog";
import { AIMindMapDialog } from "./ui/ai/ai-mindmap-dialog";
import { uploadImageToR2, validateImageFile } from "@/lib/tiptap-image-upload";
import { useToast } from "@/hooks/use-toast";
import { useTranslation } from "@/lib/i18n/i18n-context";
import type { AutoSaveState } from "@/lib/hooks/use-auto-save";
import { markdownToHTML } from "@/lib/tiptap-utils";
import type { AIEditState } from "@/lib/hooks/use-ai-edit-state";


interface TiptapEditorProps {
  content?: string;
  onChange?: (content: string, html: string) => void;
  placeholder?: string;
  editable?: boolean;
  saveStatus?: AutoSaveState;
  articleId?: number;
  mode?: "create" | "edit";
  // 异步 AI 编辑任务列表（从父组件注入）
  aiEditTasks?: Map<string, AIEditState>;
  // 当前打开的 dialog 对应的 exec_id
  activeExecId?: string | null;
  // 点击 AIPendingBlock 时的回调
  onAIPendingBlockClick?: (execId: string) => void;
  // 新任务提交成功后的回调
  onTaskSubmitted?: (task: AIEditState) => void;
  // 结果已被用户消费后，父组件调用此回调清除
  onAIEditResultConsumed?: (execId: string) => void;
  // 当前用户 ID（传给 dialog 用于保存 localStorage 的 key）
  userId?: number | string;
  // Dialog 打开状态变化回调
  onAIDialogOpenChange?: (open: boolean) => void;
}

export function TiptapEditor({
  content = "",
  onChange,
  placeholder = "开始撰写您的内容...",
  editable = true,
  saveStatus,
  articleId,
  mode = "create",
  aiEditTasks = new Map(),
  activeExecId,
  onAIPendingBlockClick,
  onTaskSubmitted,
  onAIEditResultConsumed,
  userId,
}: TiptapEditorProps) {
  // 添加图片上传状态
  const [isUploadingImage, setIsUploadingImage] = useState(false);

  // AI 改写对话框状态
  const [isAIDialogOpen, setIsAIDialogOpen] = useState(false);
  const [dialogExecId, setDialogExecId] = useState<string | null>(null); // null = 新请求，有值 = 查看已有任务
  const [selectedTextForAI, setSelectedTextForAI] = useState("");
  const [isMindMapDialogOpen, setIsMindMapDialogOpen] = useState(false);

  // 添加国际化支持
  const { t } = useTranslation();

  // 添加toast提示
  const { toast } = useToast();

  // 获取当前活动的任务
  const activeTask = dialogExecId ? aiEditTasks.get(dialogExecId) : null;
  const aiEditResult = activeTask?.result_text || null;

  // 调试日志
  useEffect(() => {
    console.log('[TiptapEditor] State update:', {
      dialogExecId,
      activeTask,
      aiEditResult,
      allTaskIds: Array.from(aiEditTasks.keys())
    })
  }, [dialogExecId, activeTask, aiEditResult, aiEditTasks])

  // 记录已处理的 exec_id，避免重复插入 AIPendingBlock
  const processedExecIdRef = useRef<Set<string>>(new Set());

  // 监听 activeExecId 变化（从 AIPendingBlock 点击）
  useEffect(() => {
    if (activeExecId && !isAIDialogOpen) {
      // 只在 dialog 未打开时响应 activeExecId 变化
      // 避免覆盖用户点击工具栏按钮发起的新请求
      setDialogExecId(activeExecId);
      setIsAIDialogOpen(true);
      const task = aiEditTasks.get(activeExecId);
      if (task) {
        setSelectedTextForAI(task.cut_text);
      }
    }
  }, [activeExecId, aiEditTasks, isAIDialogOpen]);

  // 确定初始内容： HTML
  const initialContent = content;

  // 使用 useMemo 来稳定扩展配置，避免重新创建
  const extensions = useMemo(() => [
    StarterKit.configure({
      heading: {
        levels: [1, 2, 3],
      },
      link: false,  // 禁用 StarterKit 中的 link（如果存在）
      underline: false,  // 禁用 StarterKit 中的 underline（如果存在）
    }),
    CustomLink.configure({
      openOnClick: false,
      autolink: true,
      linkOnPaste: true,
      HTMLAttributes: {
        class: "text-blue-600 underline cursor-pointer",
      },
    }),
    Underline,
    CustomImage.configure({
      inline: false,
      allowBase64: true,
      HTMLAttributes: {
        class: "max-w-full h-auto rounded-lg",
      },
    }),
    CustomHighlight,  // Text highlighting with colors
    CustomTextAlign,  // Text alignment (left, center, right, justify)
    Markdown,         // Markdown extension for export functionality
    AIPendingBlock,   // AI 异步编辑等待占位节点
  ], []);

  const editor = useEditor({
    extensions,
    content: initialContent,
    editable,
    immediatelyRender: false,
    editorProps: {
      attributes: {
        class: "prose prose-lg dark:prose-invert max-w-none focus:outline-none min-h-[400px] p-6 prose-headings:font-bold prose-a:text-blue-600 prose-a:underline hover:prose-a:text-blue-700 dark:prose-a:text-blue-400 dark:hover:prose-a:text-blue-300",
        placeholder,
      },
    },
    onUpdate: ({ editor }) => {
      const html = editor.getHTML();
      const text = editor.getText();

      onChange?.(text, html);
    },
  });

  // Track if we're updating from props to avoid infinite loops
  const isExternalUpdate = useRef(false);

  // 标准化 HTML（去除空格、换行等差异）
  const normalizeHTML = useCallback((html: string) => {
    return html.trim().replace(/\s+/g, ' ');
  }, []);

  // Update editor content when content prop changes from parent
  useEffect(() => {
    if (editor && content !== undefined) {
      const currentHTML = editor.getHTML();
      const normalizedContent = normalizeHTML(content);
      const normalizedCurrent = normalizeHTML(currentHTML);

      // ✅ 使用标准化比较，只有内容真正不同时才更新
      if (normalizedContent !== normalizedCurrent && !isExternalUpdate.current) {
        isExternalUpdate.current = true;
        editor.commands.setContent(content, { emitUpdate: false }); // 不触发 onUpdate

        // ✅ 使用 requestAnimationFrame 确保更新完成
        requestAnimationFrame(() => {
          isExternalUpdate.current = false;
        });
      }
    }
  }, [content, editor, normalizeHTML]);

  // 应用 AI 改写结果：找到 AIPendingBlock 节点，用改写文本替换
  // 使用 dialogExecId 定位要替换的节点
  const applyAIRewrite = useCallback(async (rewrittenText: string) => {
    if (!editor || !dialogExecId) return;

    try {
      const html = await markdownToHTML(rewrittenText);

      // 通过 exec_id 精确定位 AIPendingBlock
      let pendingPos = -1;
      let pendingEnd = -1;

      editor.state.doc.descendants((node, pos) => {
        if (node.type.name === 'aiPendingBlock' && node.attrs.exec_id === dialogExecId) {
          pendingPos = pos;
          pendingEnd = pos + node.nodeSize;
          return false;
        }
      });

      if (pendingPos !== -1) {
        editor.chain()
          .focus()
          .deleteRange({ from: pendingPos, to: pendingEnd })
          .insertContentAt(pendingPos, html)
          .run();

        console.info('[TiptapEditor] AIPendingBlock replaced for exec_id:', dialogExecId);

        // 清除已处理记录
        processedExecIdRef.current.delete(dialogExecId);

        // 通知父组件结果已消费
        onAIEditResultConsumed?.(dialogExecId);

        // 关闭 dialog
        setIsAIDialogOpen(false);
        setDialogExecId(null);
        return;
      }

      // 找不到 AIPendingBlock，报错
      console.error('[TiptapEditor] Failed to apply AI rewrite: cannot locate AIPendingBlock for exec_id:', dialogExecId);
      toast({
        variant: "destructive",
        title: t("tiptapEditor.toast.applyFailed") || "应用失败",
        description: t("tiptapEditor.toast.cannotLocateContent") || "无法定位要替换的等待块",
      });

      // 仍然通知父组件清除状态
      onAIEditResultConsumed?.(dialogExecId);

      // 关闭 dialog
      setIsAIDialogOpen(false);
      setDialogExecId(null);
    } catch (error) {
      console.error('[TiptapEditor] Error applying AI rewrite:', error);
      toast({
        variant: "destructive",
        title: t("tiptapEditor.toast.applyFailed") || "应用失败",
        description: error instanceof Error ? error.message : t("tiptapEditor.toast.unknownError"),
      });

      // 通知父组件清除状态
      onAIEditResultConsumed?.(dialogExecId);

      // 关闭 dialog
      setIsAIDialogOpen(false);
      setDialogExecId(null);
    }
  }, [editor, dialogExecId, onAIEditResultConsumed, toast, t]);

  // 恢复原始文本：删除 AIPendingBlock，恢复原始的 cut_text
  const handleRestoreOriginal = useCallback(() => {
    if (!editor || !dialogExecId) return;

    const task = aiEditTasks.get(dialogExecId);
    if (!task) {
      console.error('[TiptapEditor] Task not found for exec_id:', dialogExecId);
      return;
    }

    const originalText = task.cut_text;
    if (!originalText) {
      console.error('[TiptapEditor] No cut_text in task');
      return;
    }

    // 通过 exec_id 精确定位 AIPendingBlock
    let pendingPos = -1;
    let pendingEnd = -1;

    editor.state.doc.descendants((node, pos) => {
      if (node.type.name === 'aiPendingBlock' && node.attrs.exec_id === dialogExecId) {
        pendingPos = pos;
        pendingEnd = pos + node.nodeSize;
        return false;
      }
    });

    if (pendingPos !== -1) {
      // 删除 AIPendingBlock，插入原始文本
      editor.chain()
        .focus()
        .deleteRange({ from: pendingPos, to: pendingEnd })
        .insertContentAt(pendingPos, originalText)
        .run();

      console.info('[TiptapEditor] Original text restored for exec_id:', dialogExecId);

      // 清除已处理记录
      processedExecIdRef.current.delete(dialogExecId);

      // 通知父组件清除状态
      onAIEditResultConsumed?.(dialogExecId);

      // 关闭 dialog
      setIsAIDialogOpen(false);
      setDialogExecId(null);
    } else {
      console.error('[TiptapEditor] Failed to restore: cannot locate AIPendingBlock for exec_id:', dialogExecId);
      toast({
        variant: "destructive",
        title: t("tiptapEditor.toast.restoreFailed") || "恢复失败",
        description: t("tiptapEditor.toast.cannotLocatePendingBlock") || "无法定位要恢复的等待块",
      });

      // 仍然通知父组件清除状态
      onAIEditResultConsumed?.(dialogExecId);

      // 关闭 dialog
      setIsAIDialogOpen(false);
      setDialogExecId(null);
    }
  }, [editor, dialogExecId, aiEditTasks, onAIEditResultConsumed, toast, t]);

  // 处理 AI 改写 - 等待中时忽略点击
  const handleAIRewrite = useCallback(() => {
    // 检查是否为创建模式，如果是则禁止打开 AI 改写对话框
    if (mode === "create") {
      toast({
        variant: "destructive",
        title: t("tiptapEditor.toast.saveBeforeAIRewrite"),
        description: t("tiptapEditor.toast.saveBeforeAIRewriteDesc"),
      });
      return;
    }

    if (!editor) return;

    const { state } = editor;
    const { from, to } = state.selection;
    const text = state.doc.textBetween(from, to, ' ');

    if (text.trim().length === 0) {
      toast({
        variant: "destructive",
        title: t("tiptapEditor.toast.selectTextFirst"),
        description: t("tiptapEditor.toast.selectTextFirstDesc"),
      });
      return;
    }

    setSelectedTextForAI(text);
    setDialogExecId(null); // null 表示新的 AI 编辑请求
    setIsAIDialogOpen(true);
  }, [editor, toast, mode, t]);

  const handleOpenMindMap = useCallback(() => {
    if (mode === "create") {
      toast({
        variant: "destructive",
        title: t("aiMindmap.toast.articleRequired"),
        description: t("aiMindmap.toast.articleRequiredDesc"),
      });
      return;
    }

    if (!editor || !articleId) {
      toast({
        variant: "destructive",
        title: t("aiMindmap.toast.articleRequired"),
        description: t("aiMindmap.toast.articleRequiredDesc"),
      });
      return;
    }

    const sourceText = editor.getText();

    if (!sourceText.trim()) {
      toast({
        variant: "destructive",
        title: t("aiMindmap.toast.emptyArticle"),
        description: t("aiMindmap.toast.emptyArticleDesc"),
      });
      return;
    }

    setIsMindMapDialogOpen(true);
  }, [articleId, editor, mode, t, toast]);

  // Expose editor methods and set up global click handler
  useEffect(() => {
    if (editor) {
      // Make editor available globally for external access
      (window as any).tiptapEditor = editor;

      // 设置全局点击处理函数
      (window as any).handleAIPendingBlockClick = (execId: string) => {
        console.log('[TiptapEditor] Global handler called with exec_id:', execId);
        console.log('[TiptapEditor] onAIPendingBlockClick callback:', typeof onAIPendingBlockClick);
        onAIPendingBlockClick?.(execId);
      };

      // 监听 AI 编辑任务提交事件，立即插入 AIPendingBlock
      const handleTaskSubmitted = (e: CustomEvent) => {
        const { execId, cutText } = e.detail;
        console.log('[TiptapEditor] AI edit task submitted event:', { execId, cutText });

        if (!cutText || !editor) return;

        // 直接从当前选区插入 AIPendingBlock
        const { from, to } = editor.state.selection;

        // 验证选区文本（可选，仅用于日志）
        const selectedText = editor.state.doc.textBetween(from, to);
        if (selectedText.trim() !== cutText.trim()) {
          console.warn('[TiptapEditor] Selected text changed, still inserting AIPendingBlock');
        }

        editor.chain()
          .focus()
          .deleteRange({ from, to })
          .insertContentAt(from, {
            type: 'aiPendingBlock',
            attrs: { text: cutText, exec_id: execId }
          })
          .run();

        processedExecIdRef.current.add(execId);
        console.info('[TiptapEditor] AIPendingBlock inserted immediately for exec_id:', execId);
      };

      const handleOpenAIEdit = () => {
        console.log('[TiptapEditor] Received external AI edit trigger');
        handleAIRewrite();
      };

      const handleOpenAIMindMap = () => {
        console.debug("[TiptapEditor] Received external AI mindmap trigger");
        handleOpenMindMap();
      };

      window.addEventListener('ai-edit-task-submitted', handleTaskSubmitted as EventListener);
      window.addEventListener('joyfulwords-open-ai-edit', handleOpenAIEdit as EventListener);
      window.addEventListener('joyfulwords-open-ai-mindmap', handleOpenAIMindMap as EventListener);

      console.log('[TiptapEditor] Global click handler registered');
      console.log('[TiptapEditor] window.handleAIPendingBlockClick:', typeof (window as any).handleAIPendingBlockClick);

      // 清理函数
      return () => {
        console.log('[TiptapEditor] Cleaning up global handler');
        delete (window as any).handleAIPendingBlockClick;
        window.removeEventListener('ai-edit-task-submitted', handleTaskSubmitted as EventListener);
        window.removeEventListener('joyfulwords-open-ai-edit', handleOpenAIEdit as EventListener);
        window.removeEventListener('joyfulwords-open-ai-mindmap', handleOpenAIMindMap as EventListener);
      };
    }
  }, [editor, onAIPendingBlockClick, handleAIRewrite, handleOpenMindMap]);

  // Handle image upload using presigned URL
  const handleImageUpload = useCallback(async (file: File): Promise<string> => {
    console.log("开始上传图片到 R2，文件：", file.name, file.size)

    try {
      // 使用新的安全上传方式
      const url = await uploadImageToR2(file)

      console.log("图片上传成功，URL：", url)
      return url
    } catch (error) {
      console.error("图片上传失败：", error)

      // 重新抛出错误,让调用者处理
      throw error
    }
  }, [])

  const insertImage = useCallback(() => {
    console.log("insertImage 函数被调用");

    if (!editor) {
      console.error("编辑器未初始化");
      toast({
        variant: "destructive",
        title: t("contentWriting.writing.uploadFailed"),
        description: t("tiptapEditor.toast.editorNotReady"),
      });
      return;
    }

    if (isUploadingImage) {
      console.log("正在上传图片，请稍候...");
      return;
    }

    // 创建一个隐藏的文件输入框
    const input = document.createElement("input");
    input.type = "file";
    input.accept = "image/*";
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;

      console.log("选择的图片文件：", file.name, file.size);

      try {
        // 验证文件
        const validation = validateImageFile(file);
        if (!validation.valid) {
          toast({
            variant: "destructive",
            title: t("contentWriting.writing.uploadFailed"),
            description: t(`contentWriting.writing.${validation.error}`),
          });
          return;
        }

        // 设置上传状态为 true
        setIsUploadingImage(true);

        // 显示上传中提示
        toast({
          title: t("contentWriting.writing.uploading"),
          description: t("tiptapEditor.toast.uploadingImage"),
        });

        console.log("开始上传图片...");

        // 上传图片 - 等待完成
        const url = await handleImageUpload(file);
        console.log("✅ 图片上传成功，URL：", url);

        // 等待状态更新
        await new Promise(resolve => setTimeout(resolve, 200));

        // 尝试多种插入方法，确保至少一种成功
        let success = false;

        // 方法 1: 使用 setImage 命令（推荐）
        console.log("尝试方法 1: setImage");
        success = editor.chain().focus().setImage({ src: url, alt: file.name }).run();
        console.log("方法 1 结果:", success);

        if (!success) {
          // 方法 2: 插入节点对象
          console.log("尝试方法 2: insertContent with node");
          success = editor.chain().focus().insertContent({
            type: 'image',
            attrs: {
              src: url,
              alt: file.name,
            },
          }).run();
          console.log("方法 2 结果:", success);
        }

        // 强制刷新编辑器视图
        editor.commands.focus();

        // 显示成功提示
        toast({
          title: t("contentWriting.writing.uploadSuccess"),
          description: t("tiptapEditor.toast.imageInserted"),
        });

        // 验证图片是否成功插入（仅用于调试，不显示错误提示）
        setTimeout(() => {
          const html = editor.getHTML();
          console.log("验证：当前编辑器 HTML：", html);

          if (html.includes('<img') && html.includes(url)) {
            console.log("✅ 验证成功：图片已在编辑器中");
          } else {
            console.warn("⚠️ 验证延迟：图片可能还在加载中");
            console.log("编辑器 JSON：", JSON.stringify(editor.state.doc.toJSON(), null, 2));
            // 再次验证，延长时间
            setTimeout(() => {
              const html2 = editor.getHTML();
              if (html2.includes('<img') && html2.includes(url)) {
                console.log("✅ 二次验证成功：图片已在编辑器中");
              } else {
                console.error("❌ 二次验证失败：图片未在编辑器中");
                // 只在开发环境显示 alert
                if (process.env.NODE_ENV === 'development') {
                  console.error("图片插入验证失败，但图片可能已经显示。请检查编辑器。");
                }
              }
            }, 1000);
          }
        }, 500);

      } catch (error) {
        console.error("图片上传失败：", error);
        const errorMessage = error instanceof Error ? error.message : '未知错误';

        // 翻译错误消息
        const displayError = errorMessage.startsWith('contentWriting.')
          ? t(errorMessage)
          : `${t("contentWriting.writing.uploadError").replace('{error}', errorMessage)}`;

        toast({
          variant: "destructive",
          title: t("contentWriting.writing.uploadFailed"),
          description: displayError,
        });
      } finally {
        // 重置上传状态
        setIsUploadingImage(false);
      }
    };

    input.click();
  }, [editor, handleImageUpload, isUploadingImage, toast, t]);

  const editorShellClassName =
    mode === "edit"
      ? "flex h-full w-full flex-col overflow-hidden bg-transparent"
      : "flex h-full w-full flex-col overflow-hidden rounded-lg border bg-background";

  return (
    <div className={editorShellClassName}>
      <TiptapToolbar
        editor={editor}
        onInsertImage={insertImage}
        isUploadingImage={isUploadingImage}
        saveStatus={saveStatus}
        mode={mode}
      />
      <div
        className="flex-1 overflow-y-auto min-h-0"
        onDrop={(e) => {
          const text = e.dataTransfer.getData("text/plain");
          if (text && editor) {
            e.preventDefault();
            const pos = editor.view.posAtCoords({ left: e.clientX, top: e.clientY });
            if (pos) {
              editor.chain().focus().insertContentAt(pos.pos, text).run();
            }
          }
        }}
        onDragOver={(e) => {
          e.preventDefault();
          e.dataTransfer.dropEffect = "copy";
        }}
      >
        <EditorContent editor={editor} className="h-full" />
      </div>
      {editor && <ImageMenu editor={editor} />}
      {editor && <LinkMenu editor={editor} />}
      <AIRewriteDialog
        open={isAIDialogOpen}
        onOpenChange={(open) => {
          setIsAIDialogOpen(open);
          if (open) {
            // Dialog 打开时让编辑器失焦，避免 aria-hidden 警告
            editor?.view.dom.blur();
          } else {
            setDialogExecId(null);
            setSelectedTextForAI('');
            // 通知父组件清除 activeExecId，避免无限弹出
            onAIPendingBlockClick?.('');  // 空字符串表示清除
          }
        }}
        articleId={articleId || 0}
        selectedText={selectedTextForAI}
        articleContent={editor?.getHTML() || ''}
        onRewrite={applyAIRewrite}
        onCancel={handleRestoreOriginal}
        onTaskSubmitted={onTaskSubmitted}
        waitingState={activeTask}
        initialRewrittenText={aiEditResult || undefined}
        userId={userId}
      />
      <AIMindMapDialog
        open={isMindMapDialogOpen}
        onOpenChange={setIsMindMapDialogOpen}
        articleId={articleId || 0}
      />
    </div>
  );
}
