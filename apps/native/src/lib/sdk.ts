import { createRSSReaderSDK } from '@rss-reader/sdk';

const API_URL = __DEV__ ? 'http://localhost:3001' : 'https://your-api-domain.vercel.app';

export const sdk = createRSSReaderSDK({
  baseURL: API_URL,
  timeout: 5 * 60 * 1000, // 5分（OPML処理対応）
});