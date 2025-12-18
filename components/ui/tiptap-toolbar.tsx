"use client";

import {
  BoldIcon,
  ItalicIcon,
  UnderlineIcon,
  StrikethroughIcon,
  Code2Icon,
  Heading1Icon,
  Heading2Icon,
  Heading3Icon,
  ListIcon,
  ListOrderedIcon,
  QuoteIcon,
  LinkIcon,
  ImageIcon,
  Undo2Icon,
  Redo2Icon,
  SeparatorHorizontalIcon,
} from "lucide-react";
import { Editor } from "@tiptap/react";
import { useCallback } from "react";
import { ToolbarButton } from "./tiptap-toolbar-button";

interface TiptapToolbarProps {
  editor: Editor | null;
  onInsertImage?: () => void;
}

export function TiptapToolbar({ editor, onInsertImage }: TiptapToolbarProps) {
  if (!editor) {
    return null;
  }

  const setLink = useCallback(() => {
    const previousUrl = editor.getAttributes('link').href;
    const url = window.prompt('URL', previousUrl);

    if (url === null) {
      return;
    }

    if (url === '') {
      editor.chain().focus().extendMarkRange('link').unsetLink().run();
      return;
    }

    editor.chain().focus().extendMarkRange('link').setLink({ href: url }).run();
  }, [editor]);

  const setImage = useCallback(() => {
    // 如果有图片上传回调，优先使用
    if (onInsertImage) {
      onInsertImage();
      return;
    }

    // 否则回退到手动输入URL
    const url = window.prompt('Image URL');
    if (url) {
      editor.chain().focus().setImage({ src: url }).run();
    }
  }, [editor, onInsertImage]);

  return (
    <div className="flex flex-wrap gap-1 p-2 border-b">
      {/* Undo/Redo */}
      <ToolbarButton
        tooltip="Undo"
        shortcut="⌘Z"
        disabled={!editor.can().undo()}
        onClick={() => editor.chain().focus().undo().run()}
      >
        <Undo2Icon className="h-4 w-4" />
      </ToolbarButton>

      <ToolbarButton
        tooltip="Redo"
        shortcut="⌘Y"
        disabled={!editor.can().redo()}
        onClick={() => editor.chain().focus().redo().run()}
      >
        <Redo2Icon className="h-4 w-4" />
      </ToolbarButton>

      <div className="w-px h-8 bg-border mx-1" />

      {/* Text Formatting */}
      <ToolbarButton
        tooltip="Bold"
        shortcut="⌘B"
        isActive={editor.isActive('bold')}
        disabled={!editor.can().chain().focus().toggleBold().run()}
        onClick={() => editor.chain().focus().toggleBold().run()}
      >
        <BoldIcon className="h-4 w-4" />
      </ToolbarButton>

      <ToolbarButton
        tooltip="Italic"
        shortcut="⌘I"
        isActive={editor.isActive('italic')}
        disabled={!editor.can().chain().focus().toggleItalic().run()}
        onClick={() => editor.chain().focus().toggleItalic().run()}
      >
        <ItalicIcon className="h-4 w-4" />
      </ToolbarButton>

      <ToolbarButton
        tooltip="Underline"
        shortcut="⌘U"
        isActive={editor.isActive('underline')}
        disabled={!editor.can().chain().focus().toggleUnderline().run()}
        onClick={() => editor.chain().focus().toggleUnderline().run()}
      >
        <UnderlineIcon className="h-4 w-4" />
      </ToolbarButton>

      <ToolbarButton
        tooltip="Strikethrough"
        shortcut="⌘S"
        isActive={editor.isActive('strike')}
        disabled={!editor.can().chain().focus().toggleStrike().run()}
        onClick={() => editor.chain().focus().toggleStrike().run()}
      >
        <StrikethroughIcon className="h-4 w-4" />
      </ToolbarButton>

      <ToolbarButton
        tooltip="Code"
        isActive={editor.isActive('code')}
        disabled={!editor.can().chain().focus().toggleCode().run()}
        onClick={() => editor.chain().focus().toggleCode().run()}
      >
        <Code2Icon className="h-4 w-4" />
      </ToolbarButton>

      <div className="w-px h-8 bg-border mx-1" />

      {/* Headings */}
      <select
        className="h-8 px-2 rounded-md border border-input bg-background text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
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
        <option value="p">正文</option>
        <option value="h1">标题 1</option>
        <option value="h2">标题 2</option>
        <option value="h3">标题 3</option>
      </select>

      <div className="w-px h-8 bg-border mx-1" />

      {/* Lists */}
      <ToolbarButton
        tooltip="Bullet List"
        shortcut="⌘⇧8"
        isActive={editor.isActive('bulletList')}
        disabled={!editor.can().chain().focus().toggleBulletList().run()}
        onClick={() => editor.chain().focus().toggleBulletList().run()}
      >
        <ListIcon className="h-4 w-4" />
      </ToolbarButton>

      <ToolbarButton
        tooltip="Ordered List"
        shortcut="⌘⇧7"
        isActive={editor.isActive('orderedList')}
        disabled={!editor.can().chain().focus().toggleOrderedList().run()}
        onClick={() => editor.chain().focus().toggleOrderedList().run()}
      >
        <ListOrderedIcon className="h-4 w-4" />
      </ToolbarButton>

      <div className="w-px h-8 bg-border mx-1" />

      {/* Quote */}
      <ToolbarButton
        tooltip="Quote"
        isActive={editor.isActive('blockquote')}
        disabled={!editor.can().chain().focus().toggleBlockquote().run()}
        onClick={() => editor.chain().focus().toggleBlockquote().run()}
      >
        <QuoteIcon className="h-4 w-4" />
      </ToolbarButton>

      {/* Horizontal Rule */}
      <ToolbarButton
        tooltip="Horizontal Rule"
        onClick={() => editor.chain().focus().setHorizontalRule().run()}
      >
        <SeparatorHorizontalIcon className="h-4 w-4" />
      </ToolbarButton>

      <div className="w-px h-8 bg-border mx-1" />

      {/* Link & Image */}
      <ToolbarButton
        tooltip="Link"
        shortcut="⌘K"
        isActive={editor.isActive('link')}
        onClick={setLink}
      >
        <LinkIcon className="h-4 w-4" />
      </ToolbarButton>

      <ToolbarButton
        tooltip="Image"
        onClick={setImage}
      >
        <ImageIcon className="h-4 w-4" />
      </ToolbarButton>
    </div>
  );
}