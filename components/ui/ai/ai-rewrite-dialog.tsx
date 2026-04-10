"use client";

/* eslint-disable @next/next/no-img-element */

import { useState, useEffect, useRef, type ReactNode } from "react";
import { Button } from "../base/button";
import {
  SparklesIcon,
  Loader2Icon,
  CheckIcon,
  ClockIcon,
  CheckCircle2Icon,
} from "lucide-react";
import { AIFeatureDialogShell } from "@/components/ui/ai/ai-feature-dialog-shell";
import { Textarea } from "../base/textarea";
import { Input } from "../base/input";
import { Label } from "../base/label";
import { Dialog, DialogContent, DialogTitle } from "../base/dialog";
import { useToast } from "@/hooks/use-toast";
import { useTranslation } from "@/lib/i18n/i18n-context";
import { articlesClient } from "@/lib/api/articles/client";
import { useInfiniteMaterials } from "@/lib/hooks/use-infinite-materials";
import type {
  ArticleEditType,
  StyleType,
  StructType,
} from "@/lib/api/articles/types";
import type { Material } from "@/lib/api/materials/types";
import type { AIEditState } from "@/lib/hooks/use-ai-edit-state";
import { addAIEditTask } from "@/lib/hooks/use-ai-edit-state";
import { cn } from "@/lib/utils";

interface AIRewriteDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  articleId: number;
  selectedText: string;
  articleContent: string;
  onRewrite: (rewrittenText: string) => void;
  // 取消时恢复原始文本
  onCancel?: () => void;
  // 新任务提交成功后的回调
  onTaskSubmitted?: (task: AIEditState) => void;
  // 异步等待状态（由父组件从 localStorage 读取注入）
  waitingState?: AIEditState | null;
  // 当轮询成功后父组件传入结果文本，自动填充"改写后的内容"
  initialRewrittenText?: string;
  // 当前用户 ID，用于 localStorage key
  userId?: number | string;
}

const STYLE_TYPE_OPTIONS: StyleType[] = [
  "Professional",
  "Concise",
  "Friendly",
  "Colloquial",
  "Assertive",
  "Restrained",
  "Custom",
];

const STRUCT_TYPE_OPTIONS: StructType[] = [
  "De-Redundancy",
  "Information-Layering",
  "Point-Form",
  "Short-Sentencing",
  "Data-Highlighting",
];

function RewriteSelectionCard({
  title,
  description,
  selected,
  onClick,
  leading,
  meta,
}: {
  title: string;
  description?: string;
  selected: boolean;
  onClick: () => void;
  leading?: ReactNode;
  meta?: ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={selected}
      className={cn(
        "flex w-full items-start gap-3 rounded-lg border p-3 text-left transition-colors",
        selected
          ? "border-primary bg-primary/5 shadow-sm"
          : "border-border bg-background hover:bg-muted/50"
      )}
    >
      {leading ? <div className="shrink-0">{leading}</div> : null}
      <div className="min-w-0 flex-1">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="text-sm font-medium text-foreground">{title}</div>
            {description ? (
              <div className="mt-1 text-xs leading-5 text-muted-foreground">{description}</div>
            ) : null}
          </div>
          <div
            className={cn(
              "mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border",
              selected
                ? "border-primary bg-primary text-primary-foreground"
                : "border-muted-foreground/30 bg-background text-transparent"
            )}
            aria-hidden="true"
          >
            <CheckIcon className="h-3 w-3" />
          </div>
        </div>
        {meta ? (
          <div className="mt-2 text-xs text-muted-foreground">
            {meta}
          </div>
        ) : null}
      </div>
    </button>
  );
}

