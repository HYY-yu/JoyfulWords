"use client";

import { useState, useCallback, useEffect } from "react";
import { LinkIcon, ExternalLinkIcon, Trash2Icon, CheckIcon } from "lucide-react";
import { Editor } from "@tiptap/react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/base/popover";
import { Button } from "@/components/ui/base/button";

interface LinkPopoverProps {
  editor: Editor;
}

export function LinkPopover({ editor }: LinkPopoverProps) {
  const [url, setUrl] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

  // Update URL state when link is selected
  useEffect(() => {
    if (editor && isOpen) {
      const currentUrl = editor.getAttributes('link').href || "";
      setUrl(currentUrl);
      setIsEditing(false);
    }
  }, [editor, isOpen]);

  const updateUrl = useCallback(() => {
    if (url) {
      editor.chain().focus().setLink({ href: url }).run();
      setIsEditing(false);
    }
  }, [editor, url]);

  const removeLink = useCallback(() => {
    editor.chain().focus().unsetLink().run();
    setIsOpen(false);
  }, [editor]);

  const openLink = useCallback(() => {
    const currentUrl = editor.getAttributes('link').href;
    if (currentUrl) {
      window.open(currentUrl, '_blank');
    }
  }, [editor]);

  if (!editor) {
    return null;
  }

  const currentUrl = editor.getAttributes('link').href;

  // Only show when a link is active
  if (!editor.isActive('link')) {
    return null;
  }

  return (
    <div className="inline-flex">
      <Popover open={isOpen} onOpenChange={setIsOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="ghost"
            size="sm"
            className="h-6 px-2 text-blue-600 dark:text-blue-400 hover:bg-muted"
          >
            <LinkIcon className="h-3 w-3 mr-1" />
            <span className="text-xs max-w-[200px] truncate">
              {currentUrl}
            </span>
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-80 p-2" align="start" side="bottom">
          {!isEditing ? (
            <div className="flex items-center gap-2">
              <LinkIcon className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm text-foreground flex-1 truncate">
                {currentUrl}
              </span>

              <Button
                size="sm"
                variant="ghost"
                className="h-7 w-7 p-0"
                onClick={() => setIsEditing(true)}
                title="编辑"
              >
                <CheckIcon className="h-3 w-3" />
              </Button>

              <Button
                size="sm"
                variant="ghost"
                className="h-7 w-7 p-0"
                onClick={openLink}
                title="跳转"
              >
                <ExternalLinkIcon className="h-3 w-3" />
              </Button>

              <Button
                size="sm"
                variant="ghost"
                className="h-7 w-7 p-0 hover:bg-destructive hover:text-destructive-foreground"
                onClick={removeLink}
                title="删除"
              >
                <Trash2Icon className="h-3 w-3" />
              </Button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <input
                type="url"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    updateUrl();
                  } else if (e.key === 'Escape') {
                    setIsEditing(false);
                  }
                }}
                className="flex-1 h-8 px-2 text-sm border border-input rounded bg-background focus:outline-none focus:ring-2 focus:ring-ring"
                placeholder="输入 URL..."
                autoFocus
              />

              <Button
                size="sm"
                onClick={updateUrl}
                className="h-8 px-3"
                title="确认"
              >
                <CheckIcon className="h-3 w-3" />
              </Button>

              <Button
                size="sm"
                variant="ghost"
                onClick={() => setIsEditing(false)}
                className="h-8 w-8 p-0"
                title="取消"
              >
                ✕
              </Button>
            </div>
          )}
        </PopoverContent>
      </Popover>
    </div>
  );
}
