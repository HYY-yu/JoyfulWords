"use client";

import { useState, useEffect, useRef } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "../base/dialog";
import { Button } from "../base/button";
import {
  SparklesIcon,
  Loader2Icon,
  CheckIcon,
  ClockIcon,
} from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../base/select";
import { Textarea } from "../base/textarea";
import { Input } from "../base/input";
import { Label } from "../base/label";
import { RadioGroup, RadioGroupItem } from "../base/radio-group";
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

  // 素材扩充状态
  const [selectedMaterialIds, setSelectedMaterialIds] = useState<number[]>([]);
  const [materialsScrollPosition, setMaterialsScrollPosition] = useState(0);
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
      setMaterialsScrollPosition(0);
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
    if (open && materialsScrollPosition > 0 && materialsScrollRef.current) {
      setTimeout(() => {
        if (materialsScrollRef.current) {
          materialsScrollRef.current.scrollTop = materialsScrollPosition;
        }
      }, 0);
    }
  }, [open]); // 只依赖 open，避免数据加载时频繁触发

  const handleMaterialsScroll = () => {
    if (materialsScrollRef.current) {
      setMaterialsScrollPosition(materialsScrollRef.current.scrollTop);
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
  const structOptions = [
    { value: 'De-Redundancy' as const, label: t("aiRewrite.struct.structures.De-Redundancy"), description: t("aiRewrite.struct.descriptions.De-Redundancy") },
    { value: 'Information-Layering' as const, label: t("aiRewrite.struct.structures.Information-Layering"), description: t("aiRewrite.struct.descriptions.Information-Layering") },
    { value: 'Point-Form' as const, label: t("aiRewrite.struct.structures.Point-Form"), description: t("aiRewrite.struct.descriptions.Point-Form") },
    { value: 'Short-Sentencing' as const, label: t("aiRewrite.struct.structures.Short-Sentencing"), description: t("aiRewrite.struct.descriptions.Short-Sentencing") },
    { value: 'Data-Highlighting' as const, label: t("aiRewrite.struct.structures.Data-Highlighting"), description: t("aiRewrite.struct.descriptions.Data-Highlighting") },
  ];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[900px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <SparklesIcon className="h-5 w-5 text-primary" />
            {t("aiRewrite.title")}
          </DialogTitle>
          <DialogDescription>
            {t("aiRewrite.description")}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* 等待中提示横条 */}
          {isWaiting && (
            <div className="flex items-center gap-2 px-4 py-3 rounded-lg bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800">
              <Loader2Icon className="h-4 w-4 animate-spin text-blue-500 shrink-0" />
              <p className="text-sm text-blue-700 dark:text-blue-300">
                {t("aiRewrite.waitingHint") || "AI 正在改写中，请稍候…改写完成后将自动弹出结果"}
              </p>
            </div>
          )}

          {/* 两个 Textarea 编辑区域 */}
          <div className="grid grid-cols-2 gap-4">
            {/* 原始文本 */}
            <div className="flex flex-col">
              <Label className="mb-2">{t("aiRewrite.selectedText")}</Label>
              <div className="min-h-[150px] p-3 border rounded-md bg-muted/30 text-sm whitespace-pre-wrap">
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
                className="min-h-[150px] resize-none"
                disabled={isWaiting}
              />
            </div>
          </div>

          {/* 改写功能选择（三级菜单）*/}
          <div className={`space-y-3 ${isWaiting ? 'opacity-50 pointer-events-none' : ''}`}>
            {/* 一级菜单：改写类型 */}
            <div>
              <Label className="mb-2 block">{t("aiRewrite.rewriteType")}</Label>
              <div className="grid grid-cols-3 gap-2">
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
            {isLoadingMaterials && rewriteType === 'material' ? (
              <div className="flex items-center justify-center py-4">
                <Loader2Icon className="h-5 w-5 animate-spin text-muted-foreground" />
                <span className="ml-2 text-sm text-muted-foreground">{t("aiRewrite.material.loadingMaterials")}</span>
              </div>
            ) : (
              <>
                {/* 素材扩充配置 */}
                {rewriteType === 'material' && (
                  <div className="space-y-2">
                    <Label>{t("aiRewrite.material.selectMaterials")}</Label>
                    {materials.length === 0 && !isLoadingMaterials ? (
                      <div className="text-center py-4 text-sm text-muted-foreground">
                        {t("aiRewrite.material.noMaterials")}
                      </div>
                    ) : (
                      <div
                        ref={materialsScrollRef}
                        onScroll={handleMaterialsScroll}
                        className="grid grid-cols-2 gap-2 max-h-[180px] overflow-y-auto p-2 border rounded-md"
                      >
                        {materials.map((material) => (
                          <label
                            key={material.id}
                            className={`flex items-center gap-2 p-2 rounded cursor-pointer transition-colors ${
                              selectedMaterialIds.includes(material.id)
                                ? "bg-primary/10 border border-primary/20"
                                : "hover:bg-muted/50"
                            }`}
                          >
                            <input
                              type="checkbox"
                              checked={selectedMaterialIds.includes(material.id)}
                              onChange={(e) => {
                                if (e.target.checked) {
                                  setSelectedMaterialIds([...selectedMaterialIds, material.id]);
                                } else {
                                  setSelectedMaterialIds(selectedMaterialIds.filter(id => id !== material.id));
                                }
                              }}
                              className="rounded"
                            />
                            <div className="flex-1 min-w-0">
                              <div className="text-sm font-medium truncate">{material.title}</div>
                              <div className="text-xs text-muted-foreground">
                                {t(`aiRewrite.material.typeLabels.${material.material_type}`)}
                              </div>
                            </div>
                          </label>
                        ))}
                        {/* 无限滚动 observer */}
                        {(hasMoreMaterials || isLoadingMaterials) && materials.length > 0 && (
                          <div ref={materialsObserverTarget} className="col-span-2 flex justify-center py-2">
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
                  <div className="space-y-3">
                    <div>
                      <Label className="mb-2 block">{t("aiRewrite.style.selectStyle")}</Label>
                      <Select value={selectedStyle} onValueChange={(value) => setSelectedStyle(value as StyleType)}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {(Object.keys(t("aiRewrite.style.styles")) as StyleType[]).map((style) => (
                            <SelectItem key={style} value={style}>
                              <div className="flex flex-col items-start">
                                <span className="font-medium">{t(`aiRewrite.style.styles.${style}`)}</span>
                                <span className="text-xs text-muted-foreground">{t(`aiRewrite.style.descriptions.${style}`)}</span>
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
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
                  <div className="space-y-2">
                    <Label>{t("aiRewrite.struct.selectStructure")}</Label>
                    <RadioGroup value={selectedStructType} onValueChange={(value) => setSelectedStructType(value as StructType)}>
                      {structOptions.map((option) => (
                        <div key={option.value} className="flex items-start space-x-2 p-2 rounded hover:bg-muted/50">
                          <RadioGroupItem value={option.value} id={option.value} />
                          <Label htmlFor={option.value} className="cursor-pointer flex-1">
                            <div className="font-medium text-sm">{option.label}</div>
                            <div className="text-xs text-muted-foreground">{option.description}</div>
                          </Label>
                        </div>
                      ))}
                    </RadioGroup>
                  </div>
                )}
              </>
            )}
          </div>

          {/* 操作按钮 */}
          <div className="flex justify-between items-center pt-2 border-t">
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
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
