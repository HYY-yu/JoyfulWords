"use client";

import { useState, useEffect } from "react";
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
import { materialsClient } from "@/lib/api/materials/client";
import type {
  ArticleEditType,
  StyleType,
  StructType,
} from "@/lib/api/articles/types";
import type { Material } from "@/lib/api/materials/types";

interface AIRewriteDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  articleId: number;
  selectedText: string;
  articleContent: string;
  onRewrite: (rewrittenText: string) => void;
}

export function AIRewriteDialog({
  open,
  onOpenChange,
  articleId,
  selectedText,
  articleContent,
  onRewrite,
}: AIRewriteDialogProps) {
  const [isRewriting, setIsRewriting] = useState(false);
  const [rewrittenText, setRewrittenText] = useState("");
  const [rewriteType, setRewriteType] = useState<ArticleEditType>('style');

  // 素材扩充状态
  const [materials, setMaterials] = useState<Material[]>([]);
  const [selectedMaterialIds, setSelectedMaterialIds] = useState<number[]>([]);
  const [isLoadingMaterials, setIsLoadingMaterials] = useState(false);

  // 风格调整状态
  const [selectedStyle, setSelectedStyle] = useState<StyleType>('Professional');
  const [customText, setCustomText] = useState("");

  // 结构优化状态
  const [selectedStructType, setSelectedStructType] = useState<StructType>('De-Redundancy');

  const { toast } = useToast();
  const { t } = useTranslation();

  // 弹窗打开时加载素材列表
  useEffect(() => {
    if (open) {
      setRewrittenText("");
      setCustomText("");
      loadMaterials();
    }
  }, [open]);

  const loadMaterials = async () => {
    setIsLoadingMaterials(true);
    try {
      const result = await materialsClient.getMaterials({
        page: 1,
        page_size: 100,
      });

      if ("error" in result) {
        console.error('[AI Rewrite] Failed to load materials:', result.error);
        setMaterials([]);
        return;
      }

      setMaterials(result.list);
    } catch (error) {
      console.error('[AI Rewrite] Materials load error:', error);
      setMaterials([]);
    } finally {
      setIsLoadingMaterials(false);
    }
  };

  // 验证表单
  const isGenerateDisabled = () => {
    if (rewriteType === 'material') {
      return selectedMaterialIds.length === 0;
    }
    if (rewriteType === 'style' && selectedStyle === 'Custom') {
      return !customText.trim();
    }
    return false;
  };

  // 调用 AI 编辑 API
  const handleGenerate = async () => {
    if (!selectedText.trim() || isRewriting) return;

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

    setIsRewriting(true);

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

      if (result.response_text) {
        setRewrittenText(result.response_text);

        toast({
          title: t("aiRewrite.toast.generateSuccess"),
        });
      } else {
        throw new Error('Invalid response');
      }
    } catch (error) {
      console.error('[AI Rewrite] Error:', error);
      toast({
        variant: "destructive",
        title: t("aiRewrite.toast.generateFailed"),
        description: error instanceof Error ? error.message : t("aiRewrite.toast.retryError"),
      });
    } finally {
      setIsRewriting(false);
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
          {/* 两个 Textarea 编辑区域 */}
          <div className="grid grid-cols-2 gap-4">
            {/* 原始文本 */}
            <div className="flex flex-col">
              <Label className="mb-2">{t("aiRewrite.selectedText")}</Label>
              <div className="min-h-[150px] p-3 border rounded-md bg-muted/30 text-sm whitespace-pre-wrap">
                {selectedText}
              </div>
            </div>

            {/* 改写后的文本 */}
            <div className="flex flex-col">
              <Label className="mb-2">{t("aiRewrite.rewrittenText")}</Label>
              <Textarea
                value={rewrittenText}
                onChange={(e) => setRewrittenText(e.target.value)}
                placeholder={t("aiRewrite.rewrittenTextPlaceholder")}
                className="min-h-[150px] resize-none"
              />
            </div>
          </div>

          {/* 改写功能选择（三级菜单） */}
          <div className="space-y-3">
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
                    {materials.length === 0 ? (
                      <div className="text-center py-4 text-sm text-muted-foreground">
                        {t("aiRewrite.material.noMaterials")}
                      </div>
                    ) : (
                      <div className="grid grid-cols-2 gap-2 max-h-[180px] overflow-y-auto p-2 border rounded-md">
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
              onClick={() => onOpenChange(false)}
            >
              {t("aiRewrite.cancel")}
            </Button>
            <div className="flex gap-2">
              <Button
                onClick={handleGenerate}
                disabled={isRewriting || !selectedText.trim() || isGenerateDisabled()}
                variant="secondary"
              >
                {isRewriting ? (
                  <>
                    <Loader2Icon className="h-4 w-4 mr-2 animate-spin" />
                    {t("aiRewrite.generating")}
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
