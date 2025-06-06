import { ApiClient } from './client';
import { AuthService } from './auth';
import { FeedsService } from './feeds';
import { ArticlesService } from './articles';
import type { SdkConfig } from './types';

// ‹š©’¨¯¹İüÈ
export * from './types';

// RSS Reader SDK á¤ó¯é¹
export class RSSReaderSDK {
  private client: ApiClient;
  
  // µüÓ¹¯é¹
  public auth: AuthService;
  public feeds: FeedsService;
  public articles: ArticlesService;

  constructor(config: SdkConfig) {
    this.client = new ApiClient(config);
    
    // µüÓ¹’
    this.auth = new AuthService(this.client);
    this.feeds = new FeedsService(this.client);
    this.articles = new ArticlesService(this.client);
  }

  // Èü¯ó¡nØëÑüá½ÃÉ
  setToken(token: string): void {
    this.client.setToken(token);
  }

  clearToken(): void {
    this.client.clearToken();
  }

  getToken(): string | undefined {
    return this.client.getToken();
  }

  // <¶Kº
  isAuthenticated(): boolean {
    return this.auth.isAuthenticated();
  }
}

// ¿)j Factory ¢p
export function createRSSReaderSDK(config: SdkConfig): RSSReaderSDK {
  return new RSSReaderSDK(config);
}

// ÇÕ©ëÈ¨¯¹İüÈ
export default RSSReaderSDK;

// %µüÓ¹n¨¯¹İüÈ
export { ApiClient, AuthService, FeedsService, ArticlesService };