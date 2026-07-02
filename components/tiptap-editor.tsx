"use client";

import { useEditor, EditorContent, type Editor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Underline from "@tiptap/extension-underline";
import { Markdown } from "@tiptap/markdown";
import { TaskItem, TaskList } from "@tiptap/extension-list";
import { TableRow } from "@tiptap/extension-table";
import type { EditorView } from "@tiptap/pm/view";
import { DOMParser as ProseMirrorDOMParser } from "@tiptap/pm/model";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { TiptapToolbar } from "./ui/editor/tiptap-toolbar";
import {
  CustomImage,
  CustomHighlight,
  CustomTextAlign,
  CustomLink,
  TableCellWithBackground,
  TableHeaderWithBackground,
} from "@/lib/tiptap-extensions";
import { ImageMenu } from "./ui/editor/image-menu";
import { LinkMenu } from "./ui/editor/link-menu";
import { AIRewriteDialog } from "./ui/ai/ai-rewrite-dialog";
import { AIMindMapDialog } from "./ui/ai/ai-mindmap-dialog";
import { uploadImageToR2, validateImageFile } from "@/lib/tiptap-image-upload";
import { useToast } from "@/hooks/use-toast";
import { useTranslation } from "@/lib/i18n/i18n-context";
import { clipboardTableTextToHTML, markdownToHTML } from "@/lib/tiptap-utils";
import {
  getClipboardTextPasteMode,
  normalizeCodeBlockClipboardText,
  shouldInsertPlainTextIntoCodeBlock,
} from "@/lib/tiptap-code-block-paste";
import { normalizeParsedMarkdownContentForEditor } from "@/lib/tiptap-markdown-content";
import { TableWithControls } from "@/lib/tiptap-table-node-view";
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
import { isTaskCenterArticleWriterDetails } from "@/lib/api/taskcenter/types";
import { useTaskCenterLiveTasks } from "@/lib/hooks/use-taskcenter-live-tasks";

const NON_TEXT_EDITOR_CONTENT_PATTERN = /<(img|video|table|hr|ul|ol|blockquote|pre)\b/i;

type EditorImageReferenceContext = {
  anchor_text?: string;
  placement_hint?: "before" | "after" | string;
}

declare global {
  interface Window {
    joyfulWordsEditorImages?: {
      insertImage: (imageUrl: string, altText?: string) => boolean;
      insertImageAtTop: (imageUrl: string, altText?: string) => boolean;
      insertImageAtReference: (
        imageUrl: string,
        altText?: string,
        referenceContext?: EditorImageReferenceContext | null
      ) => { inserted: boolean; anchorFound: boolean };
    }
  }
}

function isContentEffectivelyEmpty(value: string) {
  const text = value.replace(/<[^>]*>/g, "").trim();

  return !text && !NON_TEXT_EDITOR_CONTENT_PATTERN.test(value);
}

interface TiptapEditorProps {
  content?: string;
  onChange?: (content: string, html: string) => void;
  placeholder?: string;
  editable?: boolean;
  articleId?: number;
  mode?: "create" | "edit";
  activeArticleEditTaskRef?: TaskCenterTaskReference | null;
  onActiveArticleEditTaskRefChange?: (taskRef: TaskCenterTaskReference | null) => void;
  onArticleEditSubmitted?: (execId: string) => void;
  onImageTaskSubmitted?: () => void;
}

export function TiptapEditor({
  content = "",
  onChange,
  placeholder = "开始撰写您的内容...",
  editable = true,
  articleId,
  mode = "create",
  activeArticleEditTaskRef = null,
  onActiveArticleEditTaskRefChange,
  onArticleEditSubmitted,
  onImageTaskSubmitted,
}: TiptapEditorProps) {
  // 添加图片上传状态
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [isEditorEmpty, setIsEditorEmpty] = useState(() => isContentEffectivelyEmpty(content));

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
  const editorRef = useRef<Editor | null>(null);

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
      if (isTaskCenterArticleWriterDetails(articleTask)) {
        throw new Error("Unsupported article task operation");
      }

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
        class: "cursor-pointer underline",
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
    TableWithControls,
    TableRow,
    TableHeaderWithBackground,
    TableCellWithBackground,
    TaskList,
    TaskItem.configure({
      nested: true,
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

  const insertHTMLToView = useCallback((view: EditorView, html: string) => {
    const container = document.createElement("div");
    container.innerHTML = html;

    const slice = ProseMirrorDOMParser
      .fromSchema(view.state.schema)
      .parseSlice(container);
    const transaction = view.state.tr.replaceSelection(slice).scrollIntoView();

    view.dispatch(transaction);
    view.focus();
  }, []);

  const insertMarkdownClipboardTextToView = useCallback((view: EditorView, text: string) => {
    const activeEditor = editorRef.current;

    if (!activeEditor?.markdown) {
      console.warn("[TiptapEditor] Markdown parser missing for clipboard insertion", {
        characters: text.length,
      });
      view.dispatch(view.state.tr.insertText(normalizeCodeBlockClipboardText(text)).scrollIntoView());
      view.focus();
      return;
    }

    try {
      const content = activeEditor.markdown.parse(text);
      const insertContent = normalizeParsedMarkdownContentForEditor(content);

      if (insertContent.length === 0) {
        console.warn("[TiptapEditor] Markdown clipboard conversion returned empty content", {
          characters: text.length,
        });
        view.dispatch(view.state.tr.insertText(normalizeCodeBlockClipboardText(text)).scrollIntoView());
        view.focus();
        return;
      }

      activeEditor.chain().focus().insertContent(insertContent).run();
      console.info("[TiptapEditor] Markdown clipboard text inserted into editor", {
        characters: text.length,
        lines: normalizeCodeBlockClipboardText(text).split("\n").length,
      });
    } catch (error) {
      console.error("[TiptapEditor] Markdown clipboard insertion failed", { error });
      view.dispatch(view.state.tr.insertText(normalizeCodeBlockClipboardText(text)).scrollIntoView());
      view.focus();
    }
  }, []);

  const syncEditorEmptyState = useCallback((nextEditor: Editor) => {
    const text = nextEditor.getText().trim();
    const html = nextEditor.getHTML();
    setIsEditorEmpty(!text && !NON_TEXT_EDITOR_CONTENT_PATTERN.test(html));
  }, []);

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
        class: `prose prose-lg dark:prose-invert max-w-none focus:outline-none prose-headings:font-bold prose-a:underline ${mode === "edit" ? "" : "min-h-[400px] p-6"}`,
        placeholder,
      },
      handleTextInput(view, from, to, text) {
        if (
          view.state.selection.$from.sameParent(view.state.selection.$to) &&
          shouldInsertPlainTextIntoCodeBlock(
            view.state.selection.$from.parent.type.name,
            text
          )
        ) {
          view.dispatch(view.state.tr.insertText(text, from, to).scrollIntoView());

          return true;
        }

        return false;
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
        if (pastedImageFile) {
          const pastePos = view.state.selection.from;
          event.preventDefault();
          void uploadAndInsertEditorImage(view, pastedImageFile, "paste", pastePos);

          return true;
        }

        const clipboardText = event.clipboardData.getData("text/plain");
        const isSameParentSelection = view.state.selection.$from.sameParent(view.state.selection.$to);
        const parentNodeName = isSameParentSelection
          ? view.state.selection.$from.parent.type.name
          : undefined;
        const textPasteMode = getClipboardTextPasteMode(parentNodeName, clipboardText);

        if (textPasteMode === "plain-code-block") {
          event.preventDefault();

          const text = normalizeCodeBlockClipboardText(clipboardText);
          view.dispatch(view.state.tr.insertText(text).scrollIntoView());
          view.focus();
          console.debug("[TiptapEditor] Plain text pasted into code block", {
            characters: text.length,
            lines: text.split("\n").length,
          });

          return true;
        }

        const clipboardHTML = event.clipboardData.getData("text/html");
        if (/<table[\s>]/i.test(clipboardHTML)) {
          return false;
        }

        const tableHTML = clipboardTableTextToHTML(clipboardText);
        if (!tableHTML) {
          if (textPasteMode !== "markdown") {
            return false;
          }

          event.preventDefault();
          insertMarkdownClipboardTextToView(view, clipboardText);

          return true;
        }

        event.preventDefault();
        insertHTMLToView(view, tableHTML);
        console.info("[TiptapEditor] Clipboard table inserted into editor");

        return true;
      },
    },
    onUpdate: ({ editor }) => {
      const html = editor.getHTML();
      const text = editor.getText();
      syncEditorEmptyState(editor);

      onChange?.(text, html);
    },
  });

  useEffect(() => {
    editorRef.current = editor;

    return () => {
      if (editorRef.current === editor) {
        editorRef.current = null;
      }
    };
  }, [editor]);

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

      syncEditorEmptyState(editor);
    }
  }, [content, editor, normalizeHTML, syncEditorEmptyState]);

  useEffect(() => {
    if (!editor) return;

    const handleInsertCoverImage = (event: Event) => {
      const detail = (event as CustomEvent<{ imageUrl?: string; title?: string }>).detail;
      const imageUrl = detail?.imageUrl;
      if (!imageUrl) return;

      const inserted = insertImageNodeToView(
        editor.view,
        imageUrl,
        detail.title || t("imageGeneration.cover.altText"),
        0
      );

      if (inserted) {
        syncEditorEmptyState(editor);
        toast({
          title: t("imageGeneration.cover.toast.editorInserted"),
        });
      }
    };

    window.addEventListener("joyfulwords-insert-cover-image", handleInsertCoverImage);
    return () => {
      window.removeEventListener("joyfulwords-insert-cover-image", handleInsertCoverImage);
    };
  }, [editor, insertImageNodeToView, syncEditorEmptyState, t, toast]);

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

  const insertEditorImage = useCallback((imageUrl: string, altText = "", insertPos?: number) => {
    if (!editor) return false;

    return insertImageNodeToView(editor.view, imageUrl, altText, insertPos);
  }, [editor, insertImageNodeToView]);

  const insertEditorImageAtTop = useCallback((imageUrl: string, altText = "") => {
    if (!editor) return false;

    return insertImageNodeToView(editor.view, imageUrl, altText, 0);
  }, [editor, insertImageNodeToView]);

  const insertEditorImageAtReference = useCallback((
    imageUrl: string,
    altText = "",
    referenceContext?: EditorImageReferenceContext | null
  ) => {
    const anchorText = referenceContext?.anchor_text?.trim();
    const placementHint = referenceContext?.placement_hint;
    const targetRange = anchorText ? findEditorRangeForText(anchorText) : null;
    const insertPos = targetRange
      ? placementHint === "before"
        ? targetRange.from
        : targetRange.to
      : undefined;

    const inserted = insertEditorImage(imageUrl, altText, insertPos);

    return {
      inserted,
      anchorFound: Boolean(targetRange),
    };
  }, [findEditorRangeForText, insertEditorImage]);

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
      window.joyfulWordsEditorImages = {
        insertImage: insertEditorImage,
        insertImageAtTop: insertEditorImageAtTop,
        insertImageAtReference: insertEditorImageAtReference,
      };

      const handleOpenAIEdit = () => {
        console.debug("[TiptapEditor] Received external AI edit trigger");
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
        delete window.joyfulWordsEditorImages;
        window.removeEventListener('joyfulwords-open-ai-edit', handleOpenAIEdit as EventListener);
        window.removeEventListener('joyfulwords-open-ai-mindmap', handleOpenAIMindMap as EventListener);
      };
    }
  }, [
    editor,
    handleAIRewrite,
    handleOpenMindMap,
    insertEditorImage,
    insertEditorImageAtTop,
    insertEditorImageAtReference,
  ]);

  // Handle image upload using presigned URL
  const handleImageUpload = useCallback(async (file: File): Promise<string> => {
    console.debug("[TiptapEditor] Uploading toolbar image to R2", {
      fileName: file.name,
      fileSize: file.size,
    })

    try {
      // 使用新的安全上传方式
      const url = await uploadImageToR2(file)

      console.info("[TiptapEditor] Toolbar image uploaded", {
        fileName: file.name,
      })
      return url
    } catch (error) {
      console.error("[TiptapEditor] Toolbar image upload failed", { error })

      // 重新抛出错误,让调用者处理
      throw error
    }
  }, [])

  const insertImage = useCallback(() => {
    console.debug("[TiptapEditor] Toolbar image insert requested");

    if (!editor) {
      console.error("[TiptapEditor] Editor is not initialized for toolbar image insert");
      toast({
        variant: "destructive",
        title: t("contentWriting.writing.uploadFailed"),
        description: t("tiptapEditor.toast.editorNotReady"),
      });
      return;
    }

    if (isUploadingImage) {
      console.debug("[TiptapEditor] Toolbar image insert skipped while upload is in progress");
      return;
    }

    // 创建一个隐藏的文件输入框
    const input = document.createElement("input");
    input.type = "file";
    input.accept = "image/*";
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;

      console.debug("[TiptapEditor] Toolbar image file selected", {
        fileName: file.name,
        fileSize: file.size,
      });

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

        console.info("[TiptapEditor] Starting toolbar image upload", {
          fileName: file.name,
          fileSize: file.size,
        });

        // 上传图片 - 等待完成
        const url = await handleImageUpload(file);
        const inserted = insertImageNodeToView(editor.view, url, file.name);
        if (!inserted) {
          throw new Error(t("tiptapEditor.toast.editorNotReady"));
        }
        console.info("[TiptapEditor] Image uploaded and inserted from toolbar", {
          fileName: file.name,
          fileSize: file.size,
        });

        // 显示成功提示
        toast({
          title: t("contentWriting.writing.uploadSuccess"),
          description: t("tiptapEditor.toast.imageInserted"),
        });

      } catch (error) {
        console.error("[TiptapEditor] Toolbar image upload/insert failed", { error });
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
  }, [editor, handleImageUpload, insertImageNodeToView, isUploadingImage, toast, t]);

  const editorShellClassName =
    mode === "edit"
      ? "jw-editor-shell flex h-full w-full flex-col overflow-hidden bg-transparent"
      : "flex h-full w-full flex-col overflow-hidden rounded-lg border bg-background";

  return (
    <div className={editorShellClassName}>
      <TiptapToolbar
        editor={editor}
        onInsertImage={insertImage}
        isUploadingImage={isUploadingImage}
      />
      <div
        className={mode === "edit" ? "jw-document-stage min-h-0 flex-1 overflow-y-auto px-4" : "min-h-0 flex-1 overflow-y-auto"}
        onDragOver={(e) => {
          e.preventDefault();
          e.dataTransfer.dropEffect = "copy";
        }}
      >
        {mode === "edit" ? (
          <div className={`jw-document-paper ${isEditorEmpty ? "is-empty" : ""}`}>
            <EditorContent editor={editor} className="h-full" />
          </div>
        ) : (
          <EditorContent editor={editor} className="h-full" />
        )}
      </div>
      {editor && (
        <ImageMenu
          editor={editor}
          articleId={articleId}
          onImageTaskSubmitted={onImageTaskSubmitted}
        />
      )}
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
