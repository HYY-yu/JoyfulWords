"use client";

import {
  AlignLeftIcon,
  AlignCenterIcon,
  AlignRightIcon,
  AlignJustifyIcon,
} from "lucide-react";
import { Editor } from "@tiptap/react";
import { ToolbarButton } from "./tiptap-toolbar-button";

interface TextAlignButtonsProps {
  editor: Editor | null;
}

export function TextAlignButtons({ editor }: TextAlignButtonsProps) {
  if (!editor) return null;

  return (
    <div className="flex gap-1">
      <ToolbarButton
        tooltip="Align Left"
        isActive={editor.isActive({ textAlign: 'left' })}
        onClick={() => editor.chain().focus().setTextAlign('left').run()}
      >
        <AlignLeftIcon className="h-4 w-4" />
      </ToolbarButton>

      <ToolbarButton
        tooltip="Align Center"
        isActive={editor.isActive({ textAlign: 'center' })}
        onClick={() => editor.chain().focus().setTextAlign('center').run()}
      >
        <AlignCenterIcon className="h-4 w-4" />
      </ToolbarButton>

      <ToolbarButton
        tooltip="Align Right"
        isActive={editor.isActive({ textAlign: 'right' })}
        onClick={() => editor.chain().focus().setTextAlign('right').run()}
      >
        <AlignRightIcon className="h-4 w-4" />
      </ToolbarButton>

      <ToolbarButton
        tooltip="Justify"
        isActive={editor.isActive({ textAlign: 'justify' })}
        onClick={() => editor.chain().focus().setTextAlign('justify').run()}
      >
        <AlignJustifyIcon className="h-4 w-4" />
      </ToolbarButton>
    </div>
  );
}
