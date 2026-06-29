"use client";

/* eslint-disable @next/next/no-img-element */

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  CheckIcon,
  EraserIcon,
  HandIcon,
  ImagePlusIcon,
  Loader2Icon,
  PaintbrushIcon,
  ReplaceIcon,
  RotateCcwIcon,
  Undo2Icon,
  XIcon,
} from "lucide-react";
import { Button } from "../base/button";
import { Input } from "../base/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "../base/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../base/select";
import { Slider } from "../base/slider";
import { Tooltip, TooltipContent, TooltipTrigger } from "../base/tooltip";
import { useToast } from "@/hooks/use-toast";
import { imageGenerationClient } from "@/lib/api/image-generation/client";
import type { TaskResultSuccess } from "@/lib/api/image-generation/types";
import type { CreatorConfig } from "@/components/image-generator/types";
import { uploadImageToR2 } from "@/lib/tiptap-image-upload";
import { useTranslation } from "@/lib/i18n/i18n-context";
import { cn } from "@/lib/utils";

type Tool = "pan" | "draw" | "erase";
type Status = "idle" | "loading" | "uploading" | "generating" | "success" | "error";

interface Point {
  x: number;
  y: number;
}

interface Viewport {
  scale: number;
  offsetX: number;
  offsetY: number;
}

interface BoardImage {
  id: string;
  src: string;
  safeSrc: string;
  w: number;
  h: number;
}

interface Stroke {
  id: string;
  imageId: string;
  color: string;
  label: string;
  width: number;
  points: Point[];
}

interface ImageInpaintBoardProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  imageSrc: string | null;
  articleId?: number | null;
  onTaskSubmitted?: () => void;
  onReplaceCurrentImage?: (imageUrl: string) => boolean;
  onInsertImage?: (imageUrl: string) => boolean;
}

const DEFAULT_MODEL = "gpt-image-2";
const STROKE_ALPHA = 0.45;
const MAX_UPLOAD_BYTES = 5 * 1024 * 1024;
const COMPARISON_GAP = 56;
const POLL_INTERVAL_MS = 3500;
const MAX_POLL_ATTEMPTS = 60;
const INPAINT_PROMPT =
  "Use the uploaded reference image as the only visual instruction. The semi-transparent colored brush marks identify local areas to repaint or revise. Infer the intended local edit from the marked regions, keep unmarked areas unchanged, and return a polished natural image.";

const STROKE_COLORS = [
  "#d99b2b",
  "#d94d8f",
  "#3b82f6",
  "#22c55e",
  "#f97316",
  "#a855f7",
  "#06b6d4",
  "#ef4444",
];

function makeId(prefix: string) {
  return `${prefix}-${Math.random().toString(36).slice(2, 9)}-${Date.now().toString(36)}`;
}

function hslToHex(hue: number, saturation: number, lightness: number) {
  const s = saturation / 100;
  const l = lightness / 100;
  const k = (n: number) => (n + hue / 30) % 12;
  const a = s * Math.min(l, 1 - l);
  const f = (n: number) => {
    const color = l - a * Math.max(-1, Math.min(k(n) - 3, Math.min(9 - k(n), 1)));
    return Math.round(255 * color).toString(16).padStart(2, "0");
  };

  return `#${f(0)}${f(8)}${f(4)}`;
}

function getStrokeColor(index: number) {
  if (index < STROKE_COLORS.length) return STROKE_COLORS[index];
  return hslToHex((index * 137.508) % 360, 68, 54);
}

function getCanvasSafeSrc(src: string) {
  if (src.startsWith("data:") || src.startsWith("blob:") || src.startsWith("/")) return src;

  try {
    const url = new URL(src);
    if (url.protocol !== "https:") return src;
    return `/api/image-proxy?url=${encodeURIComponent(src)}`;
  } catch {
    return src;
  }
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error("image_load_failed"));
    img.src = getCanvasSafeSrc(src);
  });
}

function canvasToBlob(canvas: HTMLCanvasElement, type: string, quality?: number): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (!blob) {
          reject(new Error("canvas_export_failed"));
          return;
        }
        resolve(blob);
      },
      type,
      quality
    );
  });
}

function getFirstImageUrl(value: TaskResultSuccess["image_url"]) {
  if (Array.isArray(value)) return value[0] ?? "";

  const trimmed = String(value || "").trim();
  if (!trimmed) return "";

  if (trimmed.startsWith("[")) {
    try {
      const parsed = JSON.parse(trimmed) as unknown;
      if (Array.isArray(parsed)) return typeof parsed[0] === "string" ? parsed[0] : "";
    } catch {
      return trimmed;
    }
  }

  return trimmed;
}

