import type { ApiClient } from './client'
import type { ApiResponse, Article, ArticlesResponse, GetArticlesQuery } from './types'

export class ArticlesService {
  constructor(private client: ApiClient) {}

  // 全記事取得
  async getArticles(query?: GetArticlesQuery): Promise<ArticlesResponse> {
    const response = await this.client.get<ApiResponse<ArticlesResponse>>('/api/articles', query)

    // ArticleRoutesはApiResponse形式で{success: true, data: result}を返す
    if (response.success && response.data) {
      return response.data
    }

    throw new Error(response.error || '記事の取得に失敗しました')
  }

  // 記事詳細取得
  async getArticleById(articleId: string): Promise<Article> {
    const response = await this.client.get<ApiResponse<Article>>(`/api/articles/${articleId}`)

    // ArticleRoutesはApiResponse形式で{success: true, data: result}を返す
    if (response.success && response.data) {
      return response.data
    }

    throw new Error(response.error || '記事詳細の取得に失敗しました')
  }

  // 記事を既読にする
  async markAsRead(articleId: string): Promise<void> {
    const response = await this.client.put<ApiResponse>(`/api/articles/${articleId}/read`)

    // ArticleRoutesはApiResponse形式で{success: boolean}を返す
    if (!response.success) {
      throw new Error(response.error || '記事の既読設定に失敗しました')
    }
  }

  // 記事を未読にする
  async markAsUnread(articleId: string): Promise<void> {
    const response = await this.client.put<ApiResponse>(`/api/articles/${articleId}/unread`)

    // ArticleRoutesはApiResponse形式で{success: boolean}を返す
    if (!response.success) {
      throw new Error(response.error || '記事の未読設定に失敗しました')
    }
  }

  // 記事をブックマークに追加
  async addBookmark(articleId: string): Promise<void> {
    const response = await this.client.post<ApiResponse>(`/api/articles/${articleId}/bookmark`)

    // ArticleRoutesはApiResponse形式で{success: boolean}を返す
    if (!response.success) {
      throw new Error(response.error || 'ブックマークの追加に失敗しました')
    }
  }

  // 記事のブックマークを削除
  async removeBookmark(articleId: string): Promise<void> {
    const response = await this.client.delete<ApiResponse>(`/api/articles/${articleId}/bookmark`)

    // ArticleRoutesはApiResponse形式で{success: boolean}を返す
    if (!response.success) {
      throw new Error(response.error || 'ブックマークの削除に失敗しました')
    }
  }

  // ブックマーク記事一覧取得
  async getBookmarks(query?: GetArticlesQuery): Promise<ArticlesResponse> {
    const response = await this.client.get<ApiResponse<ArticlesResponse>>(
      '/api/articles/bookmarks/list',
      query
    )

    // ArticleRoutesはApiResponse形式で{success: true, data: result}を返す
    if (response.success && response.data) {
      return response.data
    }

    throw new Error(response.error || 'ブックマーク一覧の取得に失敗しました')
  }

  // Compatibility aliases
  async getAll(query?: GetArticlesQuery): Promise<ArticlesResponse> {
    return this.getArticles(query)
  }

  async markRead(articleId: string): Promise<void> {
    return this.markAsRead(articleId)
  }

  async bookmark(articleId: string): Promise<void> {
    return this.addBookmark(articleId)
  }

  async unbookmark(articleId: string): Promise<void> {
    return this.removeBookmark(articleId)
  }
}
