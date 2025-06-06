import { createRSSReaderSDK } from '@rss-reader/sdk';

// SDKインスタンスを作成
export const sdk = createRSSReaderSDK({
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001',
  timeout: 10000,
});

// ローカルストレージのキー
export const TOKEN_STORAGE_KEY = 'rss-reader-token';

// トークンをローカルストレージから読み込み
if (typeof window !== 'undefined') {
  const savedToken = localStorage.getItem(TOKEN_STORAGE_KEY);
  if (savedToken) {
    sdk.setToken(savedToken);
  }
}

// トークンを保存するヘルパー関数
export const saveToken = (token: string) => {
  if (typeof window !== 'undefined') {
    localStorage.setItem(TOKEN_STORAGE_KEY, token);
    sdk.setToken(token);
  }
};

// トークンをクリアするヘルパー関数
export const clearToken = () => {
  if (typeof window !== 'undefined') {
    localStorage.removeItem(TOKEN_STORAGE_KEY);
    sdk.clearToken();
  }
};