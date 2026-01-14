"use client"

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger
} from "@/components/ui/tooltip"
import {
  Edit,
  Trash2,
  Globe,
  Languages,
  UploadCloud,
  ExternalLink,
  FileText,
  Image as ImageIcon,
  Link,
  Eye
} from "lucide-react"
import { Article } from "./article-types"
import { getStatusText, getStatusVariant, truncateText } from "./article-types"

interface ArticleTableProps {
  articles: Article[]
  onEditArticle: (article: Article) => void
  onDeleteArticle: (article: Article) => void
  onPublishArticle: (article: Article) => void
  onTranslateArticle: (article: Article) => void
  onPreviewContent: (article: Article) => void
  onViewImages: (article: Article) => void
  onViewLinks: (article: Article) => void
}

export function ArticleTable({
  articles,
  onEditArticle,
  onDeleteArticle,
  onPublishArticle,
  onTranslateArticle,
  onPreviewContent,
  onViewImages,
  onViewLinks
}: ArticleTableProps) {
  if (articles.length === 0) {
    return (
      <div className="text-center py-12">
        <FileText className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
        <h3 className="text-lg font-medium mb-2">暂无文章</h3>
        <p className="text-muted-foreground text-sm">
          还没有创建任何文章，去文章撰写页面开始创作吧！
        </p>
      </div>
    )
  }

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[200px]">文章标题</TableHead>
            <TableHead className="w-[300px]">文章内容</TableHead>
            <TableHead className="w-[120px]">文章图片</TableHead>
            <TableHead className="w-[150px]">引用链接</TableHead>
            <TableHead className="w-[120px]">创建时间</TableHead>
            <TableHead className="w-[120px]">修改时间</TableHead>
            <TableHead className="w-[200px] text-right">操作</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {articles.map((article) => (
            <TableRow key={article.id} className="hover:bg-muted/30">
              {/* 文章标题 */}
              <TableCell className="font-medium">
                <div className="space-y-1">
                  <div className="truncate" title={article.title}>
                    {article.title}
                  </div>
                  <Badge
                    variant={getStatusVariant(article.status)}
                    className="text-xs"
                  >
                    {getStatusText(article.status)}
                  </Badge>
                </div>
              </TableCell>

              {/* 文章内容 */}
              <TableCell>
                <Button
                  variant="ghost"
                  className="h-auto p-0 justify-start text-left hover:bg-transparent"
                  onClick={() => onPreviewContent(article)}
                >
                  <div className="max-w-[280px]">
                    <div className="flex items-center gap-1 mb-1">
                      <Eye className="w-3 h-3 text-muted-foreground" />
                      <span className="text-xs text-muted-foreground">点击查看详情</span>
                    </div>
                    <p className="text-sm line-clamp-2">
                      {article.summary || truncateText(article.content, 100)}
                    </p>
                  </div>
                </Button>
              </TableCell>

              {/* 文章图片 */}
              <TableCell>
                {article.images.length > 0 ? (
                  <Button
                    variant="ghost"
                    className="h-auto p-0 justify-start hover:bg-transparent"
                    onClick={() => onViewImages(article)}
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-1">
                        <ImageIcon className="w-3 h-3 text-muted-foreground" />
                        <span className="text-xs text-muted-foreground">
                          {article.images.length > 3 ? '查看全部' : '查看图片'}
                        </span>
                      </div>
                      <div className="flex gap-1">
                        {article.images.slice(0, 3).map((image, index) => (
                          <img
                            key={image.id}
                            src={image.url}
                            alt={image.alt}
                            className="w-8 h-8 rounded object-cover border"
                          />
                        ))}
                        {article.images.length > 3 && (
                          <div className="w-8 h-8 rounded bg-muted border flex items-center justify-center text-xs text-muted-foreground">
                            +{article.images.length - 3}
                          </div>
                        )}
                      </div>
                    </div>
                  </Button>
                ) : (
                  <span className="text-muted-foreground text-sm">无图片</span>
                )}
              </TableCell>

              {/* 引用链接 */}
              <TableCell>
                {article.referenceLinks.length > 0 ? (
                  <Button
                    variant="ghost"
                    className="h-auto p-0 justify-start text-left hover:bg-transparent"
                    onClick={() => onViewLinks(article)}
                  >
                    <div className="max-w-[130px] space-y-1">
                      <div className="flex items-center gap-1">
                        <Link className="w-3 h-3 text-muted-foreground" />
                        <span className="text-xs text-muted-foreground">
                          {article.referenceLinks.length} 个链接
                        </span>
                      </div>
                      <p className="text-sm truncate">
                        {article.referenceLinks[0].title}
                      </p>
                    </div>
                  </Button>
                ) : (
                  <span className="text-muted-foreground text-sm">无链接</span>
                )}
              </TableCell>

              {/* 创建时间 */}
              <TableCell className="text-sm">
                {article.createdAt.split(' ')[0]}
              </TableCell>

              {/* 修改时间 */}
              <TableCell className="text-sm">
                {article.modifiedAt.split(' ')[0]}
              </TableCell>

              {/* 操作按钮 */}
              <TableCell>
                <div className="flex items-center justify-end gap-1">
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => onEditArticle(article)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>编辑文章</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>

                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => onDeleteArticle(article)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>删除文章</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>

                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => onPublishArticle(article)}
                        >
                          <UploadCloud className="h-4 w-4" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>发布管理</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>

                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => onTranslateArticle(article)}
                        >
                          <Languages className="h-4 w-4" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>多语言翻译</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}