// 任务类型枚举
export enum TaskType {
  ARTICLE = 'article',
  IMAGE = 'image',
  MATERIAL = 'material',
  MINDMAP = 'mindmap'
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

// 思维导图任务详情接口
export interface MindMapTaskDetails extends TaskDetails {
  content: string;
  card_style: string;
  language: string;
  card_count: number;
  extra_requirements: string;
  card_url: string;
}

// 任务列表项接口
export interface TaskListItem {
  id: number;
  type: TaskType;
  status: string;
  created_at: string;
  cost: string;
  details: ArticleTaskDetails | ImageTaskDetails | MaterialTaskDetails | PostCrawlTaskDetails | MindMapTaskDetails;
}

// 文章任务详情响应接口
export interface ArticleTaskDetailResponse {
  log: {
    id: number;
    article_id: number;
    is_settle: boolean;
    exec_id: string;
    operate_type: string;
    cost: string;
    created_at: string;
    updated_at: string;
  };
  article: {
    id: number;
    title: string;
    content: string;
    status: string;
    category: string;
    tags: string[];
    created_at: string;
    updated_at: string;
  };
}

// 思维导图任务详情响应接口
export interface MindMapTaskDetailResponse {
  log: {
    id: number;
    content: string;
    card_style: string;
    language: string;
    card_count: number;
    extra_requirements: string;
    card_url: string;
    card_layout: string;
    status: string;
    created_at: string;
    updated_at: string;
  };
  details: {
    content: string;
    card_style: string;
    language: string;
    card_count: number;
    extra_requirements: string;
    card_url: string;
    card_layout: string;
    status: string;
  };
}

// 图片任务详情响应接口
export interface ImageTaskDetailResponse {
  id: number;
  user_id: number;
  prompt: string;
  model_name: string;
  image_urls: string[];
  status: string;
  is_settle: boolean;
  completed_at: string;
  created_at: string;
  updated_at: string;
}

// 任务详情响应接口
export type TaskDetailResponse = ArticleTaskDetailResponse | MindMapTaskDetailResponse | ImageTaskDetailResponse;
