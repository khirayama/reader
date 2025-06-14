import AsyncStorage from '@react-native-async-storage/async-storage';

// 型定義
export interface User {
  id: string;
  email: string;
  theme: 'SYSTEM' | 'LIGHT' | 'DARK';
  language: 'JA' | 'EN';
  createdAt: string;
  updatedAt: string;
}

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

export interface Tag {
  id: string;
  name: string;
  color?: string;
  userId: string;
  createdAt: string;
  updatedAt: string;
  feedCount?: number;
}

export interface Feed {
  id: string;
  url: string;
  title: string;
  description?: string;
  siteUrl?: string;
  favicon?: string;
  userId: string;
  lastFetchedAt: string;
  createdAt: string;
  updatedAt: string;
  tags?: Tag[];
  articleCount?: number;
}

export interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

const API_URL = __DEV__ ? 'http://localhost:3001' : 'https://your-api-domain.vercel.app';
export const TOKEN_STORAGE_KEY = 'rss-reader-token';

// レート制限エラーの詳細な型定義
export interface RateLimitError {
  error: string;
  details: string;
  retryAfter: number;
  rateLimitType: string;
  remaining: number;
  limit: number;
  resetTime: string;
}

// リトライ設定
interface RetryConfig {
  maxRetries: number;
  baseDelay: number;
  maxDelay: number;
}

// 指数バックオフでの待機
const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// シンプルなHTTPクライアント（リトライ機能付き）
class SimpleApiClient {
  private baseURL: string;
  private timeout: number;
  private token?: string;
  private retryConfig: RetryConfig;

  constructor(config: { baseURL: string; timeout?: number }) {
    this.baseURL = config.baseURL;
    this.timeout = config.timeout || 10000;
    this.retryConfig = {
      maxRetries: 3,
      baseDelay: 1000, // 1秒
      maxDelay: 30000, // 30秒
    };
  }

  setToken(token: string): void {
    this.token = token;
  }

  clearToken(): void {
    this.token = undefined;
  }

  getToken(): string | undefined {
    return this.token;
  }

  private async request<T>(method: string, path: string, data?: unknown, isFormData = false): Promise<T> {
    return this.requestWithRetry<T>(method, path, data, isFormData, 0);
  }

  private async requestWithRetry<T>(
    method: string, 
    path: string, 
    data?: unknown, 
    isFormData = false, 
    attempt = 0
  ): Promise<T> {
    const url = `${this.baseURL}${path}`;
    const headers: Record<string, string> = {};
    
    if (!isFormData) {
      headers['Content-Type'] = 'application/json';
    }

    if (this.token) {
      headers.Authorization = `Bearer ${this.token}`;
    }

    const config: RequestInit = {
      method,
      headers,
    };

    if (data && method !== 'GET') {
      config.body = isFormData ? data as BodyInit : JSON.stringify(data);
    }

    try {
      console.log(`[Native SDK] API呼び出し開始 (試行 ${attempt + 1}/${this.retryConfig.maxRetries + 1}):`, method, url);
      const response = await fetch(url, config);
      
      if (!response.ok) {
        if (response.status === 429 && attempt < this.retryConfig.maxRetries) {
          // レート制限エラーの場合、リトライ処理
          const errorData = await response.json() as RateLimitError;
          console.log('[Native SDK] レート制限エラー、リトライ準備:', errorData);
          
          // リトライ遅延時間を計算（指数バックオフ + レスポンスの retryAfter）
          const retryAfterMs = (errorData.retryAfter || 60) * 1000;
          const exponentialDelay = Math.min(
            this.retryConfig.baseDelay * Math.pow(2, attempt),
            this.retryConfig.maxDelay
          );
          const delayMs = Math.max(retryAfterMs, exponentialDelay);
          
          console.log(`[Native SDK] ${delayMs}ms 待機後にリトライします...`);
          
          // React Native用のイベント発火（global event emitter）
          // Note: React Nativeでは適切なイベント管理システムを使用することを推奨
          console.log('[Native SDK] レート制限情報:', {
            ...errorData,
            attempt: attempt + 1,
            maxRetries: this.retryConfig.maxRetries,
            retryIn: delayMs / 1000,
          });
          
          await sleep(delayMs);
          return this.requestWithRetry<T>(method, path, data, isFormData, attempt + 1);
        }
        
        console.error('[Native SDK] APIエラー:', response.status, response.statusText);
        const errorData = await response.json();
        
        // レート制限エラーの場合は詳細情報も含める
        if (response.status === 429) {
          const rateLimitError = new Error(errorData.error || 'レート制限に達しました');
          (rateLimitError as any).rateLimitInfo = errorData;
          throw rateLimitError;
        }
        
        throw new Error(errorData.error || `HTTP ${response.status}`);
      }
      
      const result = await response.json();
      console.log('[Native SDK] API呼び出し成功:', result);
      return result;
    } catch (error) {
      console.error('[Native SDK] API呼び出しエラー:', error);
      
      // ネットワークエラーや一時的なエラーの場合もリトライ
      if (attempt < this.retryConfig.maxRetries && this.isRetryableError(error)) {
        const delayMs = Math.min(
          this.retryConfig.baseDelay * Math.pow(2, attempt),
          this.retryConfig.maxDelay
        );
        
        console.log(`[Native SDK] ネットワークエラー、${delayMs}ms 待機後にリトライします...`);
        await sleep(delayMs);
        return this.requestWithRetry<T>(method, path, data, isFormData, attempt + 1);
      }
      
      if (error instanceof Error) {
        throw error;
      }
      throw new Error('Network error');
    }
  }

