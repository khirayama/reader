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

### 前提条件

- Node.js 18以上
- PostgreSQL データベース（ローカル環境またはリモート）
- Git

### 1. リポジトリのクローンと基本セットアップ

```bash
# リポジトリのクローン
git clone <repository-url>
cd reader

# ルートレベルの依存関係をインストール
npm install
```

### 2. 各アプリケーションの依存関係インストール

各アプリケーションは独立しており、個別にnpm installが必要です：

```bash
# API サーバー
cd apps/api && npm install

# Web アプリケーション
cd ../web && npm install

# Native アプリケーション
cd ../native && npm install
```

**注意**: packages/sdkは存在せず、各アプリケーション内で個別にSDKを実装しています：
- apps/web/src/lib/sdk.ts
- apps/native/src/lib/sdk.ts

### 3. 環境変数の設定

#### 3.1. API サーバー（apps/api）

```bash
cd apps/api
cp .env.example .env
```

`.env` ファイルを編集して以下の環境変数を設定：

```bash
# データベース接続（PostgreSQLが必要）
DATABASE_URL="postgresql://user:password@localhost:5432/rss_reader"

# JWT認証（本番環境では強力な秘密鍵を使用）
JWT_SECRET="your-super-secret-jwt-key-change-this-in-production"

# サーバー設定
PORT=3001
NODE_ENV="development"

# CORS設定（開発環境用に最適化済み）
WEB_URL="http://localhost:3000"
ADMIN_URL="http://localhost:3000"
ALLOWED_ORIGINS="http://localhost:3000,http://localhost:19006"

# 管理API（オプション、Cron Job等で使用）
ADMIN_API_TOKEN="your-admin-api-token-change-this-in-production"

# 本番環境用設定（コメントアウト済み）
# WEB_URL="https://your-app.vercel.app"
# ADMIN_URL="https://admin.your-app.com"
# ALLOWED_ORIGINS="https://app1.com,https://app2.com"
```

#### 3.2. Web アプリケーション（apps/web）

```bash
cd apps/web
cp .env.local.example .env.local
```

`.env.local` ファイルを編集：

```bash
# API サーバーのURL
NEXT_PUBLIC_API_URL="http://localhost:3001"

# Vercel Cron Job用（本番環境のみ）
CRON_SECRET="your-cron-secret"
ADMIN_API_TOKEN="your-admin-api-token"
```

#### 3.3. Native アプリケーション（apps/native）

環境変数ファイルの設定は不要です。API URLは `src/lib/sdk.ts` で設定されています。

### 4. データベースのセットアップ

**重要**: PostgreSQLデータベースが事前に作成され、アクセス可能である必要があります。

```bash
cd apps/api

# Prisma クライアントの生成
npx prisma generate

# データベースマイグレーションの実行（初回セットアップ）
npx prisma migrate dev

# データベーススキーマの確認（オプション）
npx prisma studio
```

**データベース作成例（PostgreSQL）:**
```sql
-- PostgreSQL でデータベースを作成
CREATE DATABASE rss_reader;
CREATE USER rss_user WITH PASSWORD 'your_password';
GRANT ALL PRIVILEGES ON DATABASE rss_reader TO rss_user;
```

### 5. 開発サーバーの起動

#### 5.1. 全アプリケーション同時起動（推奨）

```bash
# ルートディレクトリから実行
npm run dev
```

これにより以下が並行して起動されます：
- **API サーバー**: http://localhost:3001
- **Web アプリ**: http://localhost:3000 （使用中の場合は自動で別ポートを選択）
- **Native アプリ**: http://localhost:8081

#### 5.2. 個別起動する場合

```bash
# API サーバー
cd apps/api && npm run dev

# Web アプリケーション
cd apps/web && npm run dev

# Native アプリケーション
cd apps/native && npm run dev
```

### 6. 動作確認

1. **Web アプリケーション**: http://localhost:3000 にアクセス
2. **新規アカウント作成**: 右上の「登録」ボタンから
3. **フィード追加**: RSS フィードURLを追加してテスト
4. **Native アプリ**: Expo Go アプリまたは開発ビルドで確認

### 7. テストの実行

```bash
# 全体テスト
npm run test

# API のみテスト
cd apps/api && npm run test

# テストカバレッジ
cd apps/api && npm run test:coverage
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

## Native アプリ開発

### 開発用ビルド

```bash
cd apps/native

# iOS シミュレーター
npx expo run:ios

# Android エミュレーター
npx expo run:android

# Expo Go での確認
npx expo start
```

### プロダクションビルド

```bash
# EAS Build のセットアップ
npx eas build:configure

# iOS ビルド
npx eas build --platform ios

# Android ビルド
npx eas build --platform android

# 両プラットフォーム同時ビルド
npx eas build --platform all
```

### EAS CLI のインストール

```bash
# グローバルインストール
npm install -g @expo/eas-cli

# ログイン（初回のみ）
eas login
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

## トラブルシューティング

### よくある問題と解決方法

#### 1. データベース接続エラー

**症状**: `Error: Can't reach database server`

**解決方法**:
```bash
# PostgreSQL が起動しているか確認
brew services list | grep postgresql
# または
sudo systemctl status postgresql

# PostgreSQL を起動
brew services start postgresql
# または
sudo systemctl start postgresql

# 接続テスト
psql -h localhost -U your_user -d rss_reader
```

#### 2. Prisma マイグレーションエラー

**症状**: `Migration failed to apply`

**解決方法**:
```bash
cd apps/api

# データベースをリセット（注意: 全データが削除されます）
npx prisma migrate reset

# または手動でマイグレーション
npx prisma db push
```

#### 3. パッケージインストールエラー

**症状**: `npm ERR! peer dep missing`

**解決方法**:
```bash
# node_modules を削除して再インストール
rm -rf node_modules package-lock.json
npm install

# 各アプリでも同様に実行
cd apps/api && rm -rf node_modules package-lock.json && npm install
cd ../web && rm -rf node_modules package-lock.json && npm install
cd ../native && rm -rf node_modules package-lock.json && npm install
```

#### 4. ポート衝突エラー

**症状**: `Port 3000 is already in use`

**解決方法**:
```bash
# 使用中のポートを確認
lsof -i :3000
lsof -i :3001

# プロセスを終了
kill -9 <PID>

# または別のポートを使用
PORT=3002 npm run dev
```

#### 5. Native アプリの接続エラー

**症状**: API サーバーに接続できない

**解決方法**:
- `apps/native/src/lib/sdk.ts` でAPI URLを確認
- 実機の場合は `localhost` ではなく実際のIPアドレスを使用
- ファイアウォール設定を確認

```bash
# ローカルIPアドレスを確認
ifconfig | grep "inet " | grep -v 127.0.0.1
```

### 環境変数チェックリスト

開発環境セットアップ時に確認すべき項目：

- [ ] PostgreSQL が起動している
- [ ] `apps/api/.env` が正しく設定されている
- [ ] `apps/web/.env.local` が正しく設定されている
- [ ] DATABASE_URL が正しいフォーマットである
- [ ] JWT_SECRET が設定されている
- [ ] 必要なポート（3000, 3001, 8081）が利用可能である
