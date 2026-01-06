"use client";

import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Underline from "@tiptap/extension-underline";
import Link from "@tiptap/extension-link";
import Image from "@tiptap/extension-image";
import { useCallback, useEffect, useRef } from "react";
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
        // 禁用 StarterKit 中的某些扩展，避免重复
        bold: true,
        italic: true,
        strike: true,
        code: true,
        codeBlock: true,
        blockquote: true,
        bulletList: true,
        orderedList: true,
        listItem: true,
        hardBreak: true,
        horizontalRule: true,
      }),
      Underline,
      Link.configure({
        openOnClick: false,
        HTMLAttributes: {
          class: "text-blue-600 underline cursor-pointer",
        },
      }),
      Image.configure({
        inline: false,
        allowBase64: true,
        HTMLAttributes: {
          class: "max-w-full h-auto rounded-lg my-4",
        },
      }),
      // 移除 Markdown extension - 它可能会干扰 HTML 插入
      // Markdown.configure({
      //   html: true,
      //   transformPastedText: true,
      // }),
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
      const text = editor.getText();

      // Call onChange with text and html (markdown removed since we don't use that extension)
      onChange?.(text, html, '');
    },
  });

  // Track if we're updating from props to avoid infinite loops
  const isExternalUpdate = useRef(false);

  // Update editor content when content prop changes from parent
  useEffect(() => {
    if (editor && content !== undefined) {
      const currentHTML = editor.getHTML();
      // Only update if content actually changed and it's different from current editor state
      if (content !== currentHTML && !isExternalUpdate.current) {
        isExternalUpdate.current = true;
        editor.commands.setContent(content);
        // Reset flag after a short delay
        setTimeout(() => {
          isExternalUpdate.current = false;
        }, 100);
      }
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
    console.log("开始上传图片到 R2，文件：", file.name, file.size);

    try {
      // 创建 FormData
      const formData = new FormData();
      formData.append('file', file);

      // 调用上传 API
      const response = await fetch('/api/upload-image', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || '上传失败');
      }

      const data = await response.json();
      console.log("图片上传成功，返回数据：", data);

      if (data.success && data.url) {
        return data.url;
      } else {
        throw new Error('上传失败：未返回图片 URL');
      }
    } catch (error) {
      console.error("图片上传失败：", error);
      throw error;
    }
  }, []);

  const insertImage = useCallback(() => {
    console.log("insertImage 函数被调用");

    if (!editor) {
      console.error("编辑器未初始化");
      alert("编辑器未初始化，请稍后再试");
      return;
    }

    // 创建一个隐藏的文件输入框
    const input = document.createElement("input");
    input.type = "file";
    input.accept = "image/*";
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (file) {
        console.log("选择的图片文件：", file.name, file.size);
        try {
          const url = await handleImageUpload(file);
          console.log("图片上传成功，URL：", url);

          // 使用 Tiptap 的原生 setImage 命令插入图片
          // 这是正确的方式，直接使用 Image extension 的命令
          const result = editor.chain().focus().setImage({ src: url }).run();

          console.log("setImage 命令执行结果：", result);

          // 验证图片是否成功插入
          setTimeout(() => {
            const html = editor.getHTML();
            console.log("当前编辑器 HTML：", html);

            if (html.includes('<img') || html.includes(url)) {
              console.log("✅ 图片成功插入到编辑器！");
            } else {
              console.error("❌ 图片插入失败");
              console.log("编辑器状态：", editor.state.doc.toJSON());
            }
          }, 200);
        } catch (error) {
          console.error("图片上传失败：", error);
          alert("图片上传失败，请重试");
        }
      }
    };
    console.log("准备打开文件选择器");
    input.click();
  }, [editor, handleImageUpload]);

  return (
    <div className="border rounded-lg overflow-hidden bg-background">
      <TiptapToolbar editor={editor} onInsertImage={insertImage} />
      <EditorContent editor={editor} />
    </div>
  );
}