  private isRetryableError(error: any): boolean {
    // タイムアウトエラーやネットワークエラーはリトライ対象
    return (
      error instanceof TypeError || // ネットワークエラー
      error.name === 'AbortError' || // タイムアウト
      error.message?.includes('fetch') || // fetch関連エラー
      error.message?.includes('network') // ネットワーク関連エラー
    );
  }

  async get<T>(path: string): Promise<T> {
    return this.request<T>('GET', path);
  }

  async post<T>(path: string, data: unknown): Promise<T> {
    return this.request<T>('POST', path, data);
  }

  async put<T>(path: string, data: unknown): Promise<T> {
    return this.request<T>('PUT', path, data);
  }

  async delete<T>(path: string, data?: unknown): Promise<T> {
    return this.request<T>('DELETE', path, data);
  }

  async postFormData<T>(path: string, data: FormData): Promise<T> {
    return this.request<T>('POST', path, data, true);
  }
}

// 認証サービス
class AuthService {
  constructor(private client: SimpleApiClient) {}

  async login(data: { email: string; password: string }) {
    return await this.client.post('/api/auth/login', data);
  }

  async register(data: { email: string; password: string }) {
    return await this.client.post('/api/auth/register', data);
  }

  async getProfile(): Promise<User> {
    return await this.client.get('/api/auth/profile');
  }

  async updateSettings(data: { theme?: 'SYSTEM' | 'LIGHT' | 'DARK'; language?: 'JA' | 'EN' }) {
    return await this.client.put('/api/auth/settings', data);
  }

  async changePassword(data: { currentPassword: string; newPassword: string }) {
    return await this.client.put('/api/auth/password', data);
  }

  async changeEmail(data: { email: string; password: string }) {
    return await this.client.put('/api/auth/email', data);
  }

  async deleteAccount(data: { password: string }) {
    return await this.client.delete('/api/auth/account', data);
  }

  isAuthenticated(): boolean {
    return !!this.client.getToken();
  }
}

// フィードサービス
class FeedsService {
  constructor(private client: SimpleApiClient) {}

  async getFeeds(query?: { page?: number; limit?: number; search?: string; tagId?: string }): Promise<{ feeds: Feed[], pagination: Pagination }> {
    const params = new URLSearchParams();
    if (query?.page) params.append('page', query.page.toString());
    params.append('limit', (query?.limit || 1000).toString());
    if (query?.search) params.append('search', query.search);
    if (query?.tagId) params.append('tagId', query.tagId);
    
    const path = `/api/feeds${params.toString() ? '?' + params.toString() : ''}`;
    const response = await this.client.get<{ success: boolean; data: { feeds: Feed[], pagination: Pagination } }>(path);
    return response.data;
  }

  async getFeed(feedId: string): Promise<Feed> {
    const response = await this.client.get<{ success: boolean; data: Feed }>(`/api/feeds/${feedId}`);
    return response.data;
  }

  async createFeed(data: { url: string }) {
    return await this.client.post('/api/feeds', data);
  }

  async deleteFeed(feedId: string) {
    return await this.client.delete(`/api/feeds/${feedId}`);
  }

  async refreshAllFeeds() {
    return await this.client.post('/api/feeds/refresh-all', {});
  }

  async refresh(feedId: string) {
    return await this.client.post(`/api/feeds/${feedId}/refresh`, {});
  }

  async assignTagToFeed(feedId: string, data: { tagId: string }) {
    return await this.client.post(`/api/feeds/${feedId}/tags`, data);
  }

  async removeTagFromFeed(feedId: string, tagId: string) {
    return await this.client.delete(`/api/feeds/${feedId}/tags/${tagId}`);
  }

  // Compatibility aliases
  async getAll(query?: { page?: number; limit?: number; search?: string; tagId?: string }): Promise<Feed[]> {
    const response = await this.getFeeds({ limit: 1000, ...query });
    return response.feeds;
  }

  async create(data: { url: string }) {
    return this.createFeed(data);
  }

  async delete(feedId: string) {
    return this.deleteFeed(feedId);
  }

  async refreshAll() {
    return this.refreshAllFeeds();
  }
}

// 記事サービス
class ArticlesService {
  constructor(private client: SimpleApiClient) {}

