"use client";

import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Underline from "@tiptap/extension-underline";
import Link from "@tiptap/extension-link";
import Image from "@tiptap/extension-image";
import { Markdown } from "tiptap-markdown";
import { useCallback, useEffect } from "react";
import { TiptapToolbar } from "./ui/tiptap-toolbar";


interface TiptapEditorProps {
  content?: string;
  onChange?: (content: string, html: string, markdown: string) => void;
  placeholder?: string;
  editable?: boolean;
}

export function TiptapEditor({
  content = "",
  onChange,
  placeholder = "开始撰写您的内容...",
  editable = true,
}: TiptapEditorProps) {
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: {
          levels: [1, 2, 3],
        },
      }),
      Underline,
      Link.configure({
        openOnClick: false,
        HTMLAttributes: {
          class: "text-blue-600 underline cursor-pointer",
        },
      }),
      Image.configure({
        HTMLAttributes: {
          class: "max-w-full h-auto",
        },
      }),
      Markdown.configure({
        html: true,
        transformPastedText: true,
      }),
    ],
    content,
    editable,
    immediatelyRender: true,
    editorProps: {
      attributes: {
        class: "prose prose-lg dark:prose-invert max-w-none focus:outline-none min-h-[400px] p-4",
        placeholder,
      },
    },
    onUpdate: ({ editor }) => {
      const html = editor.getHTML();
      const json = editor.getJSON();
      // Access markdown storage with type assertion
      const markdown = (editor.storage as any).markdown?.getMarkdown() || '';

      // Convert to plain text for content
      const text = editor.getText();

      onChange?.(text, html, markdown);
    },
  });

  // Update editor content when content prop changes
  useEffect(() => {
    if (editor && content !== editor.getHTML()) {
      editor.commands.setContent(content);
    }
  }, [content, editor]);

  // Expose editor methods
  useEffect(() => {
    if (editor) {
      // Make editor available globally for external access
      (window as any).tiptapEditor = editor;
    }
  }, [editor]);

  // Handle image upload
  const handleImageUpload = useCallback(async (file: File): Promise<string> => {
    // TODO: 实现图片上传逻辑
    // 用户将提供上传图床接口
    return new Promise((resolve, reject) => {
      // 临时处理：转换为 base64
      const reader = new FileReader();
      reader.onload = () => {
        const result = reader.result as string;
        // 这里应该调用图床上传接口
        console.log("TODO: 实现图片上传，文件：", file.name);
        // 临时返回 base64
        resolve(result);
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }, []);

  const insertImage = useCallback(() => {
    // 创建一个隐藏的文件输入框
    const input = document.createElement("input");
    input.type = "file";
    input.accept = "image/*";
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (file) {
        try {
          const url = await handleImageUpload(file);
          editor?.chain().focus().setImage({ src: url }).run();
        } catch (error) {
          console.error("图片上传失败：", error);
          alert("图片上传失败，请重试");
        }
      }
    };
    input.click();
  }, [editor, handleImageUpload]);

  return (
    <div className="border rounded-lg overflow-hidden bg-background">
      <TiptapToolbar editor={editor} onInsertImage={insertImage} />
      <EditorContent editor={editor} />
    </div>
  );
}