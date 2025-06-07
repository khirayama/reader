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

  private async request<T>(method: string, path: string, data?: unknown): Promise<T> {
    const url = `${this.baseURL}${path}`

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
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
      config.body = JSON.stringify(data)
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

  async get<T>(path: string): Promise<T> {
    return this.request<T>('GET', path)
  }

  async post<T>(path: string, data: unknown): Promise<T> {
    return this.request<T>('POST', path, data)
  }

  async put<T>(path: string, data: unknown): Promise<T> {
    return this.request<T>('PUT', path, data)
  }

  async delete<T>(path: string): Promise<T> {
    return this.request<T>('DELETE', path)
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

  async getFeeds(query?: { page?: number; limit?: number; search?: string }) {
    // ダミーレスポンス - 実際のAPIが実装されるまで
    return {
      feeds: [],
      pagination: { page: 1, limit: 20, total: 0, totalPages: 0, hasNext: false, hasPrev: false },
    }
  }

  async createFeed(data: { url: string }) {
    // ダミー実装
    console.log('Creating feed:', data)
  }

  async deleteFeed(feedId: string) {
    // ダミー実装
    console.log('Deleting feed:', feedId)
  }

  async refreshAllFeeds() {
    // ダミー実装
    console.log('Refreshing all feeds')
  }

  async getFeedArticles(
    feedId: string,
    query?: { page?: number; limit?: number; search?: string }
  ) {
    // ダミーレスポンス
    return {
      articles: [],
      pagination: { page: 1, limit: 20, total: 0, totalPages: 0, hasNext: false, hasPrev: false },
    }
  }
}

// 記事サービス
class ArticlesService {
  constructor(private client: SimpleApiClient) {}

  async getArticles(query?: { page?: number; limit?: number; search?: string }) {
    // ダミーレスポンス
    return {
      articles: [],
      pagination: { page: 1, limit: 20, total: 0, totalPages: 0, hasNext: false, hasPrev: false },
    }
  }

  async markAsRead(articleId: string) {
    // ダミー実装
    console.log('Marking as read:', articleId)
  }

  async addBookmark(articleId: string) {
    // ダミー実装
    console.log('Adding bookmark:', articleId)
  }

  async removeBookmark(articleId: string) {
    // ダミー実装
    console.log('Removing bookmark:', articleId)
  }
}

// RSS Reader SDK クラス
export class RSSReaderSDK {
  private client: SimpleApiClient
  public auth: AuthService
  public feeds: FeedsService
  public articles: ArticlesService

  constructor(config: SdkConfig) {
    this.client = new SimpleApiClient(config)
    this.auth = new AuthService(this.client)
    this.feeds = new FeedsService(this.client)
    this.articles = new ArticlesService(this.client)
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
