"use client";

import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Underline from "@tiptap/extension-underline";
import Link from "@tiptap/extension-link";
import { useCallback, useEffect, useRef, useState } from "react";
import { TiptapToolbar } from "./ui/tiptap-toolbar";
import { CustomImage } from "@/lib/tiptap-extensions";
import { ImageMenu } from "./ui/image-menu";


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
  // 添加图片上传状态
  const [isUploadingImage, setIsUploadingImage] = useState(false);

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
      CustomImage.configure({
        inline: false,
        allowBase64: true,
        HTMLAttributes: {
          class: "max-w-full h-auto rounded-lg",
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
        // 设置上传状态为 true
        setIsUploadingImage(true);

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
        success = editor.chain().focus().setImage({ src: url, alt: file.name, align: 'left' }).run();
        console.log("方法 1 结果:", success);

        if (!success) {
          // 方法 2: 插入节点对象
          console.log("尝试方法 2: insertContent with node");
          success = editor.chain().focus().insertContent({
            type: 'customImage',
            attrs: {
              src: url,
              alt: file.name,
              align: 'left'
            },
          }).run();
          console.log("方法 2 结果:", success);
        }

        if (!success) {
          // 方法 3: 插入 HTML 内容（自闭合标签）
          console.log("尝试方法 3: insertContent with HTML (self-closing)");
          success = editor.chain().focus().insertContent(
            `<img src="${url}" alt="${file.name}" />`
          ).run();
          console.log("方法 3 结果:", success);
        }

        if (!success) {
          // 方法 4: 先插入段落再插入图片
          console.log("尝试方法 4: 在新段落中插入");
          success = editor.chain()
            .focus()
            .insertContent('<p></p>')
            .setImage({ src: url, alt: file.name, align: 'left' })
            .run();
          console.log("方法 4 结果:", success);
        }

        // 强制刷新编辑器视图
        editor.commands.focus();

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
        alert(`图片上传失败：${error instanceof Error ? error.message : '未知错误'}`);
      } finally {
        // 重置上传状态
        setIsUploadingImage(false);
      }
    };

    console.log("准备打开文件选择器");
    input.click();
  }, [editor, handleImageUpload, isUploadingImage]);

  return (
    <div className="border rounded-lg overflow-hidden bg-background">
      <TiptapToolbar
        editor={editor}
        onInsertImage={insertImage}
        isUploadingImage={isUploadingImage}
      />
      <EditorContent editor={editor} />
      {editor && <ImageMenu editor={editor} />}
    </div>
  );
}