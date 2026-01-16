"use client";

import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Underline from "@tiptap/extension-underline";
import Link from "@tiptap/extension-link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { TiptapToolbar } from "./ui/tiptap-toolbar";
import { CustomImage, CustomHighlight, CustomTextAlign } from "@/lib/tiptap-extensions";
import { ImageMenu } from "./ui/image-menu";
import { LinkMenu } from "./ui/link-menu";
import { uploadImageToR2, validateImageFile } from "@/lib/tiptap-image-upload";
import { useToast } from "@/hooks/use-toast";
import { useTranslation } from "@/lib/i18n/i18n-context";


interface TiptapEditorProps {
  content?: string;
  onChange?: (content: string, html: string) => void;
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

  // 添加国际化支持
  const { t } = useTranslation();

  // 添加toast提示
  const { toast } = useToast();

  // 确定初始内容： HTML
  const initialContent =  content;

  // 使用 useMemo 来稳定扩展配置，避免重新创建
  const extensions = useMemo(() => [
    StarterKit.configure({
      heading: {
        levels: [1, 2, 3],
      },
      link: false,  // 禁用 StarterKit 中的 link（如果存在）
      underline: false,  // 禁用 StarterKit 中的 underline（如果存在）
    }),
    Link.configure({
      openOnClick: false,  
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

  // Expose editor methods
  useEffect(() => {
    if (editor) {
      // Make editor available globally for external access
      (window as any).tiptapEditor = editor;
    }
  }, [editor]);

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
        description: "编辑器未初始化，请稍后再试",
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
          description: "正在上传图片...",
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
          description: "图片已插入到编辑器",
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

  return (
    <div className="border rounded-lg overflow-hidden bg-background">
      <TiptapToolbar
        editor={editor}
        onInsertImage={insertImage}
        isUploadingImage={isUploadingImage}
      />
      <EditorContent editor={editor} />
      {editor && <ImageMenu editor={editor} />}
      {editor && <LinkMenu editor={editor} />}
    </div>
  );
}