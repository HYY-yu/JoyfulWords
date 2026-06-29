"use client";

/* eslint-disable @next/next/no-img-element */

import { Editor } from "@tiptap/react";
import { useEffect, useState, useCallback } from "react";
import {
  AlignLeftIcon,
  AlignCenterIcon,
  AlignRightIcon,
  ArrowLeftIcon,
  Loader2Icon,
  PaletteIcon,
  PaintbrushIcon,
  RefreshCwIcon,
  TrashIcon,
} from "lucide-react";
import { Button } from "../base/button";
import { Input } from "../base/input";
import { Popover, PopoverContent, PopoverTrigger } from "../base/popover";
import { ScrollArea } from "../base/scroll-area";
import { Textarea } from "../base/textarea";
import { useToast } from "@/hooks/use-toast";
import { imageGenerationClient } from "@/lib/api/image-generation/client";
import { useTranslation } from "@/lib/i18n/i18n-context";
import { cn } from "@/lib/utils";
import { ImageInpaintBoard } from "./image-inpaint-board";

interface StyleItem {
  id: string;
  name: string;
  img_url: string;
  full_prompt?: string;
}

interface ImageMenuProps {
  editor: Editor;
  articleId?: number | null;
  onImageTaskSubmitted?: () => void;
}

interface ImageStylePopoverProps {
  imageSrc: string | null;
  articleId?: number | null;
  onTaskSubmitted?: () => void;
}

