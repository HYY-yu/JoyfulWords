"use client";

import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Underline from "@tiptap/extension-underline";
import { Markdown } from "@tiptap/markdown";
import type { EditorView } from "@tiptap/pm/view";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { TiptapToolbar } from "./ui/editor/tiptap-toolbar";
import { CustomImage, CustomHighlight, CustomTextAlign, CustomLink } from "@/lib/tiptap-extensions";
import { ImageMenu } from "./ui/editor/image-menu";
import { LinkMenu } from "./ui/editor/link-menu";
import { AIRewriteDialog } from "./ui/ai/ai-rewrite-dialog";
import { AIMindMapDialog } from "./ui/ai/ai-mindmap-dialog";
import { uploadImageToR2, validateImageFile } from "@/lib/tiptap-image-upload";
import { useToast } from "@/hooks/use-toast";
import { useTranslation } from "@/lib/i18n/i18n-context";
import type { AutoSaveState } from "@/lib/hooks/use-auto-save";
import { markdownToHTML } from "@/lib/tiptap-utils";
import { taskCenterClient } from "@/lib/api/taskcenter/client";
import {
  getImageFileFromClipboardData,
  getImageFileFromDataTransfer,
  getMaterialImageFromDataTransfer,
} from "@/lib/editor-drag-drop";
import type {
  TaskCenterArticleTaskDetail,
  TaskCenterTaskReference,
} from "@/lib/api/taskcenter/types";
import { useTaskCenterLiveTasks } from "@/lib/hooks/use-taskcenter-live-tasks";


interface TiptapEditorProps {
  content?: string;
  onChange?: (content: string, html: string) => void;
  placeholder?: string;
  editable?: boolean;
  saveStatus?: AutoSaveState;
  articleId?: number;
  mode?: "create" | "edit";
  activeArticleEditTaskRef?: TaskCenterTaskReference | null;
  onActiveArticleEditTaskRefChange?: (taskRef: TaskCenterTaskReference | null) => void;
  onArticleEditSubmitted?: (execId: string) => void;
}

