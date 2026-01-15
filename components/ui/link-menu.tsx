"use client";

import { Editor } from "@tiptap/react";
import { useEffect, useState, useCallback } from "react";
import { ExternalLinkIcon, Trash2Icon } from "lucide-react";
import { Button } from "./button";
import { Input } from "./input";

interface LinkMenuProps {
  editor: Editor;
}

export function LinkMenu({ editor }: LinkMenuProps) {
  const [show, setShow] = useState(false);
  const [url, setUrl] = useState<string>("");

  // 检查是否选中了链接
  useEffect(() => {
    const updateMenu = () => {
      const hasLink = editor.isActive('link');

      if (hasLink) {
        const linkAttrs = editor.getAttributes('link');
        setShow(true);
        setUrl(linkAttrs.href || "");
      } else {
        setShow(false);
      }
    };

    editor.on("selectionUpdate", updateMenu);
    editor.on("transaction", updateMenu);

    return () => {
      editor.off("selectionUpdate", updateMenu);
      editor.off("transaction", updateMenu);
    };
  }, [editor]);

  const updateUrl = useCallback((newUrl: string) => {
    if (newUrl) {
      editor.chain().focus().setLink({ href: newUrl }).run();
    } else {
      editor.chain().focus().unsetLink().run();
    }
  }, [editor]);

  const removeLink = useCallback(() => {
    editor.chain().focus().unsetLink().run();
  }, [editor]);

  const openLink = useCallback(() => {
    const currentUrl = editor.getAttributes('link').href;
    if (currentUrl) {
      window.open(currentUrl, '_blank');
    }
  }, [editor]);

  if (!show) return null;

  return (
    <div className="fixed bottom-4 left-1/2 transform -translate-x-1/2 z-50 bg-background border rounded-lg shadow-lg p-2 flex items-center gap-2">
      {/* URL 输入框 */}
      <div className="flex items-center gap-1 flex-1">
        <Input
          type="url"
          placeholder="https://..."
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          onBlur={(e) => updateUrl(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              updateUrl((e.target as HTMLInputElement).value);
            } else if (e.key === "Escape") {
              editor.commands.focus();
            }
          }}
          className="h-8 text-sm min-w-[200px]"
        />
      </div>

      <div className="w-px h-6 bg-border" />

      {/* 跳转按钮 */}
      <Button
        variant="ghost"
        size="sm"
        onClick={openLink}
        className="h-8 w-8 p-0"
        title="跳转"
      >
        <ExternalLinkIcon className="h-4 w-4" />
      </Button>

      {/* 删除按钮 */}
      <Button
        variant="ghost"
        size="sm"
        onClick={removeLink}
        className="h-8 w-8 p-0 text-destructive hover:text-destructive"
        title="删除"
      >
        <Trash2Icon className="h-4 w-4" />
      </Button>
    </div>
  );
}