  async getArticles(query?: { page?: number; limit?: number; search?: string; feedId?: string; tagId?: string }): Promise<{ articles: Article[], pagination: Pagination }> {
    const params = new URLSearchParams();
    if (query?.page) params.append('page', query.page.toString());
    if (query?.limit) params.append('limit', query.limit.toString());
    if (query?.search) params.append('search', query.search);
    if (query?.feedId) params.append('feedId', query.feedId);
    if (query?.tagId) params.append('tagId', query.tagId);
    
    const path = `/api/articles${params.toString() ? '?' + params.toString() : ''}`;
    const response = await this.client.get<{ success: boolean; data: { articles: Article[], pagination: Pagination } }>(path);
    return response.data;
  }

  async markAsRead(articleId: string) {
    return await this.client.put(`/api/articles/${articleId}/read`, {});
  }

  async markAsUnread(articleId: string) {
    return await this.client.put(`/api/articles/${articleId}/unread`, {});
  }

  async addBookmark(articleId: string) {
    return await this.client.post(`/api/articles/${articleId}/bookmark`, {});
  }

  async removeBookmark(articleId: string) {
    return await this.client.delete(`/api/articles/${articleId}/bookmark`);
  }

  async getBookmarks(query?: { page?: number; limit?: number }): Promise<{ articles: Article[], pagination: Pagination }> {
    const params = new URLSearchParams();
    if (query?.page) params.append('page', query.page.toString());
    if (query?.limit) params.append('limit', query.limit.toString());
    
    const path = `/api/articles/bookmarks/list${params.toString() ? '?' + params.toString() : ''}`;
    const response = await this.client.get<{ success: boolean; data: { articles: Article[], pagination: Pagination } }>(path);
    return response.data;
  }

  // 互換性のためのエイリアス
  async getAll(query?: { page?: number; limit?: number; search?: string; feedId?: string; tagId?: string }) {
    return this.getArticles(query);
  }

  async markRead(articleId: string) {
    return this.markAsRead(articleId);
  }

  async bookmark(articleId: string) {
    return this.addBookmark(articleId);
  }

  async unbookmark(articleId: string) {
    return this.removeBookmark(articleId);
  }
}

// タグサービス
class TagsService {
  constructor(private client: SimpleApiClient) {}

  async getTags(query?: { search?: string; limit?: number; offset?: number }) {
    const params = new URLSearchParams();
    if (query?.search) params.append('search', query.search);
    if (query?.limit) params.append('limit', query.limit.toString());
    if (query?.offset) params.append('offset', query.offset.toString());
    
    const path = `/api/tags${params.toString() ? '?' + params.toString() : ''}`;
    return await this.client.get<{ success: boolean; data: { tags: Tag[], total: number, hasMore: boolean } }>(path);
  }

  async createTag(data: { name: string; color?: string }) {
    return await this.client.post(`/api/tags`, data);
  }

  async updateTag(tagId: string, data: { name?: string; color?: string }) {
    return await this.client.put(`/api/tags/${tagId}`, data);
  }

  async deleteTag(tagId: string) {
    return await this.client.delete(`/api/tags/${tagId}`);
  }
}

// RSS Reader SDK クラス
export class RSSReaderSDK {
  private client: SimpleApiClient;
  public auth: AuthService;
  public feeds: FeedsService;
  public articles: ArticlesService;
  public tags: TagsService;

  constructor(config: { baseURL: string; timeout?: number }) {
    this.client = new SimpleApiClient(config);
    this.auth = new AuthService(this.client);
    this.feeds = new FeedsService(this.client);
    this.articles = new ArticlesService(this.client);
    this.tags = new TagsService(this.client);
  }

  setToken(token: string): void {
    this.client.setToken(token);
  }

  clearToken(): void {
    this.client.clearToken();
  }

  getToken(): string | undefined {
    return this.client.getToken();
  }

  isAuthenticated(): boolean {
    return this.auth.isAuthenticated();
  }
}

// SDKインスタンスを作成
const baseSdk = new RSSReaderSDK({
  baseURL: API_URL,
  timeout: 5 * 60 * 1000, // 5分（OPML処理対応）
});

export const sdk = baseSdk;

// トークンをAsyncStorageから読み込み
const loadSavedToken = async () => {
  try {
    const savedToken = await AsyncStorage.getItem(TOKEN_STORAGE_KEY);
    if (savedToken) {
      baseSdk.setToken(savedToken);
    }
  } catch (error) {
    console.error('Failed to load saved token:', error);
  }
};

// アプリ起動時にトークンを読み込み
loadSavedToken();

// トークンを保存するヘルパー関数
export const saveToken = async (token: string) => {
  try {
    await AsyncStorage.setItem(TOKEN_STORAGE_KEY, token);
    baseSdk.setToken(token);
  } catch (error) {
    console.error('Failed to save token:', error);
  }
};

// トークンをクリアするヘルパー関数
export const clearToken = async () => {
  try {
    await AsyncStorage.removeItem(TOKEN_STORAGE_KEY);
    baseSdk.clearToken();
  } catch (error) {
    console.error('Failed to clear token:', error);
  }
};