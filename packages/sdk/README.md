# RSS Reader SDK

RSS Reader アプリケーション用の API クライアント SDK です。Web アプリケーションと Native アプリケーションの両方で使用できます。

## 技術スタック

- **言語**: TypeScript
- **HTTP クライアント**: Axios
- **バリデーション**: Zod
- **Linting/Formatting**: Biome
- **テスト**: Vitest

## 機能

- 型安全な API クライアント
- 自動リクエスト/レスポンス バリデーション
- エラーハンドリング
- 認証トークン管理
- リクエスト/レスポンス インターセプター
- TypeScript 完全対応

## インストール

```bash
npm install @rss-reader/sdk
```

## 使用方法

### 基本的な使用法

```typescript
import { RSSReaderSDK } from '@rss-reader/sdk';

// SDK インスタンスの作成
const sdk = new RSSReaderSDK({
  baseURL: 'http://localhost:3001',
  timeout: 5000,
});

// 認証
const authResult = await sdk.auth.login({
  email: 'user@example.com',
  password: 'password123',
});

// 認証トークンの設定
sdk.setAuthToken(authResult.token);

// フィード一覧の取得
const feeds = await sdk.feeds.getAll();

// フィードの追加
const newFeed = await sdk.feeds.create({
  url: 'https://example.com/rss.xml',
  title: 'Example Feed',
});
```

### 認証 API

```typescript
// ユーザー登録
const registerResult = await sdk.auth.register({
  email: 'user@example.com',
  password: 'password123',
});

// ログイン
const loginResult = await sdk.auth.login({
  email: 'user@example.com',
  password: 'password123',
});

// ログアウト
await sdk.auth.logout();

// パスワードリセット
await sdk.auth.resetPassword({
  email: 'user@example.com',
});

// トークン更新
const refreshResult = await sdk.auth.refreshToken();
```

### フィード API

```typescript
// フィード一覧取得
const feeds = await sdk.feeds.getAll();

// フィード詳細取得
const feed = await sdk.feeds.getById('feed-id');

// フィード追加
const newFeed = await sdk.feeds.create({
  url: 'https://example.com/rss.xml',
  title: 'Example Feed',
});

// フィード更新
const updatedFeed = await sdk.feeds.update('feed-id', {
  title: 'Updated Title',
});

// フィード削除
await sdk.feeds.delete('feed-id');

// 全フィード更新
await sdk.feeds.refreshAll();
```

### 記事 API

```typescript
// 記事一覧取得
const articles = await sdk.articles.getAll({
  page: 1,
  limit: 20,
  feedId: 'feed-id', // オプション
});

// 記事検索
const searchResults = await sdk.articles.search({
  query: 'search term',
  page: 1,
  limit: 20,
});

// 特定フィードの記事取得
const feedArticles = await sdk.feeds.getArticles('feed-id', {
  page: 1,
  limit: 20,
});
```

### ユーザー API

```typescript
// プロフィール取得
const profile = await sdk.user.getProfile();

// プロフィール更新
const updatedProfile = await sdk.user.updateProfile({
  name: 'New Name',
});

// パスワード変更
await sdk.user.changePassword({
  currentPassword: 'current',
  newPassword: 'new',
});

// アカウント削除
await sdk.user.deleteAccount();
```

### OPML API

```typescript
// OPML エクスポート
const opmlData = await sdk.opml.export();

// OPML インポート
const importResult = await sdk.opml.import(opmlFile);
```

## 設定オプション

```typescript
const sdk = new RSSReaderSDK({
  baseURL: 'https://api.example.com',
  timeout: 10000,
  retries: 3,
  retryDelay: 1000,
  headers: {
    'Custom-Header': 'value',
  },
});
```

## エラーハンドリング

```typescript
import { APIError, ValidationError, NetworkError } from '@rss-reader/sdk';

try {
  const result = await sdk.feeds.getAll();
} catch (error) {
  if (error instanceof APIError) {
    console.error('API Error:', error.message, error.statusCode);
  } else if (error instanceof ValidationError) {
    console.error('Validation Error:', error.errors);
  } else if (error instanceof NetworkError) {
    console.error('Network Error:', error.message);
  }
}
```

## インターセプター

```typescript
// リクエストインターセプター
sdk.addRequestInterceptor((config) => {
  console.log('Request:', config);
  return config;
});

// レスポンスインターセプター
sdk.addResponseInterceptor(
  (response) => {
    console.log('Response:', response);
    return response;
  },
  (error) => {
    console.error('Response Error:', error);
    return Promise.reject(error);
  }
);
```

## 型定義

すべての API レスポンスとリクエストは TypeScript で型定義されています。

```typescript
import type {
  User,
  Feed,
  Article,
  LoginRequest,
  RegisterRequest,
  CreateFeedRequest,
} from '@rss-reader/sdk';
```

## 開発

### ビルド

```bash
npm run build
```

### テスト

```bash
npm run test
```

### 型チェック

```bash
npm run type-check
```

## プロジェクト構造

```
src/
├── client/           # メインクライアントクラス
├── services/         # API サービス群
│   ├── auth.ts      # 認証サービス
│   ├── feeds.ts     # フィードサービス
│   ├── articles.ts  # 記事サービス
│   ├── user.ts      # ユーザーサービス
│   └── opml.ts      # OPML サービス
├── types/           # TypeScript 型定義
├── schemas/         # Zod バリデーションスキーマ
├── errors/          # カスタムエラークラス
├── utils/           # ユーティリティ関数
└── index.ts         # エントリーポイント
```

## 貢献

このパッケージは RSS Reader モノレポの一部です。バグ報告や機能要望は Issue でお知らせください。