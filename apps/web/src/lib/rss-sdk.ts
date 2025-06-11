// RSS Reader SDK for Web App

export interface SdkConfig {
  baseURL: string
  timeout?: number
  token?: string
}

export interface User {
  id: string
  email: string
  theme: 'SYSTEM' | 'LIGHT' | 'DARK'
  language: 'JA' | 'EN'
  createdAt: string
  updatedAt: string
}

export interface LoginRequest {
  email: string
  password: string
}

export interface RegisterRequest {
  email: string
  password: string
}

export interface LoginResponse {
  user: User
  token: string
}

export interface Article {
  id: string
  title: string
  url: string
  description?: string
  publishedAt: string
  feedId: string
  createdAt: string
  updatedAt: string
  feed?: {
    id: string
    title: string
    favicon?: string
  }
  isRead?: boolean
  readAt?: string
  isBookmarked?: boolean
  bookmarkedAt?: string
}

export interface Tag {
  id: string
  name: string
  color?: string
  userId: string
  createdAt: string
  updatedAt: string
  feedCount?: number
}

export interface Feed {
  id: string
  url: string
  title: string
  description?: string
  siteUrl?: string
  favicon?: string
  userId: string
  lastFetchedAt: string
  createdAt: string
  updatedAt: string
  tags?: Tag[]
  articleCount?: number
  _count?: {
    articles: number
  }
}

export interface Pagination {
  page: number
  limit: number
  total: number
  totalPages: number
  hasNext: boolean
  hasPrev: boolean
}

export interface ArticleListResponse {
  success: boolean
  data: {
    articles: Article[]
    pagination: Pagination
  }
}

export interface FeedListResponse {
  success: boolean
  data: {
    feeds: Feed[]
    pagination: Pagination
  }
}

export interface ImportOpmlResponse {
  message: string
  imported: number
  failed: number
  errors: string[]
}

export interface TagListResponse {
  success: boolean
  data: {
    tags: Tag[]
    total: number
    hasMore: boolean
  }
}

export interface CreateTagRequest {
  name: string
  color?: string
}

export interface UpdateTagRequest {
  name?: string
  color?: string
}

export interface AssignTagRequest {
  tagId?: string
  tagName?: string
  color?: string
}


// シンプルなHTTPクライアント
class SimpleApiClient {
  private baseURL: string
  private timeout: number
  private token?: string

  constructor(config: SdkConfig) {
    this.baseURL = config.baseURL
    this.timeout = config.timeout || 10000
    this.token = config.token
  }

  setToken(token: string): void {
    this.token = token
  }

  clearToken(): void {
    this.token = undefined
  }

  getToken(): string | undefined {
    return this.token
  }

  private async request<T>(method: string, path: string, data?: unknown, isFormData = false): Promise<T> {
    const url = `${this.baseURL}${path}`

    const headers: Record<string, string> = {}
    
    if (!isFormData) {
      headers['Content-Type'] = 'application/json'
    }

    if (this.token) {
      headers.Authorization = `Bearer ${this.token}`
    }

    const config: RequestInit = {
      method,
      headers,
      signal: AbortSignal.timeout(this.timeout),
    }

    if (data && method !== 'GET') {
      config.body = isFormData ? data as BodyInit : JSON.stringify(data)
    }

    try {
      const response = await fetch(url, config)
      
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || `HTTP ${response.status}`)
      }
      
