import type { ApiClient } from './client';
import type {
  Feed,
  CreateFeedRequest,
  UpdateFeedRequest,
  GetFeedsQuery,
  FeedsResponse,
  ArticlesResponse,
  GetArticlesQuery,
} from './types';

export class FeedsService {
  constructor(private client: ApiClient) {}

  // フィード作成
  async createFeed(data: CreateFeedRequest): Promise<Feed> {
    const response = await this.client.post<{ feed: Feed }>('/api/feeds', data);
    
    if (response.success && response.data) {
      return response.data.feed;
    }
    
    throw new Error(response.error || 'フィードの作成に失敗しました');
  }

  // フィード一覧取得
  async getFeeds(query?: GetFeedsQuery): Promise<FeedsResponse> {
    const response = await this.client.get<FeedsResponse>('/api/feeds', query);
    
    if (response.success && response.data) {
      return response.data;
    }
    
    throw new Error(response.error || 'フィード一覧の取得に失敗しました');
  }

  // フィード詳細取得
  async getFeedById(feedId: string): Promise<Feed> {
    const response = await this.client.get<Feed>(`/api/feeds/${feedId}`);
    
    if (response.success && response.data) {
      return response.data;
    }
    
    throw new Error(response.error || 'フィード詳細の取得に失敗しました');
  }

  // フィード更新
  async updateFeed(feedId: string, data: UpdateFeedRequest): Promise<Feed> {
    const response = await this.client.put<{ feed: Feed }>(`/api/feeds/${feedId}`, data);
    
    if (response.success && response.data) {
      return response.data.feed;
    }
    
    throw new Error(response.error || 'フィードの更新に失敗しました');
  }

  // フィード削除
  async deleteFeed(feedId: string): Promise<void> {
    const response = await this.client.delete(`/api/feeds/${feedId}`);
    
    if (!response.success) {
      throw new Error(response.error || 'フィードの削除に失敗しました');
    }
  }

  // フィードの記事取得
  async getFeedArticles(feedId: string, query?: GetArticlesQuery): Promise<ArticlesResponse> {
    const response = await this.client.get<ArticlesResponse>(`/api/feeds/${feedId}/articles`, query);
    
    if (response.success && response.data) {
      return response.data;
    }
    
    throw new Error(response.error || 'フィード記事の取得に失敗しました');
  }

  // フィード手動更新
  async refreshFeed(feedId: string): Promise<Feed> {
    const response = await this.client.post<{ feed: Feed }>(`/api/feeds/${feedId}/refresh`);
    
    if (response.success && response.data) {
      return response.data.feed;
    }
    
    throw new Error(response.error || 'フィードの更新に失敗しました');
  }

  // 全フィード更新
  async refreshAllFeeds(): Promise<{ success: number; errors: string[] }> {
    const response = await this.client.post<{ 
      result: { success: number; errors: string[] } 
    }>('/api/feeds/refresh-all');
    
    if (response.success && response.data) {
      return response.data.result;
    }
    
    throw new Error(response.error || '全フィードの更新に失敗しました');
  }

  // Compatibility aliases
  async getAll(query?: GetFeedsQuery): Promise<Feed[]> {
    const response = await this.getFeeds(query);
    return response.feeds;
  }

  async create(data: CreateFeedRequest): Promise<Feed> {
    return this.createFeed(data);
  }

  async delete(feedId: string): Promise<void> {
    return this.deleteFeed(feedId);
  }

  async refresh(feedId: string): Promise<Feed> {
    return this.refreshFeed(feedId);
  }
}