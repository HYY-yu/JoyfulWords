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
import { useToast } from "@/hooks/use-toast";
import { API_BASE_URL } from "@/lib/config";

interface AIRewriteDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedText: string;
  articleContent: string;
  onRewrite: (rewrittenText: string) => void;
}

type RewriteAction = 'expand' | 'condense' | 'rephrase' | 'polish';
type StyleType = 'Professional' | 'Concise' | 'Friendly' | 'Colloquial' | 'Assertive' | 'Restrained' | 'Custom';

interface RewriteOption {
  value: RewriteAction;
  label: string;
  description: string;
}

interface StyleOption {
  value: StyleType;
  label: string;
  description: string;
}

export function AIRewriteDialog({
  open,
  onOpenChange,
  selectedText,
  articleContent,
  onRewrite,
}: AIRewriteDialogProps) {
  const [isRewriting, setIsRewriting] = useState(false);
  const [textContent, setTextContent] = useState("");
  const [rewrittenText, setRewrittenText] = useState("");
  const [selectedAction, setSelectedAction] = useState<RewriteAction>('expand');
  const [selectedStyle, setSelectedStyle] = useState<StyleType>('Professional');
  const [customText, setCustomText] = useState("");
  const { toast } = useToast();

  // 当对话框打开或 selectedText 改变时，更新 textContent 并清空改写结果
  useEffect(() => {
    if (open && selectedText) {
      setTextContent(selectedText);
      setRewrittenText("");
      setCustomText("");
    }
  }, [open, selectedText]);

  // 改写功能选项配置
  const rewriteOptions: RewriteOption[] = [
    {
      value: 'expand',
      label: '扩写',
      description: '让内容更详细丰富',
    },
    {
      value: 'condense',
      label: '缩写',
      description: '让内容更简洁精炼',
    },
    {
      value: 'rephrase',
      label: '改写',
      description: '换种说法表达相同意思',
    },
    {
      value: 'polish',
      label: '润色',
      description: '提升文采让表达更优雅',
    },
  ];

  // 风格选项配置
  const styleOptions: StyleOption[] = [
    {
      value: 'Professional',
      label: '更专业',
      description: '使用专业术语和严谨表达',
    },
    {
      value: 'Concise',
      label: '更简短',
      description: '精简内容，突出重点',
    },
    {
      value: 'Friendly',
      label: '更友好',
      description: '亲切自然的语气',
    },
    {
      value: 'Colloquial',
      label: '更口语化',
      description: '接近日常说话的方式',
    },
    {
      value: 'Assertive',
      label: '更强势',
      description: '自信有力的表达',
    },
    {
      value: 'Restrained',
      label: '更克制',
      description: '含蓄内敛的表达',
    },
    {
      value: 'Custom',
      label: '自定义',
      description: '输入自定义风格要求',
    },
  ];

  // 调用后端 AI 编辑 API
  const handleGenerate = async () => {
    if (!textContent.trim() || isRewriting) return;

    // 自定义风格时需要输入自定义文本
    if (selectedStyle === 'Custom' && !customText.trim()) {
      toast({
        variant: "destructive",
        title: "请输入自定义风格",
        description: "选择自定义风格时，需要填写风格要求",
      });
      return;
    }

    setIsRewriting(true);

    try {
      const accessToken = localStorage.getItem('access_token');

      const response = await fetch(`${API_BASE_URL}/article/edit`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(accessToken ? { 'Authorization': `Bearer ${accessToken}` } : {}),
        },
        body: JSON.stringify({
          article: articleContent,
          cut_text: textContent,
          type: 'style',
          data: {
            style_type: selectedStyle,
            custom_text: selectedStyle === 'Custom' ? customText : '',
          },
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'AI 编辑失败');
      }

      const result = await response.json();

      if (result.response_text) {
        setRewrittenText(result.response_text);

        toast({
          title: "生成成功",
          description: `已使用「${styleOptions.find(opt => opt.value === selectedStyle)?.label}」风格改写`,
        });
      } else {
        throw new Error('Invalid response');
      }
    } catch (error) {
      console.error('AI rewrite error:', error);
      toast({
        variant: "destructive",
        title: "生成失败",
        description: error instanceof Error ? error.message : "请稍后重试",
      });
    } finally {
      setIsRewriting(false);
    }
  };

  // 确认并应用到编辑器
  const handleConfirm = () => {
    // 优先应用改写后的内容，如果没有则应用原始内容
    const contentToApply = rewrittenText.trim() || textContent.trim();

    if (contentToApply) {
      onRewrite(contentToApply);
      onOpenChange(false);
      toast({
        title: "应用成功",
        description: "已将内容应用到编辑器",
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[900px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <SparklesIcon className="h-5 w-5 text-primary" />
            AI 智能改写
          </DialogTitle>
          <DialogDescription>
            选择改写方式，AI 将帮您优化内容
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* 两个 Textarea 编辑区域 */}
          <div className="grid grid-cols-2 gap-4">
            {/* 原始文本 */}
            <div className="flex flex-col">
              <label className="text-sm font-medium mb-2 block">
                选中的文本
              </label>
              <Textarea
                value={textContent}
                disabled
                placeholder="选中后的内容"
                className="h-[200px] min-h-[200px] resize-none"
                style={{ fieldSizing: 'fixed' }}
              />
            </div>

            {/* 改写后的文本 */}
            <div className="flex flex-col">
              <label className="text-sm font-medium mb-2 block">
                改写后的内容
              </label>
              <Textarea
                value={rewrittenText}
                onChange={(e) => setRewrittenText(e.target.value)}
                placeholder="生成结果将在此显示..."
                className="h-[200px] min-h-[200px] resize-none"
                style={{ fieldSizing: 'fixed' }}
              />
            </div>
          </div>

          {/* 下拉框和按钮区域 - 在 textarea 下方 */}
          <div className="flex items-end gap-3">
            {/* 改写功能选择 */}
            <div className="flex-1">
              <label className="text-sm font-medium mb-2 block">
                改写功能
              </label>
              <Select value={selectedAction} onValueChange={(value) => setSelectedAction(value as RewriteAction)}>
                <SelectTrigger>
                  <SelectValue>
                    {rewriteOptions.find(opt => opt.value === selectedAction)?.label}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {rewriteOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      <div className="flex flex-col items-start">
                        <span className="font-medium">{option.label}</span>
                        <span className="text-xs text-muted-foreground">{option.description}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* 风格选择 */}
            <div className="flex-1">
              <label className="text-sm font-medium mb-2 block">
                改写风格
              </label>
              <Select value={selectedStyle} onValueChange={(value) => setSelectedStyle(value as StyleType)}>
                <SelectTrigger>
                  <SelectValue>
                    {styleOptions.find(opt => opt.value === selectedStyle)?.label}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {styleOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      <div className="flex flex-col items-start">
                        <span className="font-medium">{option.label}</span>
                        <span className="text-xs text-muted-foreground">{option.description}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* 自定义风格输入 - 仅在选择 Custom 时显示 */}
            {selectedStyle === 'Custom' && (
              <div className="flex-1">
                <label className="text-sm font-medium mb-2 block">
                  自定义要求
                </label>
                <Input
                  value={customText}
                  onChange={(e) => setCustomText(e.target.value)}
                  placeholder="请输入自定义风格要求..."
                  maxLength={500}
                />
              </div>
            )}

            {/* 生成按钮 */}
            <Button
              onClick={handleGenerate}
              disabled={isRewriting || !textContent.trim() || (selectedStyle === 'Custom' && !customText.trim())}
              className="px-8"
              variant="secondary"
            >
              {isRewriting ? (
                <>
                  <Loader2Icon className="h-4 w-4 mr-2 animate-spin" />
                  生成中...
                </>
              ) : (
                <>
                  <SparklesIcon className="h-4 w-4 mr-2" />
                  生成
                </>
              )}
            </Button>
          </div>

          {/* 确认按钮 */}
          <div className="flex justify-end gap-2 pt-2 border-t">
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              取消
            </Button>
            <Button
              onClick={handleConfirm}
              disabled={!textContent.trim() && !rewrittenText.trim()}
            >
              <CheckIcon className="h-4 w-4 mr-2" />
              确认应用
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
