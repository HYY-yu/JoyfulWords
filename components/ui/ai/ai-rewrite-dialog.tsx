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
import { useToast } from "@/hooks/use-toast";

interface AIRewriteDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedText: string;
  onRewrite: (rewrittenText: string) => void;
}

type RewriteAction = 'expand' | 'condense' | 'rephrase' | 'polish';
type AIModel = 'gpt-4' | 'gpt-3.5' | 'claude-3' | 'gemini-pro';

interface RewriteOption {
  value: RewriteAction;
  label: string;
  description: string;
}

interface ModelOption {
  value: AIModel;
  label: string;
  description: string;
}

export function AIRewriteDialog({
  open,
  onOpenChange,
  selectedText,
  onRewrite,
}: AIRewriteDialogProps) {
  const [isRewriting, setIsRewriting] = useState(false);
  const [textContent, setTextContent] = useState("");
  const [selectedAction, setSelectedAction] = useState<RewriteAction>('expand');
  const [selectedModel, setSelectedModel] = useState<AIModel>('gpt-4');
  const { toast } = useToast();

  // 当对话框打开或 selectedText 改变时，更新 textContent
  useEffect(() => {
    if (open && selectedText) {
      setTextContent(selectedText);
    }
  }, [open, selectedText]);

  // 改写选项配置
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

  // 模型选项配置
  const modelOptions: ModelOption[] = [
    {
      value: 'gpt-4',
      label: 'GPT-4',
      description: '最强大的模型',
    },
    {
      value: 'gpt-3.5',
      label: 'GPT-3.5',
      description: '快速且经济',
    },
    {
      value: 'claude-3',
      label: 'Claude 3',
      description: '长文本处理',
    },
    {
      value: 'gemini-pro',
      label: 'Gemini Pro',
      description: '谷歌最新模型',
    },
  ];

  // 调用 AI 改写 API
  const handleGenerate = async () => {
    if (!textContent.trim() || isRewriting) return;

    setIsRewriting(true);

    try {
      const response = await fetch('/api/ai/rewrite', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          text: textContent,
          action: selectedAction,
          model: selectedModel,
        }),
      });

      if (!response.ok) {
        throw new Error('AI rewrite failed');
      }

      const result = await response.json();

      if (result.success && result.data.rewritten) {
        // 直接将生成结果替换到 textarea 中
        setTextContent(result.data.rewritten);

        toast({
          title: "生成成功",
          description: `已使用 ${rewriteOptions.find(opt => opt.value === selectedAction)?.label} 功能`,
        });
      } else {
        throw new Error('Invalid response');
      }
    } catch (error) {
      console.error('AI rewrite error:', error);
      toast({
        variant: "destructive",
        title: "生成失败",
        description: "请稍后重试",
      });
    } finally {
      setIsRewriting(false);
    }
  };

  // 确认并应用到编辑器
  const handleConfirm = () => {
    if (textContent.trim()) {
      onRewrite(textContent);
      onOpenChange(false);
      toast({
        title: "应用成功",
        description: "已将内容应用到编辑器",
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[700px]">
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
          {/* Textarea 编辑区域 */}
          <div>
            <label className="text-sm font-medium mb-2 block">
              选中的文本（可编辑）
            </label>
            <Textarea
              value={textContent}
              onChange={(e) => setTextContent(e.target.value)}
              placeholder="输入或编辑要改写的文本..."
              className="min-h-[200px] resize-none"
            />
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
                  <SelectValue />
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

            {/* AI 模型选择 */}
            <div className="flex-1">
              <label className="text-sm font-medium mb-2 block">
                AI 模型
              </label>
              <Select value={selectedModel} onValueChange={(value) => setSelectedModel(value as AIModel)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {modelOptions.map((option) => (
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

            {/* 生成按钮 */}
            <Button
              onClick={handleGenerate}
              disabled={isRewriting || !textContent.trim()}
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
              disabled={!textContent.trim()}
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
