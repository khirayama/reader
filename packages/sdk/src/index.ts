import { ArticlesService } from './articles'
import { AuthService } from './auth'
import { ApiClient } from './client'
import { FeedsService } from './feeds'
import { OpmlService } from './opml'
import type { SdkConfig } from './types'

// Type exports
export * from './types'

// RSS Reader SDK class
export class RSSReaderSDK {
  private client: ApiClient

  // Service instances
  public auth: AuthService
  public feeds: FeedsService
  public articles: ArticlesService
  public opml: OpmlService

  constructor(config: SdkConfig) {
    this.client = new ApiClient(config)

    // Initialize services
    this.auth = new AuthService(this.client)
    this.feeds = new FeedsService(this.client)
    this.articles = new ArticlesService(this.client)
    this.opml = new OpmlService(this.client)
  }

  // Token management
  setToken(token: string): void {
    this.client.setToken(token)
  }

  clearToken(): void {
    this.client.clearToken()
  }

  getToken(): string | undefined {
    return this.client.getToken()
  }

  // Authentication status
  isAuthenticated(): boolean {
    return this.auth.isAuthenticated()
  }
}

// Factory function for creating SDK instance
export function createRSSReaderSDK(config: SdkConfig): RSSReaderSDK {
  return new RSSReaderSDK(config)
}

// Alias for createRSSReaderSDK for compatibility
export function createSDK(baseURL: string): RSSReaderSDK {
  return new RSSReaderSDK({ baseURL })
}

// Default export
export default RSSReaderSDK

// Service exports
export { ApiClient, AuthService, FeedsService, ArticlesService, OpmlService }
