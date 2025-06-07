import type { ApiClient } from './client';
import type {
  Article,
  ArticlesResponse,
  GetArticlesQuery,
} from './types';

export class ArticlesService {
  constructor(private client: ApiClient) {}

  // 全記事取得
  async getArticles(query?: GetArticlesQuery): Promise<ArticlesResponse> {
    const response = await this.client.get<ArticlesResponse>('/api/articles', query);
    
    if (response.success && response.data) {
      return response.data;
    }
    
    throw new Error(response.error || '記事の取得に失敗しました');
  }

  // 記事詳細取得
  async getArticleById(articleId: string): Promise<Article> {
    const response = await this.client.get<Article>(`/api/articles/${articleId}`);
    
    if (response.success && response.data) {
      return response.data;
    }
    
    throw new Error(response.error || '記事詳細の取得に失敗しました');
  }

  // 記事を既読にする
  async markAsRead(articleId: string): Promise<void> {
    const response = await this.client.put(`/api/articles/${articleId}/read`);
    
    if (!response.success) {
      throw new Error(response.error || '記事の既読設定に失敗しました');
    }
  }

  // 記事を未読にする
  async markAsUnread(articleId: string): Promise<void> {
    const response = await this.client.put(`/api/articles/${articleId}/unread`);
    
    if (!response.success) {
      throw new Error(response.error || '記事の未読設定に失敗しました');
    }
  }

  // 記事をブックマークに追加
  async addBookmark(articleId: string): Promise<void> {
    const response = await this.client.post(`/api/articles/${articleId}/bookmark`);
    
    if (!response.success) {
      throw new Error(response.error || 'ブックマークの追加に失敗しました');
    }
  }

  // 記事のブックマークを削除
  async removeBookmark(articleId: string): Promise<void> {
    const response = await this.client.delete(`/api/articles/${articleId}/bookmark`);
    
    if (!response.success) {
      throw new Error(response.error || 'ブックマークの削除に失敗しました');
    }
  }

  // ブックマーク記事一覧取得
  async getBookmarks(query?: GetArticlesQuery): Promise<ArticlesResponse> {
    const response = await this.client.get<ArticlesResponse>('/api/articles/bookmarks/list', query);
    
    if (response.success && response.data) {
      return response.data;
    }
    
    throw new Error(response.error || 'ブックマーク一覧の取得に失敗しました');
  }

  // Compatibility alias
  async getAll(query?: GetArticlesQuery): Promise<ArticlesResponse> {
    return this.getArticles(query);
  }
}