function screenToWorld(point: Point, viewport: Viewport): Point {
  return {
    x: (point.x - viewport.offsetX) / viewport.scale,
    y: (point.y - viewport.offsetY) / viewport.scale,
  };
}

function worldToScreen(point: Point, viewport: Viewport): Point {
  return {
    x: point.x * viewport.scale + viewport.offsetX,
    y: point.y * viewport.scale + viewport.offsetY,
  };
}

function clampToImage(point: Point, image: BoardImage): Point {
  return {
    x: Math.max(0, Math.min(image.w, point.x)),
    y: Math.max(0, Math.min(image.h, point.y)),
  };
}

function pointInImage(point: Point, image: BoardImage) {
  return point.x >= 0 && point.x <= image.w && point.y >= 0 && point.y <= image.h;
}

function distanceToSegment(point: Point, a: Point, b: Point) {
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  const len = dx * dx + dy * dy;
  const t = len === 0 ? 0 : Math.max(0, Math.min(1, ((point.x - a.x) * dx + (point.y - a.y) * dy) / len));
  const x = a.x + t * dx;
  const y = a.y + t * dy;
  return Math.hypot(point.x - x, point.y - y);
}

function hitTestStroke(world: Point, strokes: Stroke[]) {
  for (let strokeIndex = strokes.length - 1; strokeIndex >= 0; strokeIndex--) {
    const stroke = strokes[strokeIndex];
    const threshold = stroke.width / 2 + 4;

    if (stroke.points.length === 1) {
      if (Math.hypot(world.x - stroke.points[0].x, world.y - stroke.points[0].y) <= threshold) {
        return stroke;
      }
      continue;
    }

    for (let index = 1; index < stroke.points.length; index++) {
      if (distanceToSegment(world, stroke.points[index - 1], stroke.points[index]) <= threshold) {
        return stroke;
      }
    }
  }

  return null;
}

function strokeToPath(stroke: Stroke, viewport: Viewport) {
  if (stroke.points.length === 0) return "";

  const first = worldToScreen(stroke.points[0], viewport);
  if (stroke.points.length === 1) return `M ${first.x} ${first.y} L ${first.x + 0.01} ${first.y + 0.01}`;

  return stroke.points
    .map((point, index) => {
      const screen = worldToScreen(point, viewport);
      return `${index === 0 ? "M" : "L"} ${screen.x} ${screen.y}`;
    })
    .join(" ");
}

function getComparisonSize(source: BoardImage, comparison: BoardImage | null) {
  if (!comparison) return null;

  return {
    w: Math.max(1, source.h * (comparison.w / Math.max(1, comparison.h))),
    h: source.h,
  };
}

function getBoardSize(image: BoardImage, comparison: BoardImage | null) {
  const comparisonSize = getComparisonSize(image, comparison);
  if (!comparisonSize) return { w: image.w, h: image.h };

  return {
    w: image.w + COMPARISON_GAP + comparisonSize.w,
    h: Math.max(image.h, comparisonSize.h),
  };
}

function fitImageViewport(image: BoardImage, width: number, height: number, comparison: BoardImage | null = null): Viewport {
  const board = getBoardSize(image, comparison);
  const scale = Math.min(1.2, Math.max(0.08, Math.min((width - 112) / board.w, (height - 112) / board.h)));

  return {
    scale,
    offsetX: (width - board.w * scale) / 2,
    offsetY: (height - board.h * scale) / 2,
  };
}

function zoomAt(viewport: Viewport, anchor: Point, nextScale: number): Viewport {
  const scale = Math.max(0.08, Math.min(8, nextScale));
  const world = screenToWorld(anchor, viewport);

  return {
    scale,
    offsetX: anchor.x - world.x * scale,
    offsetY: anchor.y - world.y * scale,
  };
}

function buildInpaintPrompt(strokes: Stroke[]) {
  const labels = strokes
    .map((stroke) => {
      const label = stroke.label.trim();
      return label ? `${stroke.color}: ${label}` : "";
    })
    .filter(Boolean);

  if (labels.length === 0) return INPAINT_PROMPT;
  return `${INPAINT_PROMPT}\n\nColor label guide for the painted marks:\n${labels.join("\n")}`;
}

function buildInpaintConfig(image: BoardImage, referenceImageUrl: string, prompt: string): CreatorConfig {
  return {
    version: "1.0",
    meta: {
      width: Math.round(image.w),
      high: Math.round(image.h),
      seed: -1,
    },
    global_style: {
      medium: "Photography",
      style: "Minimalism",
      color_accent: "Cool Tones",
    },
    composition: {
      camera: {
        angle: "Eye Level",
        focal_length: "50mm",
        depth_of_field: "Deep",
      },
      lighting: {
        type: "Natural Light",
        source: "Front",
        intensity: 0.7,
      },
    },
    layers: [
      {
        id: "local-repaint-reference",
        description: prompt,
        reference_image: referenceImageUrl,
        spatial_layout: {
          box_2d: [0, 0, Math.round(image.w), Math.round(image.h)],
          z_index: 1,
        },
      },
    ],
  };
}

