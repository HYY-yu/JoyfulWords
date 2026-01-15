"use client";

import { useState } from "react";
import { HighlighterIcon, XIcon } from "lucide-react";
import { Editor } from "@tiptap/react";
import { ToolbarButton } from "./tiptap-toolbar-button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

interface HighlightButtonsProps {
  editor: Editor | null;
}

// Macaron color palette - soft, pastel colors
const HIGHLIGHT_COLORS = [
  { color: '#FFE4E6', label: '粉色', value: '#FFE4E6' },   // Pink
  { color: '#FEF3C7', label: '黄色', value: '#FEF3C7' },  // Yellow
  { color: '#D1FAE5', label: '绿色', value: '#D1FAE5' },  // Green
  { color: '#DBEAFE', label: '蓝色', value: '#DBEAFE' },  // Blue
  { color: '#EDE9FE', label: '紫色', value: '#EDE9FE' },  // Purple
];

export function HighlightButtons({ editor }: HighlightButtonsProps) {
  const [isOpen, setIsOpen] = useState(false);

  if (!editor) return null;

  const addHighlight = (color: string) => {
    editor.chain().focus().setHighlight({ color }).run();
    setIsOpen(false);
  };

  const removeHighlight = () => {
    editor.chain().focus().unsetHighlight().run();
    setIsOpen(false);
  };

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <div>
          <ToolbarButton
            tooltip="Highlight"
            isActive={editor.isActive('highlight')}
            onClick={() => setIsOpen(!isOpen)}
          >
            <HighlighterIcon className="h-4 w-4" />
          </ToolbarButton>
        </div>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-3 rounded-lg shadow-lg" align="start" side="bottom">
        <div className="flex flex-col gap-2">
          {/* 颜色选择 */}
          <div className="grid grid-cols-6 gap-2">
            {HIGHLIGHT_COLORS.map((color) => (
              <button
                key={color.value}
                className="w-8 h-8 rounded border border-border hover:scale-110 transition-transform"
                style={{ backgroundColor: color.color }}
                title={color.label}
                onClick={() => addHighlight(color.value)}
              />
            ))}

            {/* 移除高亮 - 放到最后 */}
            <button
              onClick={removeHighlight}
              className="w-8 h-8 rounded border border-border hover:bg-destructive hover:text-destructive-foreground transition-colors flex items-center justify-center"
              title="Remove highlight"
            >
              <XIcon className="h-4 w-4" />
            </button>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}