function ImageStylePopover({
  imageSrc,
  articleId,
  onTaskSubmitted,
}: ImageStylePopoverProps) {
  const { t } = useTranslation();
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [styles, setStyles] = useState<StyleItem[]>([]);
  const [loadingStyles, setLoadingStyles] = useState(false);
  const [styleLoadError, setStyleLoadError] = useState(false);
  const [submittingStyleId, setSubmittingStyleId] = useState<string | null>(null);
  const [showCustomStyle, setShowCustomStyle] = useState(false);
  const [customPrompt, setCustomPrompt] = useState("");

  const fetchStyles = useCallback(async () => {
    setLoadingStyles(true);
    setStyleLoadError(false);

    try {
      console.debug("[ImageMenu] Fetching image style examples");
      const result = await imageGenerationClient.getStyleExamples();

      if ("error" in result) {
        console.error("[ImageMenu] Failed to fetch image style examples", {
          error: result.error,
        });
        setStyleLoadError(true);
        return;
      }

      const nextStyles = result.style_list.map((style, index) => ({
        id: `style-${index}`,
        name: style.name,
        img_url: style.img_url,
        full_prompt: style.full_prompt,
      }));

      console.info("[ImageMenu] Image style examples loaded", {
        count: nextStyles.length,
      });
      setStyles(nextStyles);
    } catch (error) {
      console.error("[ImageMenu] Unexpected error while loading image styles", {
        error,
      });
      setStyleLoadError(true);
    } finally {
      setLoadingStyles(false);
    }
  }, []);

  useEffect(() => {
    if (!open || styles.length > 0 || loadingStyles) return;

    void fetchStyles();
  }, [fetchStyles, loadingStyles, open, styles.length]);

  useEffect(() => {
    if (open) return;

    setShowCustomStyle(false);
    setCustomPrompt("");
  }, [open]);

  const submitStyleTask = useCallback(async (style: StyleItem) => {
    if (!imageSrc) {
      console.warn("[ImageMenu] Cannot create style task without selected image source");
      toast({
        variant: "destructive",
        title: t("tiptapEditor.imageMenu.noImageSource"),
      });
      return;
    }

    setSubmittingStyleId(style.id);

    try {
      // TRACE: editor image style task submission.
      console.info("[ImageMenu] Creating editor image style task", {
        articleId,
        styleName: style.name,
        hasPrompt: !!style.full_prompt,
        hasImageSrc: !!imageSrc,
      });

      const result = await imageGenerationClient.createGenerationTask({
        gen_mode: "style",
        prompt: style.full_prompt || style.name,
        article_id: articleId ?? undefined,
        reference_images: [imageSrc],
      });

      if ("error" in result) {
        console.error("[ImageMenu] Failed to create image style task", {
          error: result.error,
        });
        toast({
          variant: "destructive",
          title: t("tiptapEditor.imageMenu.taskCreateFailed"),
        });
        return;
      }

      console.info("[ImageMenu] Editor image style task created", {
        taskId: result.task_id,
        status: result.status,
      });
      toast({
        title: t("tiptapEditor.imageMenu.taskCreated"),
      });
      setOpen(false);
      onTaskSubmitted?.();
    } catch (error) {
      console.error("[ImageMenu] Unexpected error while creating image style task", {
        error,
      });
      toast({
        variant: "destructive",
        title: t("tiptapEditor.imageMenu.taskCreateFailed"),
      });
    } finally {
      setSubmittingStyleId(null);
    }
  }, [articleId, imageSrc, onTaskSubmitted, t, toast]);

  const submitCustomStyleTask = useCallback(() => {
    const trimmedPrompt = customPrompt.trim();
    if (!trimmedPrompt) {
      toast({
        variant: "destructive",
        title: t("tiptapEditor.imageMenu.customRequired"),
      });
      return;
    }

    void submitStyleTask({
      id: "custom",
      name: t("tiptapEditor.imageMenu.customStyle"),
      img_url: "",
      full_prompt: trimmedPrompt,
    });
  }, [customPrompt, submitStyleTask, t, toast]);

  const hasStyles = styles.length > 0;
  const isSubmitting = submittingStyleId !== null;
  const isSubmittingCustom = submittingStyleId === "custom";

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          disabled={!imageSrc || isSubmitting}
          className="h-8 w-8 p-0"
          title={t("tiptapEditor.imageMenu.styleImage")}
          aria-label={t("tiptapEditor.imageMenu.styleImage")}
        >
          {isSubmitting ? (
            <Loader2Icon className="h-4 w-4 animate-spin" />
          ) : (
            <PaletteIcon className="h-4 w-4" />
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent
        side="top"
        align="center"
        className="max-h-[calc(100vh-96px)] w-[min(92vw,380px)] overflow-hidden p-0"
      >
        <div className="border-b px-3 py-2">
          <div className="flex items-center gap-2">
            {showCustomStyle ? (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setShowCustomStyle(false)}
                disabled={isSubmitting}
                className="h-7 w-7 p-0"
                aria-label={t("common.back")}
                title={t("common.back")}
              >
                <ArrowLeftIcon className="h-4 w-4" />
              </Button>
            ) : null}
            <p className="text-sm font-medium">
              {showCustomStyle
                ? t("tiptapEditor.imageMenu.customTitle")
                : t("tiptapEditor.imageMenu.styleListTitle")}
            </p>
          </div>
          <p className="mt-0.5 text-xs text-muted-foreground">
            {showCustomStyle
              ? t("tiptapEditor.imageMenu.customDescription")
              : t("tiptapEditor.imageMenu.styleListDescription")}
          </p>
        </div>

        <div className="p-2">
          {showCustomStyle ? (
            <div className="space-y-3">
              <Textarea
                value={customPrompt}
                onChange={(event) => setCustomPrompt(event.target.value)}
                placeholder={t("tiptapEditor.imageMenu.customPlaceholder")}
                disabled={isSubmitting}
                className="min-h-28 resize-none text-sm"
              />
              <div className="flex items-center justify-end gap-2">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setShowCustomStyle(false);
                    setCustomPrompt("");
                  }}
                  disabled={isSubmitting}
                >
                  {t("tiptapEditor.imageMenu.customCancel")}
                </Button>
                <Button
                  type="button"
                  size="sm"
                  onClick={submitCustomStyleTask}
                  disabled={isSubmitting}
                >
                  {isSubmittingCustom ? (
                    <Loader2Icon className="h-4 w-4 animate-spin" />
                  ) : (
                    <PaletteIcon className="h-4 w-4" />
                  )}
                  {t("tiptapEditor.imageMenu.customSubmit")}
                </Button>
              </div>
            </div>
          ) : loadingStyles ? (
            <div className="flex h-28 items-center justify-center gap-2 text-sm text-muted-foreground">
              <Loader2Icon className="h-4 w-4 animate-spin" />
              {t("tiptapEditor.imageMenu.loadingStyles")}
            </div>
          ) : styleLoadError ? (
            <div className="flex h-28 flex-col items-center justify-center gap-2 text-center">
              <p className="text-sm text-muted-foreground">
                {t("tiptapEditor.imageMenu.loadStylesFailed")}
              </p>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => void fetchStyles()}
              >
                <RefreshCwIcon className="h-4 w-4" />
                {t("tiptapEditor.imageMenu.retry")}
              </Button>
            </div>
          ) : hasStyles ? (
            <ScrollArea className="h-[min(360px,calc(100vh-180px))]">
              <div className="grid grid-cols-2 gap-2 pr-2">
                {styles.map((style) => {
                  const isCurrentSubmitting = submittingStyleId === style.id;

                  return (
                    <button
                      key={style.id}
                      type="button"
                      disabled={isSubmitting}
                      onClick={() => void submitStyleTask(style)}
                      className={cn(
                        "group min-w-0 overflow-hidden rounded-md border bg-background text-left transition-colors",
                        "hover:border-[var(--jw-accent)] hover:bg-accent/40 disabled:pointer-events-none disabled:opacity-60"
                      )}
                      title={style.name}
                    >
                      <span className="relative block aspect-[4/3] overflow-hidden bg-muted">
                        {style.img_url ? (
                          <img
                            src={style.img_url}
                            alt={style.name}
                            className="h-full w-full object-cover transition-transform duration-200 group-hover:scale-105"
                          />
                        ) : (
                          <span className="flex h-full w-full items-center justify-center text-muted-foreground">
                            <PaletteIcon className="h-5 w-5" />
                          </span>
                        )}
                        {isCurrentSubmitting ? (
                          <span className="absolute inset-0 flex items-center justify-center bg-background/70">
                            <Loader2Icon className="h-5 w-5 animate-spin text-[var(--jw-accent)]" />
                          </span>
                        ) : null}
                      </span>
                      <span className="block truncate px-2 py-1.5 text-xs font-medium">
                        {style.name}
                      </span>
                    </button>
                  );
                })}
                <button
                  type="button"
                  disabled={isSubmitting}
                  onClick={() => setShowCustomStyle(true)}
                  className={cn(
                    "group flex min-h-[118px] min-w-0 flex-col items-center justify-center gap-2 rounded-md border border-dashed bg-background px-3 text-center transition-colors",
                    "hover:border-[var(--jw-accent)] hover:bg-accent/40 disabled:pointer-events-none disabled:opacity-60"
                  )}
                >
                  <span className="flex h-9 w-9 items-center justify-center rounded-full bg-[var(--jw-accent-soft)] text-[var(--jw-accent)]">
                    <PaletteIcon className="h-4 w-4" />
                  </span>
                  <span className="text-xs font-medium">
                    {t("tiptapEditor.imageMenu.customStyle")}
                  </span>
                </button>
              </div>
            </ScrollArea>
          ) : (
            <div className="flex h-32 flex-col items-center justify-center gap-2 text-sm text-muted-foreground">
              <p>{t("tiptapEditor.imageMenu.noStyles")}</p>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setShowCustomStyle(true)}
              >
                <PaletteIcon className="h-4 w-4" />
                {t("tiptapEditor.imageMenu.customStyle")}
              </Button>
            </div>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}

