# RSS Reader API

RSS Readerアプリケーションのバックエンド API サーバーです。

## 技術スタック

- **Runtime**: Node.js
- **Framework**: Express
- **言語**: TypeScript
- **ORM**: Prisma
- **データベース**: PostgreSQL
- **バリデーション**: Zod
- **認証**: JWT + bcryptjs
- **Linting/Formatting**: Biome
- **テスト**: Vitest
- **開発**: tsx (TypeScript実行)

## 主要機能

- ユーザー認証（登録/ログイン/パスワードリセット）
- フィード管理（CRUD操作）
- RSS フィード取得・パース
- 記事データ管理
- 検索機能
- OPML インポート/エクスポート

## セットアップ

### 依存関係のインストール

```bash
# ルートディレクトリから
npm install
```

### 環境変数の設定

```bash
cp .env.example .env
```

`.env` ファイルを編集して必要な環境変数を設定してください：

```env
DATABASE_URL="postgresql://user:password@localhost:5432/rss_reader"
JWT_SECRET="your-jwt-secret"
PORT=3001
```

### データベースのセットアップ

```bash
# Prisma マイグレーション
npx prisma migrate dev

# シードデータの投入（オプション）
npx prisma db seed
```

## 開発

### 開発サーバーの起動

```bash
npm run dev
```

サーバーは `http://localhost:3001` で起動します。

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