      const result = await response.json()
      return result
    } catch (error) {
      if (error instanceof Error) {
        throw error
      }
      throw new Error('Network error')
    }
  }

  private async requestBlob(method: string, path: string): Promise<Blob> {
    const url = `${this.baseURL}${path}`

    const headers: Record<string, string> = {}

    if (this.token) {
      headers.Authorization = `Bearer ${this.token}`
    }

    const config: RequestInit = {
      method,
      headers,
      signal: AbortSignal.timeout(this.timeout),
    }

    try {
      const response = await fetch(url, config)
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`)
      }
      
      return await response.blob()
    } catch (error) {
      if (error instanceof Error) {
        throw error
      }
      throw new Error('Network error')
    }
  }

  async get<T>(path: string): Promise<T> {
    return this.request<T>('GET', path)
  }

  async post<T>(path: string, data: unknown): Promise<T> {
    return this.request<T>('POST', path, data)
  }

  async put<T>(path: string, data: unknown): Promise<T> {
    return this.request<T>('PUT', path, data)
  }

  async delete<T>(path: string, data?: unknown): Promise<T> {
    return this.request<T>('DELETE', path, data)
  }

  async postFormData<T>(path: string, data: FormData): Promise<T> {
    return this.request<T>('POST', path, data, true)
  }

  async getBlob(path: string): Promise<Blob> {
    return this.requestBlob('GET', path)
  }
}

// 認証サービス
class AuthService {
  constructor(private client: SimpleApiClient) {}

  async register(data: RegisterRequest): Promise<LoginResponse> {
    return await this.client.post<LoginResponse>('/api/auth/register', data)
  }

  async login(data: LoginRequest): Promise<LoginResponse> {
    return await this.client.post<LoginResponse>('/api/auth/login', data)
  }

  async getProfile(): Promise<User> {
    return await this.client.get<User>('/api/auth/profile')
  }

  async forgotPassword(email: string): Promise<{ message: string }> {
    return await this.client.post<{ message: string }>('/api/auth/forgot-password', { email })
  }

  async resetPassword(data: { token: string; password: string }): Promise<{ message: string }> {
    return await this.client.post<{ message: string }>('/api/auth/reset-password', data)
  }

  async changePassword(data: { currentPassword: string; newPassword: string }): Promise<{ message: string }> {
    return await this.client.put<{ message: string }>('/api/auth/password', data)
  }

  async changeEmail(data: { email: string; password: string }): Promise<{ user: User }> {
    return await this.client.put<{ user: User }>('/api/auth/email', data)
  }

  async updateSettings(data: { theme?: 'SYSTEM' | 'LIGHT' | 'DARK'; language?: 'JA' | 'EN' }): Promise<{ user: User }> {
    return await this.client.put<{ user: User }>('/api/auth/settings', data)
  }

  async deleteAccount(data: { password: string }): Promise<{ message: string }> {
    return await this.client.delete<{ message: string }>('/api/auth/account', data)
  }

  logout(): void {
    // クライアント側でのログアウト処理のみ
  }

  isAuthenticated(): boolean {
    return !!this.client.getToken()
  }
}

// フィードサービス
class FeedsService {
  constructor(private client: SimpleApiClient) {}

  async getFeeds(query?: { page?: number; limit?: number; search?: string; tagId?: string }): Promise<{ feeds: Feed[], pagination: Pagination }> {
    const params = new URLSearchParams()
    if (query?.page) params.append('page', query.page.toString())
    if (query?.limit) params.append('limit', query.limit.toString())
    if (query?.search) params.append('search', query.search)
    if (query?.tagId) params.append('tagId', query.tagId)
    
    const path = `/api/feeds${params.toString() ? '?' + params.toString() : ''}`
    const response = await this.client.get<FeedListResponse>(path)
    return response.data || response as any
  }

  async createFeed(data: { url: string }) {
    return await this.client.post('/api/feeds', data)
  }

  async deleteFeed(feedId: string) {
    return await this.client.delete(`/api/feeds/${feedId}`)
  }

  async refreshAllFeeds() {
    return await this.client.post('/api/feeds/refresh-all', {})
  }

  async getFeedArticles(
    feedId: string,
    query?: { page?: number; limit?: number; search?: string }
  ): Promise<{ articles: Article[], pagination: Pagination }> {
    const params = new URLSearchParams()
    if (query?.page) params.append('page', query.page.toString())
    if (query?.limit) params.append('limit', query.limit.toString())
    if (query?.search) params.append('search', query.search)
    
    const path = `/api/feeds/${feedId}/articles${params.toString() ? '?' + params.toString() : ''}`
    const response = await this.client.get<ArticleListResponse>(path)
    return response.data || response as any
  }

  // Compatibility aliases
  async getAll(query?: { page?: number; limit?: number; search?: string }): Promise<Feed[]> {
    const response = await this.getFeeds(query)
    return response.feeds
  }

  async create(data: { url: string }) {
    return this.createFeed(data)
  }

  async delete(feedId: string) {
    return this.deleteFeed(feedId)
  }

  async refreshAll() {
    return this.refreshAllFeeds()
  }

  async refresh(feedId: string) {
    return await this.client.post(`/api/feeds/${feedId}/refresh`, {})
  }

  async assignTagToFeed(feedId: string, data: AssignTagRequest): Promise<{ success: boolean; data: { feedTag: any } }> {
    return await this.client.post(`/api/feeds/${feedId}/tags`, data)
  }

  async removeTagFromFeed(feedId: string, tagId: string): Promise<{ success: boolean; message: string }> {
    return await this.client.delete(`/api/feeds/${feedId}/tags/${tagId}`)
  }
}

// 記事サービス
class ArticlesService {
  constructor(private client: SimpleApiClient) {}

  async getArticles(query?: { page?: number; limit?: number; search?: string; feedId?: string; tagId?: string }): Promise<{ articles: Article[], pagination: Pagination }> {
    const params = new URLSearchParams()
    if (query?.page) params.append('page', query.page.toString())
    if (query?.limit) params.append('limit', query.limit.toString())
    if (query?.search) params.append('search', query.search)
    if (query?.feedId) params.append('feedId', query.feedId)
    if (query?.tagId) params.append('tagId', query.tagId)
    
    const path = `/api/articles${params.toString() ? '?' + params.toString() : ''}`
    const response = await this.client.get<ArticleListResponse>(path)
    return response.data || response as any
  }

  async getArticleById(articleId: string) {
    return await this.client.get(`/api/articles/${articleId}`)
  }

  async markAsRead(articleId: string) {
    return await this.client.put(`/api/articles/${articleId}/read`, {})
  }

  async markAsUnread(articleId: string) {
    return await this.client.put(`/api/articles/${articleId}/unread`, {})
  }

  async addBookmark(articleId: string) {
    return await this.client.post(`/api/articles/${articleId}/bookmark`, {})
  }

  async removeBookmark(articleId: string) {
    return await this.client.delete(`/api/articles/${articleId}/bookmark`)
  }

  async getBookmarks(query?: { page?: number; limit?: number }) {
    const params = new URLSearchParams()
    if (query?.page) params.append('page', query.page.toString())
    if (query?.limit) params.append('limit', query.limit.toString())
    
    const path = `/api/articles/bookmarks/list${params.toString() ? '?' + params.toString() : ''}`
    return await this.client.get(path)
  }

  // Compatibility aliases
  async getAll(query?: { page?: number; limit?: number; search?: string; feedId?: string; tagId?: string }) {
    return this.getArticles(query)
  }

  async markRead(articleId: string) {
    return this.markAsRead(articleId)
  }

  async bookmark(articleId: string) {
    return this.addBookmark(articleId)
  }

  async unbookmark(articleId: string) {
    return this.removeBookmark(articleId)
  }
}

// OPMLサービス
class OpmlService {
  constructor(private client: SimpleApiClient) {}

  async exportOpml(): Promise<Blob> {
    return await this.client.getBlob('/api/opml/export')
  }

  async importOpml(file: File): Promise<ImportOpmlResponse> {
    const formData = new FormData()
    formData.append('file', file)
    return await this.client.postFormData<ImportOpmlResponse>('/api/opml/import', formData)
  }
}

// タグサービス
class TagsService {
  constructor(private client: SimpleApiClient) {}

  async getTags(query?: { search?: string; limit?: number; offset?: number }): Promise<TagListResponse> {
    const params = new URLSearchParams()
    if (query?.search) params.append('search', query.search)
    if (query?.limit) params.append('limit', query.limit.toString())
    if (query?.offset) params.append('offset', query.offset.toString())
    
    const path = `/api/tags${params.toString() ? '?' + params.toString() : ''}`
    return await this.client.get<TagListResponse>(path)
  }

  async getTag(tagId: string): Promise<{ success: boolean; data: { tag: Tag } }> {
    return await this.client.get(`/api/tags/${tagId}`)
  }

  async createTag(data: CreateTagRequest): Promise<{ success: boolean; data: { tag: Tag } }> {
    return await this.client.post(`/api/tags`, data)
  }

  async updateTag(tagId: string, data: UpdateTagRequest): Promise<{ success: boolean; data: { tag: Tag } }> {
    return await this.client.put(`/api/tags/${tagId}`, data)
  }

  async deleteTag(tagId: string): Promise<{ success: boolean; message: string }> {
    return await this.client.delete(`/api/tags/${tagId}`)
  }

  async assignTagToFeed(feedId: string, data: AssignTagRequest): Promise<{ success: boolean; data: { feedTag: any } }> {
    return await this.client.post(`/api/feeds/${feedId}/tags`, data)
  }

  async removeTagFromFeed(feedId: string, tagId: string): Promise<{ success: boolean; message: string }> {
    return await this.client.delete(`/api/feeds/${feedId}/tags/${tagId}`)
  }

  async getFeedsByTag(tagId: string, query?: { limit?: number; offset?: number }) {
    const params = new URLSearchParams()
    if (query?.limit) params.append('limit', query.limit.toString())
    if (query?.offset) params.append('offset', query.offset.toString())
    
    const path = `/api/tags/${tagId}/feeds${params.toString() ? '?' + params.toString() : ''}`
    return await this.client.get(path)
  }
}

// RSS Reader SDK クラス
export class RSSReaderSDK {
  private client: SimpleApiClient
  public auth: AuthService
  public feeds: FeedsService
  public articles: ArticlesService
  public opml: OpmlService
  public tags: TagsService

  constructor(config: SdkConfig) {
    this.client = new SimpleApiClient(config)
    this.auth = new AuthService(this.client)
    this.feeds = new FeedsService(this.client)
    this.articles = new ArticlesService(this.client)
    this.opml = new OpmlService(this.client)
    this.tags = new TagsService(this.client)
  }

  setToken(token: string): void {
    this.client.setToken(token)
  }

  clearToken(): void {
    this.client.clearToken()
  }

  getToken(): string | undefined {
    return this.client.getToken()
  }

  isAuthenticated(): boolean {
    return this.auth.isAuthenticated()
  }
}

// ファクトリー関数
export function createRSSReaderSDK(config: SdkConfig): RSSReaderSDK {
  return new RSSReaderSDK(config)
}

export default RSSReaderSDK