export function ImageMenu({ editor, articleId, onImageTaskSubmitted }: ImageMenuProps) {
  const [show, setShow] = useState(false);
  const [width, setWidth] = useState<string>("");
  const [align, setAlign] = useState<"left" | "center" | "right">("center");
  const [imageSrc, setImageSrc] = useState<string | null>(null);
  const [imagePos, setImagePos] = useState<number | null>(null);
  const [inpaintOpen, setInpaintOpen] = useState(false);
  const [inpaintImageSrc, setInpaintImageSrc] = useState<string | null>(null);
  const [inpaintImagePos, setInpaintImagePos] = useState<number | null>(null);
  const { t } = useTranslation();

  // Check if an image is selected
  useEffect(() => {
    const updateMenu = () => {
      const { state } = editor;
      const { selection } = state;
      const { $from } = selection;

      // Check if current node is an image
      const node = $from.parent;
      const selectedNode = (selection as any).node;
      const isImage = node.type.name === "customImage" ||
                      selectedNode?.type.name === "customImage";

      if (isImage) {
        const imageNode = selectedNode || node;
        let nextImagePos: number | null = null;
        if (selectedNode?.type.name === "customImage") {
          nextImagePos = selection.from;
        } else if (node.type.name === "customImage") {
          try {
            nextImagePos = $from.before($from.depth);
          } catch {
            nextImagePos = selection.from;
          }
        }

        setShow(true);
        setWidth(imageNode.attrs.width || "");
        setAlign(imageNode.attrs.align || "center");
        setImageSrc(typeof imageNode.attrs.src === "string" ? imageNode.attrs.src : null);
        setImagePos(nextImagePos);
      } else {
        setShow(false);
        if (!inpaintOpen) {
          setImageSrc(null);
          setImagePos(null);
        }
      }
    };

    editor.on("selectionUpdate", updateMenu);
    editor.on("transaction", updateMenu);

    return () => {
      editor.off("selectionUpdate", updateMenu);
      editor.off("transaction", updateMenu);
    };
  }, [editor, inpaintOpen]);

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

  const openInpaintBoard = useCallback(() => {
    if (!imageSrc) return;
    setInpaintImageSrc(imageSrc);
    setInpaintImagePos(imagePos);
    setInpaintOpen(true);
  }, [imagePos, imageSrc]);

  const replaceCurrentImage = useCallback((imageUrl: string) => {
    if (inpaintImagePos == null) return false;

    return editor
      .chain()
      .focus()
      .command(({ state, tr, dispatch }) => {
        const node = state.doc.nodeAt(inpaintImagePos);
        if (!node || node.type.name !== "customImage") return false;

        tr.setNodeMarkup(inpaintImagePos, undefined, {
          ...node.attrs,
          src: imageUrl,
        });
        dispatch?.(tr);
        return true;
      })
      .run();
  }, [editor, inpaintImagePos]);

  const insertGeneratedImage = useCallback((imageUrl: string) => {
    return editor
      .chain()
      .focus()
      .insertContent({
        type: "customImage",
        attrs: {
          src: imageUrl,
          alt: t("tiptapEditor.imageMenu.inpaintInsertedAlt"),
          align: "center",
        },
      })
      .run();
  }, [editor, t]);

  if (!show && !inpaintOpen) return null;

  return (
    <>
    {show ? (
    <div className="fixed bottom-4 left-1/2 transform -translate-x-1/2 z-50 bg-background border rounded-lg shadow-lg p-2 flex items-center gap-2">
      {/* Width input */}
      <div className="flex items-center gap-1">
        <label className="text-xs text-muted-foreground">{t("tiptapEditor.imageMenu.widthLabel")}</label>
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

      <ImageStylePopover
        imageSrc={imageSrc}
        articleId={articleId}
        onTaskSubmitted={onImageTaskSubmitted}
      />

      <div className="w-px h-6 bg-border" />

      <Button
        type="button"
        variant="ghost"
        size="sm"
        disabled={!imageSrc}
        onClick={openInpaintBoard}
        className="h-8 w-8 p-0"
        title={t("tiptapEditor.imageMenu.inpaint")}
        aria-label={t("tiptapEditor.imageMenu.inpaint")}
      >
        <PaintbrushIcon className="h-4 w-4" />
      </Button>

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
    ) : null}
      <ImageInpaintBoard
        key={inpaintImageSrc ?? "inpaint-empty"}
        open={inpaintOpen}
        onOpenChange={setInpaintOpen}
        imageSrc={inpaintImageSrc}
        articleId={articleId}
        onTaskSubmitted={onImageTaskSubmitted}
        onReplaceCurrentImage={replaceCurrentImage}
        onInsertImage={insertGeneratedImage}
      />
    </>
  );
}
