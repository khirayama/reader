## ディレクトリ構成

```
.
├── apps/
│   ├── api/              # Node.js/Express API サーバー
│   ├── web/              # Next.js ウェブアプリケーション
│   └── native/           # React Native/Expo モバイルアプリ
├── packages/             # 共有パッケージ（未実装）
├── docs/                 # ドキュメント
├── biome.json           # Biome 設定
├── .prettierrc          # Prettier 設定
├── tsconfig.json        # TypeScript 設定
├── turbo.json           # Turborepo 設定
└── package.json         # ルート package.json (ワークスペース)
```

## 利用技術

### apps/api

- Node.js
- TypeScript
- Express
- Prisma
- PostgreSQL
- Zod
- JWT (jsonwebtoken)
- bcryptjs
- express-rate-limit
- express-validator
- helmet
- cors
- Biome
- Prettier
- Vitest
- Supertest

### apps/web

- React
- TypeScript
- Next.js
- Tailwind CSS
- i18next
- Biome
- Prettier
- Vitest
- Testing Library

### apps/native

- React Native
- TypeScript
- Expo
- i18next
- Biome
- Prettier
- Vitest

### packages/sdk（未実装）

現在、SDKは各アプリケーション内（apps/web/src/lib/sdk.ts、apps/native/src/lib/sdk.ts）で個別実装されています。
- TypeScript
- axios
- Zod（バリデーションはAPIサーバー側で実装済み）
- 共有SDK化は将来の改善課題


## セットアップ手順

### 1. 依存関係のインストール

```bash
npm install
cd apps/api && npm install
cd ../web && npm install
cd ../native && npm install
```

### 1.1. アプリケーション依存関係

各アプリケーションは独立しており、packages/sdkは存在しません：

```bash
# 各アプリケーションで個別にSDKを実装
# apps/web/src/lib/sdk.ts
# apps/native/src/lib/sdk.ts
```

### 2. 環境変数の設定

各アプリケーションで必要な環境変数を設定してください。

#### apps/api

```bash
cd apps/api
cp .env.example .env
# 以下の環境変数を設定:
# DATABASE_URL - PostgreSQL データベース接続URL
# JWT_SECRET - JWT トークン生成用の秘密鍵 (本番環境では強力なキーを使用)
# PORT - サーバーポート (デフォルト: 3001)
# NODE_ENV - 環境 (development/production/test)
# WEB_URL - フロントエンドアプリのURL (CORS用)
# ALLOWED_ORIGINS - 許可するオリジンのカンマ区切りリスト (CORS用)
```

#### apps/web

```bash
cd apps/web
cp .env.local.example .env.local
# NEXT_PUBLIC_API_URL を設定
```

### 3. データベースのセットアップ (API)

```bash
cd apps/api

# Prisma クライアントの生成
npx prisma generate

# データベースマイグレーションの実行
npx prisma migrate dev

# 初期データの投入 (将来実装)
# npx prisma db seed
```

### 4. テストの実行

```bash
# 全体テスト
npm run test

# API のみテスト
cd apps/api
npm run test

# テストカバレッジ
cd apps/api
npm run test:coverage
```

## 開発コマンド

### 全体コマンド (ルートディレクトリから実行)

```bash
# 全アプリケーションの開発サーバー起動
npm run dev

# 全アプリケーションのビルド
npm run build

# 全アプリケーションのテスト実行
npm run test

# 全アプリケーションの Lint
npm run lint

# 全アプリケーションのフォーマット
npm run format

# 型チェック
npm run type-check
```

### 個別アプリケーションの開発

```bash
# API サーバー (ポート: 3001)
cd apps/api
npm run dev

# Web アプリケーション (ポート: 3000)
cd apps/web
npm run dev

# Native アプリケーション
cd apps/native
npm run dev

# SDK は各アプリケーション内で実装されているため、個別のSDK開発は不要
```

## デプロイメント(本番環境)

### apps/api

- **プラットフォーム**: Vercel
- **データベース**: Supabase PostgreSQL
- **環境変数**: 
  - DATABASE_URL (Supabase PostgreSQL URL)
  - JWT_SECRET (強力な秘密鍵)
  - WEB_URL (フロントエンドURL)
  - ALLOWED_ORIGINS (許可するドメインリスト)
  - ADMIN_API_TOKEN (管理API用トークン)

