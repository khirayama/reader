import { createSDK } from '@rss-reader/sdk';

const API_URL = __DEV__ ? 'http://localhost:3001' : 'https://your-api-domain.vercel.app';

export const sdk = createSDK(API_URL);