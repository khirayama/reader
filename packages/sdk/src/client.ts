import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios';
import type { ApiResponse, ApiError, SdkConfig } from './types';

export class ApiClient {
  private client: AxiosInstance;
  private config: SdkConfig;

  constructor(config: SdkConfig) {
    this.config = config;
    this.client = axios.create({
      baseURL: config.baseURL,
      timeout: config.timeout || 10000,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // トークンがある場合は初期設定
    if (config.token) {
      this.setToken(config.token);
    }

    // レスポンスインターセプター
    this.client.interceptors.response.use(
      (response: AxiosResponse) => response,
      (error) => {
        // トークンの期限切れなどのエラーハンドリング
        if (error.response?.status === 401) {
          this.clearToken();
          // トークン期限切れイベントを発火（カスタムイベント）
          if (typeof window !== 'undefined') {
            window.dispatchEvent(new CustomEvent('auth:token-expired'));
          }
        }
        return Promise.reject(error);
      }
    );
  }

  // JWTトークンを設定
  setToken(token: string): void {
    this.config.token = token;
    this.client.defaults.headers.common['Authorization'] = `Bearer ${token}`;
  }

  // JWTトークンをクリア
  clearToken(): void {
    this.config.token = undefined;
    delete this.client.defaults.headers.common['Authorization'];
  }

  // 現在のトークンを取得
  getToken(): string | undefined {
    return this.config.token;
  }

  // GETリクエスト
  async get<T>(
    url: string,
    params?: Record<string, unknown>,
    config?: AxiosRequestConfig
  ): Promise<T> {
    try {
      const response = await this.client.get<T>(url, {
        params,
        ...config,
      });
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  // POSTリクエスト
  async post<T>(
    url: string,
    data?: unknown,
    config?: AxiosRequestConfig
  ): Promise<T> {
    try {
      const response = await this.client.post<T>(url, data, config);
      console.log('API response:', { url, status: response.status, data: response.data });
      return response.data;
    } catch (error) {
      console.error('API error:', { url, error });
      throw this.handleError(error);
    }
  }

  // PUTリクエスト
  async put<T>(
    url: string,
    data?: unknown,
    config?: AxiosRequestConfig
  ): Promise<T> {
    try {
      const response = await this.client.put<T>(url, data, config);
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  // DELETEリクエスト
  async delete<T>(
    url: string,
    config?: AxiosRequestConfig
  ): Promise<T> {
    try {
      const response = await this.client.delete<T>(url, config);
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  // 汎用リクエストメソッド（responseTypeなどをサポート）
  async request<T = any>(
    url: string,
    config?: AxiosRequestConfig
  ): Promise<AxiosResponse<T>> {
    try {
      const response = await this.client.request<T>({
        url,
        ...config,
      });
      return response;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  // エラーハンドリング
  private handleError(error: unknown): ApiError {
    if (axios.isAxiosError(error)) {
      const responseData = error.response?.data;
      
      // APIからのエラーレスポンス
      if (responseData && typeof responseData === 'object' && 'error' in responseData) {
        return {
          error: responseData.error as string,
          details: responseData.details,
        };
      }
      
      // HTTPステータスに基づくエラー
      if (error.response) {
        switch (error.response.status) {
          case 400:
            return { error: 'リクエストが正しくありません' };
          case 401:
            return { error: '認証が必要です' };
          case 403:
            return { error: 'アクセスが拒否されました' };
          case 404:
            return { error: 'リソースが見つかりません' };
          case 409:
            return { error: '競合が発生しました' };
          case 500:
            return { error: 'サーバーエラーが発生しました' };
          default:
            return { error: `HTTPエラー: ${error.response.status}` };
        }
      }
      
      // ネットワークエラー
      if (error.code === 'ECONNABORTED') {
        return { error: 'リクエストがタイムアウトしました' };
      }
      
      if (error.code === 'ERR_NETWORK') {
        return { error: 'ネットワークエラーが発生しました' };
      }
    }
    
    // その他のエラー
    return {
      error: error instanceof Error ? error.message : '不明なエラーが発生しました',
    };
  }
}