### apps/web

- **プラットフォーム**: Vercel
- **環境変数**: 
  - NEXT_PUBLIC_API_URL (APIサーバーURL)
  - CRON_SECRET (Vercel Cron Job認証用)
  - ADMIN_API_TOKEN (管理API用トークン)

### apps/native

- **ビルド**: EAS Build (Expo Application Services)
- **配布**: App Store / Google Play Store

## API 仕様

### 認証システム

RSS Reader API は JWT ベースの認証システムを実装しています。

#### 認証エンドポイント

| メソッド | エンドポイント | 説明 | 認証 |
|---------|---------------|------|------|
| POST | `/api/auth/register` | ユーザー登録 | 不要 |
| POST | `/api/auth/login` | ログイン | 不要 |
| POST | `/api/auth/forgot-password` | パスワードリセット要求 | 不要 |
| POST | `/api/auth/reset-password` | パスワードリセット実行 | 不要 |
| GET | `/api/auth/profile` | ユーザー情報取得 | 必要 |
| PUT | `/api/auth/password` | パスワード変更 | 必要 |
| PUT | `/api/auth/email` | メールアドレス変更 | 必要 |
| PUT | `/api/auth/settings` | ユーザー設定更新 | 必要 |
| DELETE | `/api/auth/account` | アカウント削除 | 必要 |

#### 管理APIエンドポイント

| メソッド | エンドポイント | 説明 | 認証 |
|---------|---------------|------|------|
| POST | `/api/admin/refresh-all-feeds` | 全フィード更新 | Bearer Token |
| GET | `/api/admin/cron-logs` | Cronログ取得 | Bearer Token |

#### 認証ヘッダー

認証が必要なエンドポイントにはJWTトークンを含める必要があります：

```bash
# 一般API認証
Authorization: Bearer <JWT_TOKEN>

# 管理API認証
Authorization: Bearer <ADMIN_API_TOKEN>
```

#### パスワード要件

- 最小8文字
- 大文字・小文字・数字を含む
- 最大128文字

#### レート制限

- **一般API**: 15分間に100リクエスト
- **ログイン**: 15分間に10回まで
- **登録**: 1時間に5回まで
- **パスワードリセット**: 1時間に3回まで

### データベーススキーマ

#### User テーブル

```prisma
model User {
  id        String   @id @default(cuid())
  email     String   @unique
  password  String
  theme     Theme    @default(SYSTEM)
  language  Language @default(JA)
  createdAt DateTime @default(now()) @map("created_at")
  updatedAt DateTime @updatedAt @map("updated_at")
  
  // Relations
  feeds              Feed[]
  passwordResetTokens PasswordResetToken[]
  articleReadStatus  ArticleReadStatus[]
  articleBookmarks   ArticleBookmark[]

  @@map("users")
}
```

#### Feed テーブル

```prisma
model Feed {
  id            String    @id @default(cuid())
  title         String
  url           String
  siteUrl       String?   @map("site_url")
  description   String?
  favicon       String?
  userId        String    @map("user_id")
  lastFetchedAt DateTime? @map("last_fetched_at")
  createdAt     DateTime  @default(now()) @map("created_at")
  updatedAt     DateTime  @updatedAt @map("updated_at")

  // Relations
  user     User      @relation(fields: [userId], references: [id], onDelete: Cascade)
  articles Article[]

  @@unique([userId, url])
  @@map("feeds")
}
```

#### Article テーブル

```prisma
model Article {
  id          String   @id @default(cuid())
  title       String
  url         String   @unique
  description String?
  publishedAt DateTime @map("published_at")
  feedId      String   @map("feed_id")
  createdAt   DateTime @default(now()) @map("created_at")
  updatedAt   DateTime @updatedAt @map("updated_at")

  // Relations
  feed Feed @relation(fields: [feedId], references: [id], onDelete: Cascade)
  readStatus ArticleReadStatus[]
  bookmarks  ArticleBookmark[]

  @@map("articles")
}
```

#### ArticleReadStatus テーブル

