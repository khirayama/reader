## ディレクトリ構成

```
.
├── apps/
│   ├── api/              # Node.js/Express API サーバー
│   ├── web/              # Next.js ウェブアプリケーション
│   └── native/           # React Native/Expo モバイルアプリ
├── packages/
│   └── sdk/              # TypeScript SDK
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

### packages/sdk

- TypeScript
- axios
- Zod
- Biome
- Prettier
- Vitest


## セットアップ手順

### 1. 依存関係のインストール

```bash
npm install
cd apps/api && npm install
cd ../web && npm install
cd ../native && npm install
cd ../../packages/sdk && npm install
```

### 1.1. SDKビルド（重要）

Webアプリをビルドする前に、SDKパッケージをビルドする必要があります：

```bash
cd packages/sdk
npm run build
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

# SDK の開発 (watch モード)
cd packages/sdk
npm run dev
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

### apps/web

- **プラットフォーム**: Vercel
- **環境変数**: NEXT_PUBLIC_API_URL

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

#### 認証ヘッダー

認証が必要なエンドポイントにはJWTトークンを含める必要があります：

```bash
Authorization: Bearer <JWT_TOKEN>
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
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  
  feeds              Feed[]
  passwordResetTokens PasswordResetToken[]
}
```

#### PasswordResetToken テーブル

```prisma
model PasswordResetToken {
  id        String   @id @default(cuid())
  token     String   @unique
  userId    String
  expiresAt DateTime
  createdAt DateTime @default(now())
  used      Boolean  @default(false)
  
  user User @relation(fields: [userId], references: [id], onDelete: Cascade)
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
