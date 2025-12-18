"use client";

import { BoldIcon } from "lucide-react";
import React from "react";

import {
  Button,
  type ButtonProps,
} from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

export interface ToolbarButtonProps extends ButtonProps {
  isActive?: boolean;
  tooltip?: string;
  shortcut?: string;
}

export const ToolbarButton = React.forwardRef<HTMLButtonElement, ToolbarButtonProps>(
  ({ className, onClick, children, isActive, tooltip, shortcut, disabled, ...props }, ref) => {
    const button = (
      <Button
        variant="ghost"
        size="icon"
        className={cn(
          "h-8 w-8",
          isActive && "bg-accent",
          className,
        )}
        onClick={onClick}
        disabled={disabled}
        ref={ref}
        {...props}
      >
        {children}
      </Button>
    );

    if (!tooltip && !shortcut) return button;

    return (
      <Tooltip>
        <TooltipTrigger asChild>
          {button}
        </TooltipTrigger>
        <TooltipContent>
          <span>{tooltip}</span>
          {shortcut && <span className="ml-1 text-xs text-muted-foreground">({shortcut})</span>}
        </TooltipContent>
      </Tooltip>
    );
  },
);

ToolbarButton.displayName = "ToolbarButton";

export const BoldToolbarButton = React.forwardRef<HTMLButtonElement, ToolbarButtonProps>(
  ({ editor, ...props }, ref) => {
    return (
      <ToolbarButton
        tooltip="Bold"
        shortcut="⌘B"
        isActive={editor?.isActive('bold')}
        disabled={!editor?.can().chain().focus().toggleBold().run()}
        onClick={() => editor?.chain().focus().toggleBold().run()}
        ref={ref}
        {...props}
      >
        <BoldIcon className="h-4 w-4" />
      </ToolbarButton>
    );
  },
);

BoldToolbarButton.displayName = "BoldToolbarButton";