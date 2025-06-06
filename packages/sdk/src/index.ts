import { ApiClient } from './client';
import { AuthService } from './auth';
import { FeedsService } from './feeds';
import { ArticlesService } from './articles';
import type { SdkConfig } from './types';

// ����������
export * from './types';

// RSS Reader SDK ���
export class RSSReaderSDK {
  private client: ApiClient;
  
  // ��ӹ��
  public auth: AuthService;
  public feeds: FeedsService;
  public articles: ArticlesService;

  constructor(config: SdkConfig) {
    this.client = new ApiClient(config);
    
    // ��ӹ�
    this.auth = new AuthService(this.client);
    this.feeds = new FeedsService(this.client);
    this.articles = new ArticlesService(this.client);
  }

  // ����n�������
  setToken(token: string): void {
    this.client.setToken(token);
  }

  clearToken(): void {
    this.client.clearToken();
  }

  getToken(): string | undefined {
    return this.client.getToken();
  }

  // �<�K��
  isAuthenticated(): boolean {
    return this.auth.isAuthenticated();
  }
}

// �)j Factory �p
export function createRSSReaderSDK(config: SdkConfig): RSSReaderSDK {
  return new RSSReaderSDK(config);
}

// �թ�Ȩ�����
export default RSSReaderSDK;

// %��ӹn������
export { ApiClient, AuthService, FeedsService, ArticlesService };