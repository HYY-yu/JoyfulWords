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
import type { TaskCenterArticleStatus } from "@/lib/api/taskcenter/types";
import { cn } from "@/lib/utils";

interface AIRewriteDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mode?: "create" | "task";
  articleId: number;
  selectedText: string;
  articleContent: string;
  onRewrite: (rewrittenText: string) => void;
  onTaskSubmitted?: (execId: string) => void;
  taskLoading?: boolean;
  taskStatus?: TaskCenterArticleStatus | null;
  taskError?: string | null;
  initialRewrittenText?: string;
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
  mode = "create",
  articleId,
  selectedText,
  articleContent,
  onRewrite,
  onTaskSubmitted,
  taskLoading = false,
  taskStatus = null,
  taskError = null,
  initialRewrittenText,
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

  const isTaskMode = mode === "task";
  const isWaiting = taskLoading || taskStatus === "pending" || taskStatus === "processing";
  const isTaskFailed = taskStatus === "failed";
  const isTaskSuccess = taskStatus === "success";

  // 使用无限滚动素材 Hook
  const {
    materials,
    isLoading: isLoadingMaterials,
    hasMore: hasMoreMaterials,
    reset: resetMaterials,
    observerTarget: materialsObserverTarget,
  } = useInfiniteMaterials({
    enabled: open && !isTaskMode && rewriteType === 'material',
    pageSize: 20,
  });

  // 弹窗打开时：重置表单、填充 initialRewrittenText
  useEffect(() => {
    if (open) {
      setCustomText("");
      materialsScrollPositionRef.current = 0;

      if (initialRewrittenText) {
        setRewrittenText(initialRewrittenText);
      } else {
        setRewrittenText("");
      }
    } else {
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
    if (isTaskMode) return true;
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

  // 异步提交：调用 edit API 拿到 exec_id，由任务中心接管后续生命周期
  const handleGenerate = async () => {
    if (isTaskMode) return;
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

      onTaskSubmitted?.(result.exec_id);

      toast({
        title: t("aiRewrite.toast.submitted"),
        description: t("aiRewrite.toast.submittedDesc"),
      });

      onOpenChange(false);
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
    const contentToApply = rewrittenText.trim();

    if (contentToApply) {
      onRewrite(contentToApply);
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
      contentClassName="h-[min(76vh,720px)] sm:h-[min(74vh,760px)]"
      footer={
        <>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
          >
            {t("aiRewrite.cancel")}
          </Button>
          <div className="flex gap-2">
            {!isTaskMode ? (
              <Button
                onClick={handleGenerate}
                disabled={isGenerateDisabled() || !selectedText.trim()}
                variant="secondary"
              >
                {isSubmitting ? (
                  <>
                    <Loader2Icon className="h-4 w-4 mr-2 animate-spin" />
                    {t("aiRewrite.submitting")}
                  </>
                ) : isWaiting ? (
                  <>
                    <ClockIcon className="h-4 w-4 mr-2" />
                    {t("aiRewrite.waiting")}
                  </>
                ) : (
                  <>
                    <SparklesIcon className="h-4 w-4 mr-2" />
                    {t("aiRewrite.generate")}
                  </>
                )}
              </Button>
            ) : null}
            {isTaskSuccess ? (
              <Button
                onClick={handleConfirm}
                disabled={!rewrittenText.trim()}
              >
                <CheckIcon className="h-4 w-4 mr-2" />
                {t("aiRewrite.confirmApply")}
              </Button>
            ) : null}
          </div>
        </>
      }
    >
      <div className="flex min-h-0 flex-1 flex-col px-5 py-3">
        <div className="flex min-h-0 flex-1 flex-col gap-3 overflow-hidden">
          {taskLoading ? (
            <div className="shrink-0 rounded-lg border border-border bg-muted/30 px-4 py-3">
              <div className="flex items-center gap-2">
                <Loader2Icon className="h-4 w-4 animate-spin text-muted-foreground shrink-0" />
                <p className="text-sm text-muted-foreground">
                  {t("contentWriting.taskCenter.detailLoading")}
                </p>
              </div>
            </div>
          ) : null}

          {isWaiting && (
            <div className="shrink-0 rounded-lg border border-blue-200 bg-blue-50 px-4 py-3 dark:border-blue-800 dark:bg-blue-950/30">
              <div className="flex items-center gap-2">
                <Loader2Icon className="h-4 w-4 animate-spin text-blue-500 shrink-0" />
                <p className="text-sm text-blue-700 dark:text-blue-300">
                  {isTaskMode
                    ? t("aiRewrite.waitingTaskHint")
                    : t("aiRewrite.waitingHint")}
                </p>
              </div>
            </div>
          )}

          {isTaskFailed ? (
            <div className="shrink-0 rounded-lg border border-red-200 bg-red-50 px-4 py-3 dark:border-red-900 dark:bg-red-950/30">
              <div className="flex items-start gap-2">
                <ClockIcon className="mt-0.5 h-4 w-4 shrink-0 text-red-500" />
                <div className="space-y-1">
                  <p className="text-sm font-medium text-red-700 dark:text-red-300">
                    {t("aiRewrite.failedTitle")}
                  </p>
                  <p className="text-sm text-red-700/80 dark:text-red-300/80">
                    {taskError || t("aiRewrite.failedHint")}
                  </p>
                </div>
              </div>
            </div>
          ) : null}

          {isTaskSuccess ? (
            <div className="shrink-0 rounded-lg border border-green-200 bg-green-50 px-4 py-3 dark:border-green-900 dark:bg-green-950/30">
              <p className="text-sm text-green-700 dark:text-green-300">
                {t("aiRewrite.resultReady")}
              </p>
            </div>
          ) : null}

          {/* 两个 Textarea 编辑区域 */}
          <div className="grid shrink-0 grid-cols-1 gap-3 xl:grid-cols-2">
            {/* 原始文本 */}
            <div className="flex flex-col">
              <Label className="mb-2">{t("aiRewrite.selectedText")}</Label>
              <div className="min-h-[96px] rounded-md border bg-muted/30 p-3 text-sm whitespace-pre-wrap lg:min-h-[112px]">
                {selectedText}
              </div>
            </div>

            {/* 改写后的文本 */}
            <div className="flex flex-col">
              <Label className="mb-2">
                {t("aiRewrite.rewrittenText")}
                {initialRewrittenText && (
                  <span className="ml-2 text-xs text-green-600 dark:text-green-400 font-normal">
                    ✓ {t("aiRewrite.resultReady")}
                  </span>
                )}
              </Label>
              <Textarea
                value={rewrittenText}
                onChange={(e) => setRewrittenText(e.target.value)}
                placeholder={
                  isWaiting
                    ? t("aiRewrite.waitingPlaceholder")
                    : t("aiRewrite.rewrittenTextPlaceholder")
                }
                className="min-h-[96px] resize-none lg:min-h-[112px]"
                disabled={isWaiting || isTaskFailed}
              />
            </div>
          </div>

          {/* 改写功能选择（三级菜单）*/}
          {!isTaskMode ? (
            <div className={`flex min-h-0 flex-1 flex-col gap-2 overflow-hidden ${isWaiting ? 'opacity-50 pointer-events-none' : ''}`}>
            {/* 一级菜单：改写类型 */}
            <div className="shrink-0">
              <Label className="mb-2 block">{t("aiRewrite.rewriteType")}</Label>
              <div className="grid grid-cols-1 gap-2 md:grid-cols-3">
                <button
                  type="button"
                  onClick={() => setRewriteType('material')}
                  className={`rounded-lg border-2 p-2.5 text-left transition-colors ${
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
                  className={`rounded-lg border-2 p-2.5 text-left transition-colors ${
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
                  className={`rounded-lg border-2 p-2.5 text-left transition-colors ${
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
              <div className="flex min-h-[120px] flex-1 items-center justify-center rounded-md border">
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
                      <div className="flex min-h-[120px] flex-1 items-center justify-center rounded-md border text-sm text-muted-foreground">
                        {t("aiRewrite.material.noMaterials")}
                      </div>
                    ) : (
                      <div
                        ref={materialsScrollRef}
                        onScroll={handleMaterialsScroll}
                        className="grid min-h-[132px] w-full flex-1 grid-cols-1 gap-2 overflow-y-auto rounded-md border p-2 md:grid-cols-2"
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
                    <div className="grid min-h-[132px] w-full flex-1 grid-cols-1 gap-2 overflow-y-auto rounded-md border p-2 md:grid-cols-2">
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
                    <div className="grid min-h-[132px] w-full flex-1 grid-cols-1 gap-2 overflow-y-auto rounded-md border p-2 md:grid-cols-2">
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
          ) : null}

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
