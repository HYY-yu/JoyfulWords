// 任务类型枚举
export enum TaskType {
  ARTICLE = 'article',
  IMAGE = 'image',
  MATERIAL = 'material',
  POST_CRAWL = 'post_crawl'
}

// 任务状态枚举
export enum TaskStatus {
  // 文章任务状态
  CREATE = 'create',
  EDIT = 'edit',
  
  // 图片生成任务状态
  PENDING = 'pending',
  PROCESSING = 'processing',
  COMPLETED = 'completed',
  FAILED = 'failed',
  
  // 素材任务状态
  DOING = 'doing',
  DONE = 'done',
  
  // 社交帖子抓取任务状态
  EXECUTING = 'executing',
  QUERYING = 'querying'
}

// 任务详情基础接口
export interface TaskDetails {
  is_settle: boolean;
  cost: string;
  created_at: string;
  updated_at?: string;
}

// 文章任务详情接口
export interface ArticleTaskDetails extends TaskDetails {
  article_id: number;
  exec_id: string;
  operate_type: string;
}

// 图片生成任务详情接口
export interface ImageTaskDetails extends TaskDetails {
  user_id: number;
  gen_mode: string;
  config: string;
  prompt: string;
  referenced_material_ids: string;
  reference_image_urls: string;
  status: string;
  image_urls: string;
  model_name: string;
  model_reference_id: string;
  completed_at?: string;
}

// 素材任务详情接口
export interface MaterialTaskDetails extends TaskDetails {
  user_id: number;
  material_type: string;
  status: string;
  remark: string;
  query: string;
  exec_id: string;
  ai_result: string;
}

// 社交帖子抓取任务详情接口
export interface PostCrawlTaskDetails extends TaskDetails {
  user_id: number;
  snapshot_id: string;
  state: number;
  response: string;
}

// 任务列表项接口
export interface TaskListItem {
  id: number;
  type: TaskType;
  status: string;
  created_at: string;
  cost: string;
  details: ArticleTaskDetails | ImageTaskDetails | MaterialTaskDetails | PostCrawlTaskDetails;
}

// 任务详情响应接口
export type TaskDetailResponse = ArticleTaskDetails | ImageTaskDetails | MaterialTaskDetails | PostCrawlTaskDetails;