function MaterialSelectionCard({
  material,
  selected,
  onToggleSelected,
  onPreview,
  typeLabel,
}: {
  material: Material;
  selected: boolean;
  onToggleSelected: () => void;
  onPreview: () => void;
  typeLabel: string;
}) {
  const isImage = material.material_type === "image";

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={onPreview}
      onKeyDown={(event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          onPreview();
        }
      }}
      className={cn(
        "flex min-h-[124px] cursor-pointer items-start gap-3 rounded-lg border p-3 text-left transition-colors",
        selected
          ? "border-primary bg-primary/5 shadow-sm"
          : "border-border bg-background hover:bg-muted/50"
      )}
    >
      {isImage && material.content ? (
        <div className="h-14 w-14 shrink-0 overflow-hidden rounded border bg-muted/40">
          <img src={material.content} alt={material.title} className="h-full w-full object-cover" />
        </div>
      ) : (
        <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded border bg-muted/40">
          <CheckCircle2Icon className="h-5 w-5 text-muted-foreground" />
        </div>
      )}

      <div className="min-w-0 flex-1">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="text-sm font-medium text-foreground">{material.title}</div>
            <div className="mt-1 text-xs uppercase tracking-[0.18em] text-muted-foreground/70">
              {typeLabel}
            </div>
          </div>
          <button
            type="button"
            onClick={(event) => {
              event.stopPropagation();
              onToggleSelected();
            }}
            className={cn(
              "flex h-6 w-6 shrink-0 items-center justify-center rounded-full border transition-colors",
              selected
                ? "border-primary bg-primary text-primary-foreground"
                : "border-muted-foreground/30 bg-background text-transparent hover:border-primary/40"
            )}
            aria-pressed={selected}
          >
            <CheckIcon className="h-3.5 w-3.5" />
          </button>
        </div>

        {!isImage && material.content ? (
          <div className="mt-2 line-clamp-3 text-xs leading-5 text-muted-foreground">
            {material.content}
          </div>
        ) : null}
      </div>
    </div>
  );
}

