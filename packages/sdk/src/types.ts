// API レスポンスの基本型
export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

// ページネーション型
export interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

// ユーザー関連型
export interface User {
  id: string;
  email: string;
  theme: 'SYSTEM' | 'LIGHT' | 'DARK';
  language: 'JA' | 'EN';
  createdAt: string;
  updatedAt: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  user: User;
  token: string;
}

export interface ForgotPasswordRequest {
  email: string;
}

export interface ResetPasswordRequest {
  token: string;
  newPassword: string;
}

export interface ChangePasswordRequest {
  currentPassword: string;
  newPassword: string;
}

export interface ChangeEmailRequest {
  newEmail: string;
  password: string;
}

export interface UpdateSettingsRequest {
  theme?: 'SYSTEM' | 'LIGHT' | 'DARK';
  language?: 'JA' | 'EN';
}

// フィード関連型
export interface Feed {
  id: string;
  title: string;
  url: string;
  siteUrl?: string;
  description?: string;
  favicon?: string;
  userId: string;
  lastFetchedAt?: string;
  createdAt: string;
  updatedAt: string;
  _count?: {
    articles: number;
  };
}

export interface CreateFeedRequest {
  url: string;
}

export interface UpdateFeedRequest {
  title?: string;
  description?: string;
}

export interface GetFeedsQuery {
  page?: number;
  limit?: number;
  search?: string;
  [key: string]: unknown;
}

export interface FeedsResponse {
  feeds: Feed[];
  pagination: Pagination;
}

// 記事関連型
export interface Article {
  id: string;
  title: string;
  url: string;
  description?: string;
  publishedAt: string;
  feedId: string;
  createdAt: string;
  updatedAt: string;
  feed?: {
    id: string;
    title: string;
    favicon?: string;
  };
  isRead?: boolean;
  readAt?: string;
  isBookmarked?: boolean;
  bookmarkedAt?: string;
}

export interface GetArticlesQuery {
  page?: number;
  limit?: number;
  search?: string;
  [key: string]: unknown;
}

export interface ArticlesResponse {
  articles: Article[];
  pagination: Pagination;
}

// エラー型
export interface ApiError {
  error: string;
  details?: unknown;
}

// 設定型
export interface SdkConfig {
  baseURL: string;
  timeout?: number;
  token?: string;
}