```prisma
model ArticleReadStatus {
  id        String   @id @default(cuid())
  userId    String   @map("user_id")
  articleId String   @map("article_id")
  isRead    Boolean  @default(false) @map("is_read")
  readAt    DateTime? @map("read_at")
  createdAt DateTime @default(now()) @map("created_at")
  updatedAt DateTime @updatedAt @map("updated_at")

  // Relations
  user    User    @relation(fields: [userId], references: [id], onDelete: Cascade)
  article Article @relation(fields: [articleId], references: [id], onDelete: Cascade)

  @@unique([userId, articleId])
  @@map("article_read_status")
}
```

#### ArticleBookmark テーブル

```prisma
model ArticleBookmark {
  id        String   @id @default(cuid())
  userId    String   @map("user_id")
  articleId String   @map("article_id")
  createdAt DateTime @default(now()) @map("created_at")

  // Relations
  user    User    @relation(fields: [userId], references: [id], onDelete: Cascade)
  article Article @relation(fields: [articleId], references: [id], onDelete: Cascade)

  @@unique([userId, articleId])
  @@map("article_bookmarks")
}
```

#### PasswordResetToken テーブル

```prisma
model PasswordResetToken {
  id        String   @id @default(cuid())
  token     String   @unique
  userId    String   @map("user_id")
  expiresAt DateTime @map("expires_at")
  createdAt DateTime @default(now()) @map("created_at")
  used      Boolean  @default(false)

  // Relations
  user User @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@map("password_reset_tokens")
}
```

#### CronLog テーブル

```prisma
model CronLog {
  id           String   @id @default(cuid())
  jobName      String   @map("job_name")
  status       String   // 'success', 'partial', 'failed'
  totalFeeds   Int      @map("total_feeds")
  successCount Int      @map("success_count")
  errorCount   Int      @map("error_count")
  errors       String?  // JSON string of error details
  executedAt   DateTime @map("executed_at")
  createdAt    DateTime @default(now()) @map("created_at")

  @@index([jobName, executedAt])
  @@map("cron_logs")
}

enum Theme {
  SYSTEM
  LIGHT
  DARK
}

enum Language {
  JA
  EN
}
```

### セキュリティ機能

- **JWT トークン**: 24時間有効期限
- **パスワードハッシュ化**: bcryptjs (saltRounds: 12)
- **CORS 設定**: 許可ドメインリスト管理
- **セキュリティヘッダー**: helmet + カスタムヘッダー
- **レート制限**: エンドポイント別の制限
- **入力バリデーション**: Zod スキーマ
- **リクエストサイズ制限**: 1MB まで
- **管理API認証**: Bearer トークンによる認証

### Cron Job機能

- **Vercel Cron Job**: `/api/cron/refresh-feeds` エンドポイント
- **実行頻度**: 毎日午前0時（UTC）
- **管理API**: `/api/admin/refresh-all-feeds` で手動実行可能
- **ログ管理**: CronLogテーブルで実行履歴を記録

#### Vercel Cron Job設定

`apps/web/vercel.json` で定義：

```json
{
  "crons": [
    {
      "path": "/api/cron/refresh-feeds",
      "schedule": "0 0 * * *"
    }
  ]
}
```

#### 必要な環境変数

```bash
# Vercel Cron Job認証（apps/web/.env）
CRON_SECRET="your-cron-secret"

# 管理API認証（両方のアプリで同じ値を設定）
# apps/api/.env
ADMIN_API_TOKEN="your-admin-api-token"
# apps/web/.env
ADMIN_API_TOKEN="your-admin-api-token"
```

| メソッド | エンドポイント | 説明 | 認証 |
|---------|---------------|------|------|
| POST | `/api/admin/refresh-all-feeds` | 全フィード手動更新 | Bearer Token |
| GET | `/api/admin/cron-logs` | Cron実行ログ取得 | Bearer Token |

認証ヘッダー：
```bash
Authorization: Bearer <ADMIN_API_TOKEN>
```

#### ログ管理

CronLogテーブルで実行履歴を記録：
- jobName: ジョブ名
- status: 'success' | 'partial' | 'failed'
- totalFeeds: 処理対象フィード数
- successCount: 成功数
- errorCount: エラー数
- errors: エラー詳細（JSON）
- executedAt: 実行日時

### テスト

- **ユニットテスト**: Vitest + Supertest
- **テスト用DB**: SQLite (メモリ)
- **カバレッジ**: 認証機能 100% カバー
- **CI/CD**: 自動テスト実行

```bash
# テスト実行
cd apps/api
npm run test

# カバレッジ付きテスト
npm run test:coverage
```
