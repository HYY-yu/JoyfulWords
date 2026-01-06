"use client";

import { Editor } from "@tiptap/react";
import { useEffect, useState, useCallback } from "react";
import {
  AlignLeftIcon,
  AlignCenterIcon,
  AlignRightIcon,
  TrashIcon,
} from "lucide-react";
import { Button } from "./button";
import { Input } from "./input";

interface ImageMenuProps {
  editor: Editor;
}

export function ImageMenu({ editor }: ImageMenuProps) {
  const [show, setShow] = useState(false);
  const [width, setWidth] = useState<string>("");
  const [align, setAlign] = useState<"left" | "center" | "right">("left");

  // Check if an image is selected
  useEffect(() => {
    const updateMenu = () => {
      const { state } = editor;
      const { selection } = state;
      const { $from } = selection;

      // Check if current node is an image
      const node = $from.parent;
      const isImage = node.type.name === "customImage" ||
                      (selection as any).node?.type.name === "customImage";

      if (isImage) {
        const imageNode = (selection as any).node || node;
        setShow(true);
        setWidth(imageNode.attrs.width || "");
        setAlign(imageNode.attrs.align || "left");
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

  const deleteImage = useCallback(() => {
    editor.chain().focus().deleteSelection().run();
  }, [editor]);

  const updateWidth = useCallback((newWidth: string) => {
    if (!newWidth || newWidth === "") {
      editor.chain().focus().updateAttributes("customImage", {
        width: null,
        height: null
      }).run();
    } else {
      const widthValue = newWidth.endsWith("px") ? newWidth : `${newWidth}px`;
      editor.chain().focus().updateAttributes("customImage", {
        width: widthValue
      }).run();
    }
  }, [editor]);

  const updateAlign = useCallback((newAlign: "left" | "center" | "right") => {
    setAlign(newAlign);
    editor.chain().focus().updateAttributes("customImage", {
      align: newAlign
    }).run();
  }, [editor]);

  if (!show) return null;

  return (
    <div className="fixed bottom-4 left-1/2 transform -translate-x-1/2 z-50 bg-background border rounded-lg shadow-lg p-2 flex items-center gap-2">
      {/* Width input */}
      <div className="flex items-center gap-1">
        <label className="text-xs text-muted-foreground">宽度:</label>
        <Input
          type="text"
          placeholder="auto"
          value={width}
          onChange={(e) => setWidth(e.target.value)}
          onBlur={(e) => updateWidth(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              updateWidth((e.target as HTMLInputElement).value);
            }
          }}
          className="w-20 h-8 text-sm"
        />
      </div>

      <div className="w-px h-6 bg-border" />

      {/* Alignment buttons */}
      <div className="flex gap-1">
        <Button
          variant={align === "left" ? "default" : "ghost"}
          size="sm"
          onClick={() => updateAlign("left")}
          className="h-8 w-8 p-0"
        >
          <AlignLeftIcon className="h-4 w-4" />
        </Button>
        <Button
          variant={align === "center" ? "default" : "ghost"}
          size="sm"
          onClick={() => updateAlign("center")}
          className="h-8 w-8 p-0"
        >
          <AlignCenterIcon className="h-4 w-4" />
        </Button>
        <Button
          variant={align === "right" ? "default" : "ghost"}
          size="sm"
          onClick={() => updateAlign("right")}
          className="h-8 w-8 p-0"
        >
          <AlignRightIcon className="h-4 w-4" />
        </Button>
      </div>

      <div className="w-px h-6 bg-border" />

      {/* Delete button */}
      <Button
        variant="ghost"
        size="sm"
        onClick={deleteImage}
        className="h-8 w-8 p-0 text-destructive hover:text-destructive"
      >
        <TrashIcon className="h-4 w-4" />
      </Button>
    </div>
  );
}