export function TiptapEditor({
  content = "",
  onChange,
  placeholder = "开始撰写您的内容...",
  editable = true,
  saveStatus,
  articleId,
  mode = "create",
  activeArticleEditTaskRef = null,
  onActiveArticleEditTaskRefChange,
  onArticleEditSubmitted,
}: TiptapEditorProps) {
  // 添加图片上传状态
  const [isUploadingImage, setIsUploadingImage] = useState(false);

  // AI 改写对话框状态
  const [isAIDialogOpen, setIsAIDialogOpen] = useState(false);
  const [aiDialogMode, setAIDialogMode] = useState<"create" | "task">("create");
  const [selectedTextForAI, setSelectedTextForAI] = useState("");
  const [activeArticleEditTask, setActiveArticleEditTask] =
    useState<TaskCenterArticleTaskDetail | null>(null);
  const [loadingArticleEditTask, setLoadingArticleEditTask] = useState(false);
  const [articleEditTaskError, setArticleEditTaskError] = useState<string | null>(null);
  const [isMindMapDialogOpen, setIsMindMapDialogOpen] = useState(false);

  // 添加国际化支持
  const { t } = useTranslation();

  // 添加toast提示
  const { toast } = useToast();

  const { tasks: liveArticleTasks } = useTaskCenterLiveTasks({
    article_id: articleId,
    enabled: typeof articleId === "number" && mode === "edit",
    realtimeScope: "article",
    type: "article",
  });

  const activeArticleEditTaskStatus = useMemo(() => {
    if (!activeArticleEditTaskRef) return null;

    const matchedTask = liveArticleTasks.find(
      (task) =>
        task.id === activeArticleEditTaskRef.id &&
        task.type === activeArticleEditTaskRef.type
    );

    return matchedTask?.status ?? null;
  }, [activeArticleEditTaskRef, liveArticleTasks]);

  const fetchArticleEditTask = useCallback(async (taskRef: TaskCenterTaskReference) => {
    setLoadingArticleEditTask(true);
    setArticleEditTaskError(null);

    try {
      const result = await taskCenterClient.getTaskDetail(taskRef.type, taskRef.id);

      if ("error" in result) {
        throw new Error(String(result.error));
      }

      if (taskRef.type !== "article") {
        throw new Error("Unsupported task type");
      }

      const articleTask = result as TaskCenterArticleTaskDetail;
      setActiveArticleEditTask(articleTask);
      setSelectedTextForAI(articleTask.req_text || "");
    } catch (error) {
      console.error("[TiptapEditor] Failed to fetch article edit task", {
        taskRef,
        error,
      });
      setActiveArticleEditTask(null);
      setArticleEditTaskError(
        error instanceof Error ? error.message : t("contentWriting.taskCenter.detailLoadFailed")
      );
    } finally {
      setLoadingArticleEditTask(false);
    }
  }, [t]);

  useEffect(() => {
    if (!activeArticleEditTaskRef) return;

    setAIDialogMode("task");
    setIsAIDialogOpen(true);
    void fetchArticleEditTask(activeArticleEditTaskRef);
  }, [activeArticleEditTaskRef, fetchArticleEditTask]);

  useEffect(() => {
    if (!activeArticleEditTaskRef || !activeArticleEditTaskStatus) return;
    if (!isAIDialogOpen || aiDialogMode !== "task") return;

    void fetchArticleEditTask(activeArticleEditTaskRef);
  }, [
    activeArticleEditTaskRef,
    activeArticleEditTaskStatus,
    aiDialogMode,
    fetchArticleEditTask,
    isAIDialogOpen,
  ]);

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
  ], []);

  const insertImageNodeToView = useCallback(
    (view: EditorView, imageUrl: string, altText: string, insertPos?: number) => {
      const imageNodeType = view.state.schema.nodes.customImage;

      if (!imageNodeType) {
        console.warn("[TiptapEditor] customImage node type missing when inserting uploaded image");
        return false;
      }

      const position = typeof insertPos === "number" ? insertPos : view.state.selection.from;
      const imageNode = imageNodeType.create({ src: imageUrl, alt: altText });
      const transaction = view.state.tr.insert(position, imageNode).scrollIntoView();

      view.dispatch(transaction);
      view.focus();

      return true;
    },
    []
  );

  const uploadAndInsertEditorImage = useCallback(
    async (view: EditorView, file: File, source: "drop" | "paste", insertPos?: number) => {
      const validation = validateImageFile(file);
      if (!validation.valid) {
        toast({
          variant: "destructive",
          title: t("contentWriting.writing.uploadFailed"),
          description: t(`contentWriting.writing.${validation.error}`),
        });
        return;
      }

      // observability: image upload path triggered from editor event chain
      console.debug("[TiptapEditor] Start uploading image from editor event", {
        source,
        fileName: file.name,
        fileType: file.type,
        fileSize: file.size,
      });

      setIsUploadingImage(true);
      toast({
        title: t("contentWriting.writing.uploading"),
        description: t("tiptapEditor.toast.uploadingImage"),
      });

      try {
        const imageUrl = await uploadImageToR2(file);
        const inserted = insertImageNodeToView(view, imageUrl, file.name, insertPos);

        if (!inserted) {
          throw new Error(t("tiptapEditor.toast.editorNotReady"));
        }

        console.info("[TiptapEditor] Image uploaded and inserted into editor", {
          source,
          fileName: file.name,
        });
        toast({
          title: t("contentWriting.writing.uploadSuccess"),
          description: t("tiptapEditor.toast.imageInserted"),
        });
      } catch (error) {
        console.error("[TiptapEditor] Image upload/insert failed in editor event path", {
          source,
          error,
        });

        const errorMessage = error instanceof Error ? error.message : "未知错误";
        const displayError = errorMessage.startsWith("contentWriting.")
          ? t(errorMessage)
          : `${t("contentWriting.writing.uploadError").replace("{error}", errorMessage)}`;

        toast({
          variant: "destructive",
          title: t("contentWriting.writing.uploadFailed"),
          description: displayError,
        });
      } finally {
        setIsUploadingImage(false);
      }
    },
    [insertImageNodeToView, t, toast]
  );

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
      handleDrop(view, event) {
        if (!event.dataTransfer) {
          return false;
        }

        const materialImageUrl = getMaterialImageFromDataTransfer(event.dataTransfer);

        if (materialImageUrl) {
          event.preventDefault();

          const dropPos = view.posAtCoords({ left: event.clientX, top: event.clientY });
          insertImageNodeToView(view, materialImageUrl, "", dropPos?.pos);

          return true;
        }

        const droppedImageFile = getImageFileFromDataTransfer(event.dataTransfer);
        if (!droppedImageFile) {
          return false;
        }

        event.preventDefault();
        const dropPos = view.posAtCoords({ left: event.clientX, top: event.clientY });
        void uploadAndInsertEditorImage(view, droppedImageFile, "drop", dropPos?.pos);

        return true;
      },
      handlePaste(view, event) {
        if (!event.clipboardData) {
          return false;
        }

        const pastedImageFile = getImageFileFromClipboardData(event.clipboardData);
        if (!pastedImageFile) {
          return false;
        }

        event.preventDefault();
        void uploadAndInsertEditorImage(view, pastedImageFile, "paste");

        return true;
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

  const closeAIDialog = useCallback(() => {
    setIsAIDialogOpen(false);
    setAIDialogMode("create");
    setSelectedTextForAI("");
    setActiveArticleEditTask(null);
    setArticleEditTaskError(null);
    setLoadingArticleEditTask(false);
    onActiveArticleEditTaskRefChange?.(null);
  }, [onActiveArticleEditTaskRefChange]);

  const findEditorRangeForText = useCallback((targetText: string) => {
    if (!editor) return null;

    const normalizedTarget = targetText.trim();
    if (!normalizedTarget) return null;

    const docSize = editor.state.doc.content.size;
    const fullText = editor.state.doc.textBetween(0, docSize, " ");
    const startIndex = fullText.indexOf(normalizedTarget);

    if (startIndex === -1) {
      return null;
    }

    const findPosByOffset = (offset: number) => {
      let low = 0;
      let high = docSize;

      while (low < high) {
        const mid = Math.floor((low + high) / 2);
        const prefix = editor.state.doc.textBetween(0, mid, " ");

        if (prefix.length < offset) {
          low = mid + 1;
        } else {
          high = mid;
        }
      }

      return low;
    };

    const from = findPosByOffset(startIndex);
    const to = findPosByOffset(startIndex + normalizedTarget.length);
    const matchedText = editor.state.doc.textBetween(from, to, " ").trim();

    if (matchedText !== normalizedTarget) {
      return null;
    }

    return { from, to };
  }, [editor]);

  const applyAIRewrite = useCallback(async (rewrittenText: string) => {
    if (!editor || !activeArticleEditTask) return;

    const originalText = activeArticleEditTask.req_text?.trim();
    if (!originalText) {
      toast({
        variant: "destructive",
        title: t("tiptapEditor.toast.applyFailed"),
        description: t("aiRewrite.toast.missingSourceText"),
      });
      return;
    }

    const targetRange = findEditorRangeForText(originalText);
    if (!targetRange) {
      toast({
        variant: "destructive",
        title: t("tiptapEditor.toast.applyFailed"),
        description: t("aiRewrite.toast.applySourceChanged"),
      });
      return;
    }

    try {
      const html = await markdownToHTML(rewrittenText);

      editor
        .chain()
        .focus()
        .deleteRange(targetRange)
        .insertContentAt(targetRange.from, html)
        .run();

      toast({
        title: t("aiRewrite.toast.contentApplied"),
      });
      closeAIDialog();
    } catch (error) {
      console.error("[TiptapEditor] Error applying AI rewrite:", error);
      toast({
        variant: "destructive",
        title: t("tiptapEditor.toast.applyFailed"),
        description: error instanceof Error ? error.message : t("tiptapEditor.toast.unknownError"),
      });
    }
  }, [activeArticleEditTask, closeAIDialog, editor, findEditorRangeForText, t, toast]);

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
    setAIDialogMode("create");
    setActiveArticleEditTask(null);
    setArticleEditTaskError(null);
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
      (window as any).getJoyfulWordsSelectedText = () => {
        const { from, to } = editor.state.selection;
        return editor.state.doc.textBetween(from, to, " ");
      };

      const handleOpenAIEdit = () => {
        console.log('[TiptapEditor] Received external AI edit trigger');
        handleAIRewrite();
      };

      const handleOpenAIMindMap = () => {
        console.debug("[TiptapEditor] Received external AI mindmap trigger");
        handleOpenMindMap();
      };

      window.addEventListener('joyfulwords-open-ai-edit', handleOpenAIEdit as EventListener);
      window.addEventListener('joyfulwords-open-ai-mindmap', handleOpenAIMindMap as EventListener);

      // 清理函数
      return () => {
        delete (window as any).getJoyfulWordsSelectedText;
        window.removeEventListener('joyfulwords-open-ai-edit', handleOpenAIEdit as EventListener);
        window.removeEventListener('joyfulwords-open-ai-mindmap', handleOpenAIMindMap as EventListener);
      };
    }
  }, [editor, handleAIRewrite, handleOpenMindMap]);

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
          if (open) {
            editor?.view.dom.blur();
          } else {
            closeAIDialog();
          }
        }}
        mode={aiDialogMode}
        articleId={articleId || 0}
        selectedText={selectedTextForAI}
        articleContent={editor?.getHTML() || ''}
        onRewrite={applyAIRewrite}
        onTaskSubmitted={(execId) => {
          onArticleEditSubmitted?.(execId);
        }}
        taskLoading={loadingArticleEditTask}
        taskStatus={activeArticleEditTask?.status ?? null}
        taskError={articleEditTaskError ?? activeArticleEditTask?.error ?? null}
        initialRewrittenText={activeArticleEditTask?.resp_text || undefined}
      />
      <AIMindMapDialog
        open={isMindMapDialogOpen}
        onOpenChange={setIsMindMapDialogOpen}
        articleId={articleId || 0}
      />
    </div>
  );
}
