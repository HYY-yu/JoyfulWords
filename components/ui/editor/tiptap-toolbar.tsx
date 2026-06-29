"use client";

import {
  BoldIcon,
  ItalicIcon,
  UnderlineIcon,
  StrikethroughIcon,
  Code2Icon,
  TerminalIcon,
  ListIcon,
  ListOrderedIcon,
  ListTodoIcon,
  QuoteIcon,
  LinkIcon,
  ImageIcon,
  Undo2Icon,
  Redo2Icon,
  SeparatorHorizontalIcon,
  Loader2Icon,
  TableIcon,
} from "lucide-react";
import { Editor } from "@tiptap/react";
import { useCallback } from "react";
import { useTranslation } from "@/lib/i18n/i18n-context";
import { ToolbarButton } from "./tiptap-toolbar-button";
import { HighlightButtons } from "./highlight-buttons";
import { TextAlignButtons } from "./text-align-buttons";

interface TiptapToolbarProps {
  editor: Editor | null;
  onInsertImage?: () => void;
  isUploadingImage?: boolean;
}

export function TiptapToolbar({ editor, onInsertImage, isUploadingImage = false }: TiptapToolbarProps) {
  const { t } = useTranslation()

  const setImage = useCallback(() => {
    if (!editor) {
      console.warn('[TiptapToolbar] Editor not ready')
      return
    }

    // 如果有图片上传回调，优先使用
    if (onInsertImage) {
      console.debug('[TiptapToolbar] Using image upload callback')
      onInsertImage()
      return
    }

    // 否则回退到手动输入URL
    console.debug('[TiptapToolbar] Using manual URL input')
    const url = window.prompt('Image URL')
    if (url) {
      editor.chain().focus().setImage({ src: url }).run()
    }
  }, [editor, onInsertImage])

  if (!editor) {
    return null;
  }

  return (
    <div className="jw-editor-toolbar flex items-center justify-between gap-3 px-3 py-2">
      <div className="flex min-w-0 flex-wrap items-center gap-1">
      {/* Undo/Redo */}
      <ToolbarButton
        tooltip={t("tiptapEditor.toolbar.undo")}
        shortcut="⌘Z"
        disabled={!editor.can().undo()}
        onClick={() => editor.chain().focus().undo().run()}
      >
        <Undo2Icon className="h-4 w-4" />
      </ToolbarButton>

      <ToolbarButton
        tooltip={t("tiptapEditor.toolbar.redo")}
        shortcut="⌘Y"
        disabled={!editor.can().redo()}
        onClick={() => editor.chain().focus().redo().run()}
      >
        <Redo2Icon className="h-4 w-4" />
      </ToolbarButton>

      <div className="w-px h-8 bg-border/40 mx-1" />

      {/* Text Formatting */}
      <ToolbarButton
        tooltip={t("tiptapEditor.toolbar.bold")}
        shortcut="⌘B"
        isActive={editor.isActive('bold')}
        onClick={() => editor.chain().focus().toggleBold().run()}
      >
        <BoldIcon className="h-4 w-4" />
      </ToolbarButton>

      <ToolbarButton
        tooltip={t("tiptapEditor.toolbar.italic")}
        shortcut="⌘I"
        isActive={editor.isActive('italic')}
        onClick={() => editor.chain().focus().toggleItalic().run()}
      >
        <ItalicIcon className="h-4 w-4" />
      </ToolbarButton>

      <ToolbarButton
        tooltip={t("tiptapEditor.toolbar.underline")}
        shortcut="⌘U"
        isActive={editor.isActive('underline')}
        onClick={() => editor.chain().focus().toggleUnderline().run()}
      >
        <UnderlineIcon className="h-4 w-4" />
      </ToolbarButton>

      <ToolbarButton
        tooltip={t("tiptapEditor.toolbar.strikethrough")}
        shortcut="⌘S"
        isActive={editor.isActive('strike')}
        onClick={() => editor.chain().focus().toggleStrike().run()}
      >
        <StrikethroughIcon className="h-4 w-4" />
      </ToolbarButton>

      <ToolbarButton
        tooltip={t("tiptapEditor.toolbar.code")}
        isActive={editor.isActive('code')}
        onClick={() => editor.chain().focus().toggleCode().run()}
      >
        <Code2Icon className="h-4 w-4" />
      </ToolbarButton>

      <div className="w-px h-8 bg-border/40 mx-1" />

      {/* Highlight */}
      <HighlightButtons editor={editor} />

      <div className="w-px h-8 bg-border/40 mx-1" />

      {/* Text Alignment */}
      <TextAlignButtons editor={editor} />

      <div className="w-px h-8 bg-border/40 mx-1" />

      {/* Headings */}
      <select
        className="jw-soft-input h-8 rounded-md border px-2 text-sm text-foreground ring-offset-background transition-colors focus:outline-none focus:ring-2 focus:ring-ring/35 focus:ring-offset-0"
        value={
          editor.isActive('heading', { level: 1 })
            ? 'h1'
            : editor.isActive('heading', { level: 2 })
              ? 'h2'
              : editor.isActive('heading', { level: 3 })
                ? 'h3'
                : 'p'
        }
        onChange={(e) => {
          const value = e.target.value;
          if (value === 'p') {
            editor.chain().focus().setParagraph().run();
          } else if (value === 'h1') {
            editor.chain().focus().toggleHeading({ level: 1 }).run();
          } else if (value === 'h2') {
            editor.chain().focus().toggleHeading({ level: 2 }).run();
          } else if (value === 'h3') {
            editor.chain().focus().toggleHeading({ level: 3 }).run();
          }
        }}
      >
        <option value="p">{t("tiptapEditor.toolbar.heading.paragraph")}</option>
        <option value="h1">{t("tiptapEditor.toolbar.heading.heading1")}</option>
        <option value="h2">{t("tiptapEditor.toolbar.heading.heading2")}</option>
        <option value="h3">{t("tiptapEditor.toolbar.heading.heading3")}</option>
      </select>

      <div className="w-px h-8 bg-border/40 mx-1" />

      {/* Lists */}
      <ToolbarButton
        tooltip={t("tiptapEditor.toolbar.bulletList")}
        shortcut="⌘⇧8"
        isActive={editor.isActive('bulletList')}
        disabled={!editor.can().chain().focus().toggleBulletList().run()}
        onClick={() => editor.chain().focus().toggleBulletList().run()}
      >
        <ListIcon className="h-4 w-4" />
      </ToolbarButton>

      <ToolbarButton
        tooltip={t("tiptapEditor.toolbar.orderedList")}
        shortcut="⌘⇧7"
        isActive={editor.isActive('orderedList')}
        disabled={!editor.can().chain().focus().toggleOrderedList().run()}
        onClick={() => editor.chain().focus().toggleOrderedList().run()}
      >
        <ListOrderedIcon className="h-4 w-4" />
      </ToolbarButton>

      <ToolbarButton
        tooltip={t("tiptapEditor.toolbar.taskList")}
        shortcut="⌘⇧9"
        isActive={editor.isActive('taskList')}
        disabled={!editor.can().chain().focus().toggleTaskList().run()}
        onClick={() => editor.chain().focus().toggleTaskList().run()}
      >
        <ListTodoIcon className="h-4 w-4" />
      </ToolbarButton>

      <div className="w-px h-8 bg-border/40 mx-1" />

      {/* Quote */}
      <ToolbarButton
        tooltip={t("tiptapEditor.toolbar.quote")}
        isActive={editor.isActive('blockquote')}
        disabled={!editor.can().chain().focus().toggleBlockquote().run()}
        onClick={() => editor.chain().focus().toggleBlockquote().run()}
      >
        <QuoteIcon className="h-4 w-4" />
      </ToolbarButton>

      {/* Code Block */}
      <ToolbarButton
        tooltip={t("tiptapEditor.toolbar.codeBlock")}
        isActive={editor.isActive('codeBlock')}
        onClick={() => editor.chain().focus().toggleCodeBlock().run()}
      >
        <TerminalIcon className="h-4 w-4" />
      </ToolbarButton>

      {/* Horizontal Rule */}
      <ToolbarButton
        tooltip={t("tiptapEditor.toolbar.horizontalRule")}
        onClick={() => editor.chain().focus().setHorizontalRule().run()}
      >
        <SeparatorHorizontalIcon className="h-4 w-4" />
      </ToolbarButton>

      <ToolbarButton
        tooltip={t("tiptapEditor.toolbar.table")}
        onClick={() => editor.chain().focus().insertTable({ rows: 2, cols: 2, withHeaderRow: false }).run()}
      >
        <TableIcon className="h-4 w-4" />
      </ToolbarButton>

      <div className="w-px h-8 bg-border/40 mx-1" />

      {/* Link */}
      <ToolbarButton
        tooltip={t("tiptapEditor.toolbar.link")}
        shortcut="⌘K"
        onClick={() => {
          if (!editor) return;
          const url = window.prompt(t("tiptapEditor.toolbar.linkUrlPrompt"));
          if (url) {
            editor.chain().focus().setLink({ href: url }).run();
          }
        }}
      >
        <LinkIcon className="h-4 w-4" />
      </ToolbarButton>

      <ToolbarButton
        tooltip={isUploadingImage ? t("tiptapEditor.toolbar.uploading") : t("tiptapEditor.toolbar.image")}
        onClick={setImage}
        disabled={isUploadingImage}
      >
        {isUploadingImage ? (
          <Loader2Icon className="h-4 w-4 animate-spin" />
        ) : (
          <ImageIcon className="h-4 w-4" />
        )}
      </ToolbarButton>
      </div>

    </div>
  );
}
