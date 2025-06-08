import { createRSSReaderSDK } from '@rss-reader/sdk';
import AsyncStorage from '@react-native-async-storage/async-storage';

const API_URL = __DEV__ ? 'http://localhost:3001' : 'https://your-api-domain.vercel.app';

// ローカルストレージのキー
export const TOKEN_STORAGE_KEY = 'rss-reader-token';

// SDKインスタンスを作成
export const sdk = createRSSReaderSDK({
  baseURL: API_URL,
  timeout: 5 * 60 * 1000, // 5分（OPML処理対応）
});

// トークンをAsyncStorageから読み込み
const loadSavedToken = async () => {
  try {
    const savedToken = await AsyncStorage.getItem(TOKEN_STORAGE_KEY);
    if (savedToken) {
      sdk.setToken(savedToken);
    }
  } catch (error) {
    console.error('Failed to load saved token:', error);
  }
};

// アプリ起動時にトークンを読み込み
loadSavedToken();

// トークンを保存するヘルパー関数
export const saveToken = async (token: string) => {
  try {
    await AsyncStorage.setItem(TOKEN_STORAGE_KEY, token);
    sdk.setToken(token);
  } catch (error) {
    console.error('Failed to save token:', error);
  }
};

// トークンをクリアするヘルパー関数
export const clearToken = async () => {
  try {
    await AsyncStorage.removeItem(TOKEN_STORAGE_KEY);
    sdk.clearToken();
  } catch (error) {
    console.error('Failed to clear token:', error);
  }
};