# RSS Reader API

Node.js/Express/PostgreSQL/Prisma を使用したRSS Reader APIサーバー

## 技術スタック

- **Runtime**: Node.js
- **Framework**: Express
- **言語**: TypeScript
- **ORM**: Prisma
- **データベース**: PostgreSQL (Docker)
- **バリデーション**: Zod
- **認証**: JWT + bcryptjs
- **Linting/Formatting**: Biome
- **テスト**: Vitest + SQLite
- **開発**: tsx (TypeScript実行)

## 🚀 クイックスタート

```bash
# 依存関係のインストール
npm install

# 開発サーバー起動（PostgreSQL + API）
npm run dev
```

**`npm run dev`で自動的に実行される処理:**
1. PostgreSQLコンテナの起動
2. データベースの初期化・マイグレーション
3. APIサーバーの起動

## 主要機能

- ユーザー認証（登録/ログイン/パスワードリセット）
- フィード管理（CRUD操作）
- RSS フィード取得・パース
- 記事データ管理（既読/未読、ブックマーク）
- 記事検索機能
- OPML インポート/エクスポート
- タグ機能（フィード分類）
- 自動フィード更新（Cron Job）

## 📋 利用可能なコマンド

### 開発用コマンド
```bash
npm run dev              # PostgreSQL + APIサーバー起動（推奨）
npm run dev:server       # APIサーバーのみ起動
```

### データベース管理
```bash
npm run db:setup         # データベース初期化・マイグレーション
npm run db:start         # PostgreSQLコンテナ起動
npm run db:stop          # PostgreSQLコンテナ停止
npm run db:reset         # データベース完全リセット
npm run db:logs          # PostgreSQLログ表示
```

## 🐳 Docker Compose構成

- **PostgreSQL 15**: ポート5432
- **永続化**: Dockerボリューム使用
- **初期データベース**: `rss_reader`
- **認証**: `postgres:password`

## 🔧 環境変数設定

`.env`ファイルで以下を設定（Docker用に自動調整済み）:

```env
DATABASE_URL="postgresql://postgres:password@localhost:5432/rss_reader?schema=public"
JWT_SECRET="your-super-secret-jwt-key"
PORT=3001
NODE_ENV="development"
```

### その他のコマンド

```bash
# ビルド
npm run build

# 本番環境での起動
npm run start

# テスト実行
npm run test

# テストカバレッジ
npm run test:coverage

# 型チェック
npm run type-check

# Lint
npm run lint

# フォーマット
npm run format

# クリーンアップ
npm run clean
```

## API エンドポイント

### 認証
- `POST /auth/register` - ユーザー登録
- `POST /auth/login` - ログイン
- `POST /auth/logout` - ログアウト
- `POST /auth/refresh` - トークン更新
- `POST /auth/reset-password` - パスワードリセット

### フィード
- `GET /feeds` - フィード一覧取得
- `POST /feeds` - フィード追加
- `GET /feeds/:id` - フィード詳細取得
- `PUT /feeds/:id` - フィード更新
- `DELETE /feeds/:id` - フィード削除
- `POST /feeds/refresh` - 全フィード更新

### 記事
- `GET /articles` - 記事一覧取得
- `GET /articles/search` - 記事検索
- `GET /feeds/:id/articles` - 特定フィードの記事取得

### OPML
- `POST /opml/import` - OPML インポート
- `GET /opml/export` - OPML エクスポート

### ユーザー
- `GET /user/profile` - プロフィール取得
- `PUT /user/profile` - プロフィール更新
- `PUT /user/password` - パスワード変更
- `DELETE /user/account` - アカウント削除

## デプロイ

### Vercel

```bash
# Vercel CLI のインストール
npm i -g vercel

# デプロイ
vercel
```

### 環境変数

Vercel の環境変数に以下を設定：
- `DATABASE_URL`
- `JWT_SECRET`

## ディレクトリ構成

```
src/
├── controllers/     # リクエストハンドラ
├── middleware/      # Express ミドルウェア
├── models/         # Prisma モデル定義
├── routes/         # ルート定義
├── services/       # ビジネスロジック
├── utils/          # ユーティリティ関数
├── types/          # TypeScript 型定義
└── index.ts        # エントリーポイント
```