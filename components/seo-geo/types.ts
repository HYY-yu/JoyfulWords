export interface KeywordRecommendation {
  rank: number;
  keyword: string;
  msv: number; // 月搜索量
  difficulty: number; // 1-100
  rating: number; // 1-5 星星
  advantage: string;
  analysis: string;
}

export interface ChartData {
  name: string;
  value: number;
  [key: string]: any;
}

export interface SearchVolumeData {
  month: string;
  desktop: number;
  mobile: number;
}

export interface DifficultyDistribution {
  range: string;
  count: number;
  percentage: number;
}

export interface CompetitorData {
  name: string;
  visibility: number;
  keywords: number;
  traffic: number;
}

export interface KeywordAnalysis {
  keyword: string;
  report: string;
  analyzedAt: Date;
}