async function exportMarkedImage(image: BoardImage, strokes: Stroke[]) {
  const source = await loadImage(image.src);
  let scale = Math.min(1, 4096 / Math.max(image.w, image.h));
  let lastBlob: Blob | null = null;

  for (let attempt = 0; attempt < 6; attempt++) {
    const width = Math.max(1, Math.round(image.w * scale));
    const height = Math.max(1, Math.round(image.h * scale));
    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;

    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("canvas_context_failed");

    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, width, height);
    ctx.drawImage(source, 0, 0, width, height);

    for (const stroke of strokes) {
      ctx.save();
      ctx.globalAlpha = STROKE_ALPHA;
      ctx.strokeStyle = stroke.color;
      ctx.fillStyle = stroke.color;
      ctx.lineWidth = Math.max(1, stroke.width * scale);
      ctx.lineCap = "round";
      ctx.lineJoin = "round";

      if (stroke.points.length === 1) {
        const p = stroke.points[0];
        ctx.beginPath();
        ctx.arc(p.x * scale, p.y * scale, (stroke.width * scale) / 2, 0, Math.PI * 2);
        ctx.fill();
      } else if (stroke.points.length > 1) {
        ctx.beginPath();
        ctx.moveTo(stroke.points[0].x * scale, stroke.points[0].y * scale);
        for (let index = 1; index < stroke.points.length; index++) {
          ctx.lineTo(stroke.points[index].x * scale, stroke.points[index].y * scale);
        }
        ctx.stroke();
      }

      ctx.restore();
    }

    if (attempt === 0) {
      const png = await canvasToBlob(canvas, "image/png");
      if (png.size <= MAX_UPLOAD_BYTES) {
        return new File([png], `inpaint-reference-${Date.now()}.png`, { type: "image/png" });
      }
      lastBlob = png;
    }

    for (const quality of [0.92, 0.84, 0.76, 0.68]) {
      const jpeg = await canvasToBlob(canvas, "image/jpeg", quality);
      if (jpeg.size <= MAX_UPLOAD_BYTES) {
        return new File([jpeg], `inpaint-reference-${Date.now()}.jpg`, { type: "image/jpeg" });
      }
      lastBlob = jpeg;
    }

    const ratio = Math.sqrt(MAX_UPLOAD_BYTES / Math.max(lastBlob?.size ?? MAX_UPLOAD_BYTES, 1));
    scale = Math.max(0.25, scale * Math.min(0.82, ratio * 0.9));
  }

  throw new Error("compressed_image_too_large");
}