export function AIRewriteDialog({
  open,
  onOpenChange,
  articleId,
  selectedText,
  articleContent,
  onRewrite,
  onCancel,
  onTaskSubmitted,
  waitingState,
  initialRewrittenText,
  userId,
}: AIRewriteDialogProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [rewrittenText, setRewrittenText] = useState("");
  const [rewriteType, setRewriteType] = useState<ArticleEditType>('style');
  const [previewMaterial, setPreviewMaterial] = useState<Material | null>(null);

  // 素材扩充状态
  const [selectedMaterialIds, setSelectedMaterialIds] = useState<number[]>([]);
  const materialsScrollPositionRef = useRef(0);
  const materialsScrollRef = useRef<HTMLDivElement>(null);

  // 风格调整状态
  const [selectedStyle, setSelectedStyle] = useState<StyleType>('Professional');
  const [customText, setCustomText] = useState("");

  // 结构优化状态
  const [selectedStructType, setSelectedStructType] = useState<StructType>('De-Redundancy');

  const { toast } = useToast();
  const { t } = useTranslation();

  const isWaiting = waitingState?.status === 'waiting';

  // 使用无限滚动素材 Hook
  const {
    materials,
    isLoading: isLoadingMaterials,
    hasMore: hasMoreMaterials,
    loadMore: loadMoreMaterials,
    reset: resetMaterials,
    observerTarget: materialsObserverTarget,
  } = useInfiniteMaterials({
    enabled: open && rewriteType === 'material',
    pageSize: 20,
  });

  // 弹窗打开时：重置表单、填充 initialRewrittenText
  useEffect(() => {
    console.log('[AI Rewrite Dialog] useEffect triggered', {
      open,
      initialRewrittenText,
      waitingState
    })

    if (open) {
      setCustomText("");
      materialsScrollPositionRef.current = 0;
      // 自动填充轮询结果（result arrives 时父组件重新打开此 dialog）
      if (initialRewrittenText) {
        console.log('[AI Rewrite Dialog] Setting rewrittenText from initialRewrittenText:', initialRewrittenText)
        setRewrittenText(initialRewrittenText);
      } else {
        console.log('[AI Rewrite Dialog] No initialRewrittenText, clearing rewrittenText')
        setRewrittenText("");
      }
    } else {
      // 对话框关闭时清理素材状态
      resetMaterials();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, initialRewrittenText]);

  // 保持素材列表滚动位置（只在对话框打开时恢复）
  useEffect(() => {
    if (open && materialsScrollPositionRef.current > 0 && materialsScrollRef.current) {
      setTimeout(() => {
        if (materialsScrollRef.current) {
          materialsScrollRef.current.scrollTop = materialsScrollPositionRef.current;
        }
      }, 0);
    }
  }, [open]); // 只依赖 open，避免数据加载时频繁触发

  const handleMaterialsScroll = () => {
    if (materialsScrollRef.current) {
      materialsScrollPositionRef.current = materialsScrollRef.current.scrollTop;
    }
  };

  // 验证表单
  const isGenerateDisabled = (): boolean => {
    if (isWaiting) return true;  // 等待中禁止再次提交
    if (isSubmitting) return true;
    if (rewriteType === 'material') {
      return selectedMaterialIds.length === 0;
    }
    if (rewriteType === 'style' && selectedStyle === 'Custom') {
      return !customText.trim();
    }
    return false;
  };

  // 异步提交：调用 edit API 拿到 exec_id，存储到 localStorage 后关闭对话框
  const handleGenerate = async () => {
    if (!selectedText.trim() || isSubmitting || isWaiting) return;

    // 验证逻辑
    if (rewriteType === 'material' && selectedMaterialIds.length === 0) {
      toast({
        variant: "destructive",
        title: t("aiRewrite.toast.materialRequired"),
        description: t("aiRewrite.toast.materialRequiredDesc"),
      });
      return;
    }

    if (rewriteType === 'style' && selectedStyle === 'Custom' && !customText.trim()) {
      toast({
        variant: "destructive",
        title: t("aiRewrite.toast.customStyleRequired"),
        description: t("aiRewrite.toast.customStyleRequiredDesc"),
      });
      return;
    }

    setIsSubmitting(true);

    try {
      // 构建请求体
      const requestBody = {
        article_id: Number(articleId),
        article: articleContent,
        cut_text: selectedText,
        type: rewriteType,
        data: {} as any,
      };

      // 根据 type 设置 data
      if (rewriteType === 'material') {
        requestBody.data = { material_ids: selectedMaterialIds };
      } else if (rewriteType === 'style') {
        requestBody.data = {
          style_type: selectedStyle,
          custom_text: selectedStyle === 'Custom' ? customText : '',
        };
      } else if (rewriteType === 'struct') {
        requestBody.data = { struct_type: selectedStructType };
      }

      const result = await articlesClient.editArticle(requestBody);

      if ("error" in result) {
        throw new Error(result.error);
      }

      // 异步任务提交成功：保存状态到 localStorage
      const newState: AIEditState = {
        status: 'waiting',
        exec_id: result.exec_id,
        article_id: Number(articleId),
        cut_text: selectedText,
        started_at: Date.now(),
      };

      if (userId !== undefined) {
        addAIEditTask(userId, newState);
      }

      // 通知父组件添加任务到 aiEditTasks（为了轮询）
      onTaskSubmitted?.(newState);

      toast({
        title: t("aiRewrite.toast.submitted") || "AI 改写任务已提交",
        description: t("aiRewrite.toast.submittedDesc") || "改写完成后会自动弹出通知",
      });

      // 关闭对话框
      onOpenChange(false);

      // 触发自定义事件，通知 TiptapEditor 立即插入 AIPendingBlock
      // 这样不依赖父组件的状态更新，避免 React 异步状态问题
      setTimeout(() => {
        const event = new CustomEvent('ai-edit-task-submitted', {
          detail: { execId: result.exec_id, cutText: selectedText },
          bubbles: true,
        });
        window.dispatchEvent(event);
      }, 100);
    } catch (error) {
      console.error('[AI Rewrite] Error:', error);
      toast({
        variant: "destructive",
        title: t("aiRewrite.toast.generateFailed"),
        description: error instanceof Error ? error.message : t("aiRewrite.toast.retryError"),
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // 确认并应用到编辑器
  const handleConfirm = () => {
    const contentToApply = rewrittenText.trim() || selectedText.trim();

    if (contentToApply) {
      onRewrite(contentToApply);
      onOpenChange(false);
      toast({
        title: t("aiRewrite.toast.contentApplied"),
      });
    }
  };

  // 结构优化选项
  const structOptions = STRUCT_TYPE_OPTIONS.map((value) => ({
    value,
    label: t(`aiRewrite.struct.structures.${value}`),
    description: t(`aiRewrite.struct.descriptions.${value}`),
  }));

  return (
    <AIFeatureDialogShell
      open={open}
      onOpenChange={onOpenChange}
      title={t("aiRewrite.title")}
      description={t("aiRewrite.description")}
      size="compact"
      footer={
        <>
          <Button
            variant="outline"
            onClick={() => {
              // 如果有 waitingState，说明是查看已完成的结果，点击 Cancel 恢复原始文本
              if (waitingState && waitingState.status === 'idle') {
                onCancel?.()
              }
              // 否则只是普通的取消，关闭对话框
              onOpenChange(false)
            }}
          >
            {waitingState && waitingState.status === 'idle'
              ? (t("aiRewrite.restoreOriginal") || "恢复原文")
              : t("aiRewrite.cancel")}
          </Button>
          <div className="flex gap-2">
            <Button
              onClick={handleGenerate}
              disabled={isGenerateDisabled() || !selectedText.trim()}
              variant="secondary"
            >
              {isSubmitting ? (
                <>
                  <Loader2Icon className="h-4 w-4 mr-2 animate-spin" />
                  {t("aiRewrite.submitting") || "提交中…"}
                </>
              ) : isWaiting ? (
                <>
                  <ClockIcon className="h-4 w-4 mr-2" />
                  {t("aiRewrite.waiting") || "改写中…"}
                </>
              ) : (
                <>
                  <SparklesIcon className="h-4 w-4 mr-2" />
                  {t("aiRewrite.generate")}
                </>
              )}
            </Button>
            <Button
              onClick={handleConfirm}
              disabled={!rewrittenText.trim()}
            >
              <CheckIcon className="h-4 w-4 mr-2" />
              {t("aiRewrite.confirmApply")}
            </Button>
          </div>
        </>
      }
    >
      <div className="flex min-h-0 flex-1 flex-col px-6 py-4">
        <div className="flex min-h-0 flex-1 flex-col gap-4 overflow-hidden">
          {/* 等待中提示横条 */}
          {isWaiting && (
            <div className="shrink-0 rounded-lg border border-blue-200 bg-blue-50 px-4 py-3 dark:border-blue-800 dark:bg-blue-950/30">
              <div className="flex items-center gap-2">
              <Loader2Icon className="h-4 w-4 animate-spin text-blue-500 shrink-0" />
              <p className="text-sm text-blue-700 dark:text-blue-300">
                {t("aiRewrite.waitingHint") || "AI 正在改写中，请稍候…改写完成后将自动弹出结果"}
              </p>
              </div>
            </div>
          )}

          {/* 两个 Textarea 编辑区域 */}
          <div className="grid shrink-0 grid-cols-1 gap-4 xl:grid-cols-2">
            {/* 原始文本 */}
            <div className="flex flex-col">
              <Label className="mb-2">{t("aiRewrite.selectedText")}</Label>
              <div className="min-h-[180px] rounded-md border bg-muted/30 p-3 text-sm whitespace-pre-wrap lg:min-h-[220px]">
                {/* 优先显示 waitingState 的 cut_text，否则用当前 selectedText */}
                {isWaiting ? waitingState!.cut_text : selectedText}
              </div>
            </div>

            {/* 改写后的文本 */}
            <div className="flex flex-col">
              <Label className="mb-2">
                {t("aiRewrite.rewrittenText")}
                {initialRewrittenText && (
                  <span className="ml-2 text-xs text-green-600 dark:text-green-400 font-normal">
                    ✓ {t("aiRewrite.resultReady") || "AI 改写完成"}
                  </span>
                )}
              </Label>
              <Textarea
                value={rewrittenText}
                onChange={(e) => setRewrittenText(e.target.value)}
                placeholder={
                  isWaiting
                    ? (t("aiRewrite.waitingPlaceholder") || "AI 改写完成后将自动显示…")
                    : t("aiRewrite.rewrittenTextPlaceholder")
                }
                className="min-h-[180px] resize-none lg:min-h-[220px]"
                disabled={isWaiting}
              />
            </div>
          </div>

          {/* 改写功能选择（三级菜单）*/}
          <div className={`flex min-h-0 flex-1 flex-col gap-3 overflow-hidden ${isWaiting ? 'opacity-50 pointer-events-none' : ''}`}>
            {/* 一级菜单：改写类型 */}
            <div className="shrink-0">
              <Label className="mb-2 block">{t("aiRewrite.rewriteType")}</Label>
              <div className="grid grid-cols-1 gap-2 md:grid-cols-3">
                <button
                  type="button"
                  onClick={() => setRewriteType('material')}
                  className={`p-3 text-left rounded-lg border-2 transition-colors ${
                    rewriteType === 'material'
                      ? "border-primary bg-primary/5"
                      : "border-border hover:bg-muted"
                  }`}
                >
                  <div className="font-medium text-sm">{t("aiRewrite.types.material")}</div>
                </button>
                <button
                  type="button"
                  onClick={() => setRewriteType('style')}
                  className={`p-3 text-left rounded-lg border-2 transition-colors ${
                    rewriteType === 'style'
                      ? "border-primary bg-primary/5"
                      : "border-border hover:bg-muted"
                  }`}
                >
                  <div className="font-medium text-sm">{t("aiRewrite.types.style")}</div>
                </button>
                <button
                  type="button"
                  onClick={() => setRewriteType('struct')}
                  className={`p-3 text-left rounded-lg border-2 transition-colors ${
                    rewriteType === 'struct'
                      ? "border-primary bg-primary/5"
                      : "border-border hover:bg-muted"
                  }`}
                >
                  <div className="font-medium text-sm">{t("aiRewrite.types.struct")}</div>
                </button>
              </div>
            </div>

            {/* 二级菜单：根据类型动态渲染 */}
            {isLoadingMaterials && materials.length === 0 && rewriteType === 'material' ? (
              <div className="flex min-h-[240px] flex-1 items-center justify-center rounded-md border">
                <Loader2Icon className="h-5 w-5 animate-spin text-muted-foreground" />
                <span className="ml-2 text-sm text-muted-foreground">{t("aiRewrite.material.loadingMaterials")}</span>
              </div>
            ) : (
              <>
                {/* 素材扩充配置 */}
                {rewriteType === 'material' && (
                  <div className="flex min-h-0 flex-1 flex-col gap-2 overflow-hidden">
                    <Label>{t("aiRewrite.material.selectMaterials")}</Label>
                    {materials.length === 0 && !isLoadingMaterials ? (
                      <div className="flex min-h-[240px] flex-1 items-center justify-center rounded-md border text-sm text-muted-foreground">
                        {t("aiRewrite.material.noMaterials")}
                      </div>
                    ) : (
                      <div
                        ref={materialsScrollRef}
                        onScroll={handleMaterialsScroll}
                        className="grid min-h-[260px] w-full flex-1 grid-cols-1 gap-2 overflow-y-auto rounded-md border p-2 md:grid-cols-2"
                      >
                        {materials.map((material) => (
                          <MaterialSelectionCard
                            key={material.id}
                            material={material}
                            selected={selectedMaterialIds.includes(material.id)}
                            onToggleSelected={() => {
                              if (selectedMaterialIds.includes(material.id)) {
                                setSelectedMaterialIds(selectedMaterialIds.filter((id) => id !== material.id));
                                return;
                              }
                              setSelectedMaterialIds([...selectedMaterialIds, material.id]);
                            }}
                            onPreview={() => setPreviewMaterial(material)}
                            typeLabel={t(`aiRewrite.material.typeLabels.${material.material_type}`)}
                          />
                        ))}
                        {/* 无限滚动 observer */}
                        {(hasMoreMaterials || isLoadingMaterials) && materials.length > 0 && (
                          <div ref={materialsObserverTarget} className="flex justify-center py-2 md:col-span-2">
                            <Loader2Icon className="h-4 w-4 animate-spin text-muted-foreground" />
                          </div>
                        )}
                      </div>
                    )}
                    {selectedMaterialIds.length > 0 && (
                      <div className="text-xs text-muted-foreground">
                        {t("aiRewrite.material.selectedCount", { count: selectedMaterialIds.length })}
                      </div>
                    )}
                  </div>
                )}

                {/* 风格调整配置 */}
                {rewriteType === 'style' && (
                  <div className="flex min-h-0 flex-1 flex-col gap-2 overflow-hidden">
                    <Label>{t("aiRewrite.style.selectStyle")}</Label>
                    <div className="grid min-h-[260px] w-full flex-1 grid-cols-1 gap-2 overflow-y-auto rounded-md border p-2 md:grid-cols-2">
                      {STYLE_TYPE_OPTIONS.map((style) => (
                        <RewriteSelectionCard
                          key={style}
                          title={t(`aiRewrite.style.styles.${style}`)}
                          description={t(`aiRewrite.style.descriptions.${style}`)}
                          selected={selectedStyle === style}
                          onClick={() => setSelectedStyle(style)}
                        />
                      ))}
                    </div>
                    {selectedStyle === 'Custom' && (
                      <div>
                        <Label className="mb-2 block">{t("aiRewrite.style.customRequirement")}</Label>
                        <Input
                          value={customText}
                          onChange={(e) => setCustomText(e.target.value)}
                          placeholder={t("aiRewrite.style.customPlaceholder")}
                          maxLength={500}
                        />
                        <div className="text-xs text-muted-foreground mt-1">
                          {customText.length}/500
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* 结构优化配置 */}
                {rewriteType === 'struct' && (
                  <div className="flex min-h-0 flex-1 flex-col gap-2 overflow-hidden">
                    <Label>{t("aiRewrite.struct.selectStructure")}</Label>
                    <div className="grid min-h-[260px] w-full flex-1 grid-cols-1 gap-2 overflow-y-auto rounded-md border p-2 md:grid-cols-2">
                      {structOptions.map((option) => (
                        <RewriteSelectionCard
                          key={option.value}
                          title={option.label}
                          description={option.description}
                          selected={selectedStructType === option.value}
                          onClick={() => setSelectedStructType(option.value)}
                        />
                      ))}
                    </div>
                  </div>
                )}
              </>
            )}
          </div>

        </div>
      </div>

      <Dialog open={previewMaterial !== null} onOpenChange={(open) => !open && setPreviewMaterial(null)}>
        {previewMaterial?.material_type === "image" && previewMaterial.content ? (
          <DialogContent className="max-w-[min(96vw,1400px)] border-none bg-transparent p-2 shadow-none [&>button]:hidden">
            <DialogTitle className="sr-only">{previewMaterial.title}</DialogTitle>
            <div className="flex max-h-[90vh] flex-col gap-3">
              <div className="overflow-hidden rounded-lg bg-black/90 p-2">
                <img
                  src={previewMaterial.content}
                  alt={previewMaterial.title}
                  className="max-h-[78vh] w-full rounded object-contain"
                />
              </div>
              <div className="rounded-lg bg-background/95 px-4 py-3 backdrop-blur">
                <div className="text-sm font-medium text-foreground">{previewMaterial.title}</div>
              </div>
            </div>
          </DialogContent>
        ) : previewMaterial ? (
          <DialogContent className="flex max-h-[85vh] max-w-[min(92vw,1100px)] flex-col overflow-hidden">
            <DialogTitle>{previewMaterial.title}</DialogTitle>
            <div className="mt-2 flex min-h-0 flex-1 flex-col gap-4 overflow-hidden">
              <div className="rounded-md border bg-muted/30 px-3 py-2 text-xs uppercase tracking-[0.18em] text-muted-foreground">
                {t(`aiRewrite.material.typeLabels.${previewMaterial.material_type}`)}
              </div>
              <div className="min-h-0 flex-1 overflow-y-auto rounded-md border p-4">
                <div className="whitespace-pre-wrap text-sm leading-6 text-foreground">
                  {previewMaterial.content}
                </div>
              </div>
              {previewMaterial.source_url ? (
                <div className="shrink-0 rounded-md border bg-muted/20 p-3">
                  <div className="mb-1 text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground">
                    {t("contentWriting.materialPanel.viewSource")}
                  </div>
                  <a
                    href={previewMaterial.source_url}
                    target="_blank"
                    rel="noreferrer"
                    className="break-all text-sm text-primary underline-offset-4 hover:underline"
                  >
                    {previewMaterial.source_url}
                  </a>
                </div>
              ) : null}
            </div>
          </DialogContent>
        ) : null}
      </Dialog>
    </AIFeatureDialogShell>
  );
}