export function ImageInpaintBoard({
  open,
  onOpenChange,
  imageSrc,
  articleId,
  onTaskSubmitted,
  onReplaceCurrentImage,
  onInsertImage,
}: ImageInpaintBoardProps) {
  const { t } = useTranslation();
  const { toast } = useToast();
  const stageRef = useRef<HTMLDivElement | null>(null);
  const pointerRef = useRef<{ type: Tool | null; x: number; y: number }>({ type: null, x: 0, y: 0 });
  const pollingAbortRef = useRef(false);
  const pollingTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const strokeIndexRef = useRef(0);

  const [stageSize, setStageSize] = useState({ w: 0, h: 0 });
  const [image, setImage] = useState<BoardImage | null>(null);
  const [comparisonImage, setComparisonImage] = useState<BoardImage | null>(null);
  const [viewport, setViewport] = useState<Viewport>({ scale: 1, offsetX: 0, offsetY: 0 });
  const [tool, setTool] = useState<Tool>("draw");
  const [brushWidth, setBrushWidth] = useState(28);
  const [strokes, setStrokes] = useState<Stroke[]>([]);
  const [draftStroke, setDraftStroke] = useState<Stroke | null>(null);
  const [selectedStrokeId, setSelectedStrokeId] = useState<string | null>(null);
  const [models, setModels] = useState<string[]>([DEFAULT_MODEL]);
  const [modelsLoading, setModelsLoading] = useState(false);
  const [selectedModel, setSelectedModel] = useState(DEFAULT_MODEL);
  const [status, setStatus] = useState<Status>("idle");
  const [generatedUrl, setGeneratedUrl] = useState<string | null>(null);

  const isBusy = status === "uploading" || status === "generating";
  const modelOptions = useMemo(() => Array.from(new Set([DEFAULT_MODEL, ...models.filter(Boolean)])), [models]);
  const visibleStrokes = draftStroke ? [...strokes, draftStroke] : strokes;

  const imageRect = image
    ? {
        left: viewport.offsetX,
        top: viewport.offsetY,
        width: image.w * viewport.scale,
        height: image.h * viewport.scale,
      }
    : null;

  const comparisonRect = image && comparisonImage
    ? (() => {
        const comparisonSize = getComparisonSize(image, comparisonImage);
        if (!comparisonSize) return null;

        return {
          left: viewport.offsetX + (image.w + COMPARISON_GAP) * viewport.scale,
          top: viewport.offsetY,
          width: comparisonSize.w * viewport.scale,
          height: comparisonSize.h * viewport.scale,
        };
      })()
    : null;

  useEffect(() => {
    const stage = stageRef.current;
    if (!stage) return;

    const update = () => {
      const rect = stage.getBoundingClientRect();
      setStageSize((current) => {
        if (Math.abs(current.w - rect.width) < 0.5 && Math.abs(current.h - rect.height) < 0.5) return current;
        return { w: rect.width, h: rect.height };
      });
    };

    update();
    const observer = new ResizeObserver(update);
    observer.observe(stage);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!open || !imageSrc) return;

    let cancelled = false;
    setStatus("loading");
    setImage(null);
    setComparisonImage(null);
    setStrokes([]);
    setDraftStroke(null);
    setSelectedStrokeId(null);
    setGeneratedUrl(null);
    strokeIndexRef.current = 0;

    void loadImage(imageSrc)
      .then((loaded) => {
        if (cancelled) return;

        const nextImage: BoardImage = {
          id: makeId("image"),
          src: imageSrc,
          safeSrc: getCanvasSafeSrc(imageSrc),
          w: Math.max(1, loaded.naturalWidth),
          h: Math.max(1, loaded.naturalHeight),
        };

        setImage(nextImage);
        setStatus("idle");

        window.requestAnimationFrame(() => {
          const rect = stageRef.current?.getBoundingClientRect();
          if (!rect) return;
          setViewport(fitImageViewport(nextImage, rect.width, rect.height));
        });
      })
      .catch((error) => {
        console.error("[ImageInpaintBoard] Failed to load image", { error });
        setStatus("error");
        toast({
          variant: "destructive",
          title: t("tiptapEditor.imageMenu.inpaintImageLoadFailed"),
        });
      });

    return () => {
      cancelled = true;
    };
  }, [imageSrc, open, t, toast]);

  useEffect(() => {
    if (!open) return;

    setModelsLoading(true);
    imageGenerationClient
      .getModels()
      .then((result) => {
        if ("error" in result) {
          console.error("[ImageInpaintBoard] Failed to fetch models", { error: result.error });
          return;
        }
        setModels(result.models);
      })
      .catch((error) => {
        console.error("[ImageInpaintBoard] Unexpected model fetch error", { error });
      })
      .finally(() => setModelsLoading(false));
  }, [open]);

  useEffect(() => {
    return () => {
      pollingAbortRef.current = true;
      if (pollingTimerRef.current) clearTimeout(pollingTimerRef.current);
    };
  }, []);

  const getPointer = useCallback((event: { clientX: number; clientY: number }) => {
    const rect = stageRef.current?.getBoundingClientRect();
    if (!rect) return { x: 0, y: 0 };
    return { x: event.clientX - rect.left, y: event.clientY - rect.top };
  }, []);

  const nextStrokeDefaults = useCallback(() => {
    const index = strokeIndexRef.current;
    strokeIndexRef.current += 1;
    return {
      color: getStrokeColor(index),
      label: `${t("tiptapEditor.imageMenu.inpaintStrokeDefaultLabel")} ${index + 1}`,
    };
  }, [t]);

  const resetViewport = useCallback(() => {
    if (!image || !stageSize.w || !stageSize.h) return;
    setViewport(fitImageViewport(image, stageSize.w, stageSize.h, comparisonImage));
  }, [comparisonImage, image, stageSize.h, stageSize.w]);

  const handlePointerDown = useCallback((event: React.PointerEvent<HTMLDivElement>) => {
    if (event.target instanceof HTMLElement && event.target.closest("[data-inpaint-control='true']")) return;
    if (!image || isBusy || event.button !== 0) return;

    const pointer = getPointer(event);
    const world = screenToWorld(pointer, viewport);
    const inside = pointInImage(world, image);

    if (tool === "pan") {
      pointerRef.current = { type: "pan", x: pointer.x, y: pointer.y };
      event.currentTarget.setPointerCapture(event.pointerId);
      return;
    }

    if (tool === "erase") {
      const hit = hitTestStroke(world, strokes);
      if (hit) {
        setStrokes((current) => current.filter((stroke) => stroke.id !== hit.id));
        setSelectedStrokeId((current) => (current === hit.id ? null : current));
      }
      pointerRef.current = { type: "erase", x: pointer.x, y: pointer.y };
      event.currentTarget.setPointerCapture(event.pointerId);
      return;
    }

    if (!inside) return;

    const defaults = nextStrokeDefaults();
    const draft: Stroke = {
      id: makeId("stroke"),
      imageId: image.id,
      color: defaults.color,
      label: defaults.label,
      width: brushWidth,
      points: [clampToImage(world, image)],
    };

    setDraftStroke(draft);
    pointerRef.current = { type: "draw", x: pointer.x, y: pointer.y };
    event.currentTarget.setPointerCapture(event.pointerId);
  }, [brushWidth, getPointer, image, isBusy, nextStrokeDefaults, strokes, tool, viewport]);

  const handlePointerMove = useCallback((event: React.PointerEvent<HTMLDivElement>) => {
    const drag = pointerRef.current;
    if (!drag.type || !image || isBusy) return;

    const pointer = getPointer(event);

    if (drag.type === "pan") {
      setViewport((current) => ({
        ...current,
        offsetX: current.offsetX + pointer.x - drag.x,
        offsetY: current.offsetY + pointer.y - drag.y,
      }));
      drag.x = pointer.x;
      drag.y = pointer.y;
      return;
    }

    const world = screenToWorld(pointer, viewport);

    if (drag.type === "erase") {
      const hit = hitTestStroke(world, strokes);
      if (hit) {
        setStrokes((current) => current.filter((stroke) => stroke.id !== hit.id));
        setSelectedStrokeId((current) => (current === hit.id ? null : current));
      }
      return;
    }

    setDraftStroke((current) => {
      if (!current) return current;

      const nextPoint = clampToImage(world, image);
      const last = current.points[current.points.length - 1];
      if (Math.hypot(nextPoint.x - last.x, nextPoint.y - last.y) < 1.5) return current;

      return { ...current, points: [...current.points, nextPoint] };
    });
  }, [getPointer, image, isBusy, strokes, viewport]);

  const commitDraftStroke = useCallback((event: React.PointerEvent<HTMLDivElement>, keepDraft: boolean) => {
    try {
      event.currentTarget.releasePointerCapture(event.pointerId);
    } catch {
      // Pointer capture may already be released by the browser.
    }

    if (keepDraft && draftStroke) {
      setStrokes((current) => [...current, draftStroke]);
      setSelectedStrokeId(draftStroke.id);
    }

    setDraftStroke(null);
    pointerRef.current = { type: null, x: 0, y: 0 };
  }, [draftStroke]);

  const handleWheel = useCallback((event: React.WheelEvent<HTMLDivElement>) => {
    if (event.target instanceof HTMLElement && event.target.closest("[data-inpaint-control='true']")) return;
    event.preventDefault();
    setViewport((current) => zoomAt(current, getPointer(event), current.scale * Math.exp(-event.deltaY * 0.0012)));
  }, [getPointer]);

  const undoStroke = useCallback(() => {
    setStrokes((current) => {
      const next = current.slice(0, -1);
      setSelectedStrokeId((selected) => (selected && !next.some((stroke) => stroke.id === selected) ? next.at(-1)?.id ?? null : selected));
      return next;
    });
  }, []);

  const clearStrokes = useCallback(() => {
    setStrokes([]);
    setDraftStroke(null);
    setSelectedStrokeId(null);
  }, []);

  const updateStrokeLabel = useCallback((strokeId: string, label: string) => {
    setStrokes((current) => current.map((stroke) => (stroke.id === strokeId ? { ...stroke, label } : stroke)));
  }, []);

  const removeStroke = useCallback((strokeId: string) => {
    setStrokes((current) => current.filter((stroke) => stroke.id !== strokeId));
    setSelectedStrokeId((current) => (current === strokeId ? null : current));
  }, []);

  const pollTask = useCallback(async (taskId: string): Promise<string> => {
    pollingAbortRef.current = false;

    for (let attempt = 0; attempt < MAX_POLL_ATTEMPTS; attempt++) {
      if (pollingAbortRef.current) throw new Error("polling_cancelled");

      await new Promise<void>((resolve) => {
        pollingTimerRef.current = setTimeout(resolve, POLL_INTERVAL_MS);
      });

      if (pollingAbortRef.current) throw new Error("polling_cancelled");

      const result = await imageGenerationClient.getTaskResult(taskId);
      if ("error" in result) {
        console.error("[ImageInpaintBoard] Polling failed", { taskId, error: result.error });
        continue;
      }

      if (result.status === "success") {
        const imageUrl = getFirstImageUrl(result.image_url);
        if (!imageUrl) throw new Error("generated_image_missing");
        return imageUrl;
      }

      if (result.status === "failed") {
        throw new Error(result.error_message || "generation_failed");
      }
    }

    throw new Error("polling_timeout");
  }, []);

  const handleConfirmImage = useCallback(async () => {
    if (!image || isBusy || strokes.length === 0) return;

    setStatus("uploading");
    setGeneratedUrl(null);

    try {
      console.info("[ImageInpaintBoard] Creating local repaint reference", {
        imageId: image.id,
        strokeCount: strokes.length,
        modelName: selectedModel,
        width: image.w,
        high: image.h,
      });

      const file = await exportMarkedImage(image, strokes);
      const uploadedUrl = await uploadImageToR2(file);
      const prompt = buildInpaintPrompt(strokes);
      const config = buildInpaintConfig(image, uploadedUrl, prompt);

      setStatus("generating");
      console.info("[ImageInpaintBoard] Submitting repaint generation task", {
        articleId,
        modelName: selectedModel,
        referenceSize: file.size,
        width: config.meta.width,
        high: config.meta.high,
      });

      const result = await imageGenerationClient.createGenerationTask({
        gen_mode: "creator",
        prompt,
        config,
        model_name: selectedModel,
        article_id: articleId ?? undefined,
        reference_images: [uploadedUrl],
      });

      if ("error" in result) {
        throw new Error(String(result.error));
      }

      onTaskSubmitted?.();
      const imageUrl = await pollTask(String(result.task_id));
      const loadedComparison = await loadImage(imageUrl);
      const nextComparison: BoardImage = {
        id: makeId("comparison"),
        src: imageUrl,
        safeSrc: getCanvasSafeSrc(imageUrl),
        w: Math.max(1, loadedComparison.naturalWidth),
        h: Math.max(1, loadedComparison.naturalHeight),
      };

      setComparisonImage(nextComparison);
      setGeneratedUrl(imageUrl);
      setStatus("success");
      window.requestAnimationFrame(() => {
        const rect = stageRef.current?.getBoundingClientRect();
        if (!rect) return;
        setViewport(fitImageViewport(image, rect.width, rect.height, nextComparison));
      });
      toast({ title: t("tiptapEditor.imageMenu.inpaintGenerated") });
    } catch (error) {
      const message = error instanceof Error ? error.message : "generation_failed";
      console.error("[ImageInpaintBoard] Repaint generation failed", { error: message });
      setStatus("error");
      toast({
        variant: "destructive",
        title: t("tiptapEditor.imageMenu.inpaintFailed"),
        description: message,
      });
    }
  }, [articleId, image, isBusy, onTaskSubmitted, pollTask, selectedModel, strokes, t, toast]);

  const handleInsertGenerated = useCallback(() => {
    if (!generatedUrl) return;
    const ok = onInsertImage?.(generatedUrl);
    if (!ok) {
      toast({
        variant: "destructive",
        title: t("tiptapEditor.imageMenu.inpaintInsertFailed"),
      });
      return;
    }
    toast({ title: t("tiptapEditor.imageMenu.inpaintInserted") });
  }, [generatedUrl, onInsertImage, t, toast]);

  const handleReplaceGenerated = useCallback(() => {
    if (!generatedUrl) return;
    const ok = onReplaceCurrentImage?.(generatedUrl);
    if (!ok) {
      toast({
        variant: "destructive",
        title: t("tiptapEditor.imageMenu.inpaintReplaceFailed"),
      });
      return;
    }
    toast({ title: t("tiptapEditor.imageMenu.inpaintReplaced") });
  }, [generatedUrl, onReplaceCurrentImage, t, toast]);

  const closeDialog = useCallback((nextOpen: boolean) => {
    if (!nextOpen) {
      pollingAbortRef.current = true;
      if (pollingTimerRef.current) clearTimeout(pollingTimerRef.current);
      pointerRef.current = { type: null, x: 0, y: 0 };
      setDraftStroke(null);
    }
    onOpenChange(nextOpen);
  }, [onOpenChange]);

  const toolButtons: Array<{ id: Tool; label: string; icon: React.ReactNode }> = [
    { id: "pan", label: t("tiptapEditor.imageMenu.inpaintPan"), icon: <HandIcon className="h-4 w-4" /> },
    { id: "draw", label: t("tiptapEditor.imageMenu.inpaintBrush"), icon: <PaintbrushIcon className="h-4 w-4" /> },
    { id: "erase", label: t("tiptapEditor.imageMenu.inpaintErase"), icon: <EraserIcon className="h-4 w-4" /> },
  ];

  return (
    <Dialog open={open} onOpenChange={closeDialog}>
      <DialogContent
        showCloseButton={false}
        className="flex h-[min(96svh,960px)] w-[min(98vw,1440px)] max-w-none grid-rows-none flex-col gap-0 overflow-hidden p-0 sm:max-w-none"
      >
        <DialogHeader className="border-b px-4 py-3">
          <div className="flex min-w-0 items-center justify-between gap-3">
            <div className="min-w-0">
              <DialogTitle className="truncate text-base">
                {t("tiptapEditor.imageMenu.inpaintTitle")}
              </DialogTitle>
              <DialogDescription className="mt-1 truncate">
                {status === "uploading"
                  ? t("tiptapEditor.imageMenu.inpaintUploading")
                  : status === "generating"
                    ? t("tiptapEditor.imageMenu.inpaintGenerating")
                    : status === "success"
                      ? t("tiptapEditor.imageMenu.inpaintReady")
                      : t("tiptapEditor.imageMenu.inpaintSubtitle")}
              </DialogDescription>
            </div>

            <div className="flex shrink-0 items-center gap-2">
              {generatedUrl ? (
                <>
                  <Button type="button" variant="outline" size="sm" onClick={handleReplaceGenerated}>
                    <ReplaceIcon className="h-4 w-4" />
                    {t("tiptapEditor.imageMenu.inpaintReplace")}
                  </Button>
                  <Button type="button" size="sm" onClick={handleInsertGenerated}>
                    <ImagePlusIcon className="h-4 w-4" />
                    {t("tiptapEditor.imageMenu.inpaintInsert")}
                  </Button>
                </>
              ) : null}
              <Button type="button" variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={() => closeDialog(false)}>
                <XIcon className="h-4 w-4" />
                <span className="sr-only">{t("common.close")}</span>
              </Button>
            </div>
          </div>
        </DialogHeader>

        <div className="flex min-h-0 flex-1">
          <aside className="flex w-[236px] shrink-0 flex-col gap-4 border-r bg-background p-3">
            <div className="space-y-2">
              <div className="text-xs font-medium text-muted-foreground">{t("tiptapEditor.imageMenu.inpaintModel")}</div>
              <Select value={selectedModel} onValueChange={setSelectedModel} disabled={isBusy}>
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {modelOptions.map((model) => (
                    <SelectItem key={model} value={model}>
                      {model}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {modelsLoading ? (
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <Loader2Icon className="h-3.5 w-3.5 animate-spin" />
                  {t("tiptapEditor.imageMenu.inpaintLoadingModels")}
                </div>
              ) : null}
            </div>

            <div className="space-y-2">
              <div className="text-xs font-medium text-muted-foreground">{t("tiptapEditor.imageMenu.inpaintTool")}</div>
              <div className="grid grid-cols-3 gap-1">
                {toolButtons.map((item) => (
                  <Tooltip key={item.id}>
                    <TooltipTrigger asChild>
                      <Button
                        type="button"
                        variant={tool === item.id ? "default" : "outline"}
                        size="sm"
                        className="h-9 w-full p-0"
                        disabled={isBusy}
                        onClick={() => setTool(item.id)}
                        aria-label={item.label}
                      >
                        {item.icon}
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>{item.label}</TooltipContent>
                  </Tooltip>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs font-medium text-muted-foreground">
                <span>{t("tiptapEditor.imageMenu.inpaintBrushSize")}</span>
                <span>{brushWidth}px</span>
              </div>
              <Slider
                value={[brushWidth]}
                min={8}
                max={96}
                step={1}
                disabled={isBusy}
                onValueChange={(value) => setBrushWidth(value[0] ?? brushWidth)}
              />
            </div>

            <div className="min-h-0 space-y-2">
              <div className="flex items-center justify-between text-xs font-medium text-muted-foreground">
                <span>{t("tiptapEditor.imageMenu.inpaintStrokeList")}</span>
                <span className="rounded-full bg-muted px-2 py-0.5">{strokes.length}</span>
              </div>
              <div className="max-h-[260px] space-y-2 overflow-y-auto pr-1">
                {strokes.length === 0 ? (
                  <div className="rounded-md border border-dashed px-3 py-2 text-xs text-muted-foreground">
                    {t("tiptapEditor.imageMenu.inpaintStrokeListEmpty")}
                  </div>
                ) : (
                  strokes.map((stroke) => (
                    <div
                      key={stroke.id}
                      className={cn(
                        "flex items-center gap-2 rounded-md border bg-background p-1.5",
                        selectedStrokeId === stroke.id ? "border-primary ring-2 ring-primary/15" : "border-border"
                      )}
                    >
                      <span
                        className="h-4 w-4 shrink-0 rounded-full border"
                        style={{ backgroundColor: stroke.color }}
                        aria-hidden="true"
                      />
                      <Input
                        value={stroke.label}
                        disabled={isBusy}
                        onFocus={(event) => {
                          setSelectedStrokeId(stroke.id);
                          event.currentTarget.select();
                        }}
                        onChange={(event) => updateStrokeLabel(stroke.id, event.target.value)}
                        className="h-8 min-w-0 px-2 text-sm"
                        aria-label={t("tiptapEditor.imageMenu.inpaintStrokeLabel")}
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="h-8 w-8 shrink-0 p-0 text-muted-foreground"
                        disabled={isBusy}
                        onClick={() => removeStroke(stroke.id)}
                        aria-label={t("tiptapEditor.imageMenu.inpaintRemoveStroke")}
                      >
                        <XIcon className="h-4 w-4" />
                      </Button>
                    </div>
                  ))
                )}
              </div>
            </div>

            <div className="mt-auto grid grid-cols-2 gap-2">
              <Button type="button" variant="outline" size="sm" disabled={isBusy || strokes.length === 0} onClick={undoStroke}>
                <Undo2Icon className="h-4 w-4" />
                {t("tiptapEditor.imageMenu.inpaintUndo")}
              </Button>
              <Button type="button" variant="outline" size="sm" disabled={isBusy || !image} onClick={resetViewport}>
                <RotateCcwIcon className="h-4 w-4" />
                {t("tiptapEditor.imageMenu.inpaintReset")}
              </Button>
              <Button type="button" variant="ghost" size="sm" className="col-span-2" disabled={isBusy || strokes.length === 0} onClick={clearStrokes}>
                {t("tiptapEditor.imageMenu.inpaintClear")}
              </Button>
            </div>
          </aside>

          <div
            ref={stageRef}
            className="relative min-w-0 flex-1 overflow-hidden bg-[#fafafa]"
            style={{
              cursor: tool === "pan" ? "grab" : tool === "erase" ? "cell" : "crosshair",
              backgroundImage:
                "linear-gradient(rgba(120,120,120,0.08) 1px, transparent 1px), linear-gradient(90deg, rgba(120,120,120,0.08) 1px, transparent 1px), linear-gradient(rgba(120,120,120,0.045) 1px, transparent 1px), linear-gradient(90deg, rgba(120,120,120,0.045) 1px, transparent 1px)",
              backgroundSize: "128px 128px, 128px 128px, 32px 32px, 32px 32px",
            }}
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={(event) => commitDraftStroke(event, true)}
            onPointerCancel={(event) => commitDraftStroke(event, false)}
            onWheel={handleWheel}
          >
            {status === "loading" ? (
              <div className="absolute inset-0 flex items-center justify-center text-sm text-muted-foreground">
                <Loader2Icon className="mr-2 h-4 w-4 animate-spin" />
                {t("tiptapEditor.imageMenu.inpaintLoadingImage")}
              </div>
            ) : null}

            {image && imageRect ? (
              <>
                <img
                  src={image.safeSrc}
                  alt=""
                  draggable={false}
                  className="pointer-events-none absolute select-none border border-primary/80 bg-white"
                  style={{
                    left: imageRect.left,
                    top: imageRect.top,
                    width: imageRect.width,
                    height: imageRect.height,
                  }}
                />

                {comparisonImage && comparisonRect ? (
                  <img
                    src={comparisonImage.safeSrc}
                    alt=""
                    draggable={false}
                    className="pointer-events-none absolute select-none border border-border bg-white"
                    style={{
                      left: comparisonRect.left,
                      top: comparisonRect.top,
                      width: comparisonRect.width,
                      height: comparisonRect.height,
                    }}
                  />
                ) : null}

                <svg className="pointer-events-none absolute inset-0 z-10 h-full w-full">
                  {visibleStrokes.map((stroke) => (
                    <path
                      key={stroke.id}
                      d={strokeToPath(stroke, viewport)}
                      fill="none"
                      stroke={stroke.color}
                      strokeWidth={Math.max(1, stroke.width * viewport.scale)}
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      opacity={STROKE_ALPHA}
                    />
                  ))}
                </svg>

                <div
                  data-inpaint-control="true"
                  className="pointer-events-none absolute z-20"
                  style={{
                    left: imageRect.left + imageRect.width - 56,
                    top: imageRect.top + imageRect.height - 56,
                  }}
                >
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        type="button"
                        size="sm"
                        className="pointer-events-auto h-11 w-11 rounded-full p-0 shadow-lg"
                        disabled={isBusy || strokes.length === 0}
                        onClick={() => void handleConfirmImage()}
                        aria-label={t("tiptapEditor.imageMenu.inpaintConfirm")}
                      >
                        {isBusy ? <Loader2Icon className="h-4 w-4 animate-spin" /> : <CheckIcon className="h-5 w-5" />}
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>{t("tiptapEditor.imageMenu.inpaintConfirm")}</TooltipContent>
                  </Tooltip>
                </div>
              </>
            ) : null}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
