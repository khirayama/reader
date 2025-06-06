# RSS Reader Web

RSS Readerアプリケーションのウェブフロントエンドです。

## 技術スタック

- **Framework**: Next.js 14
- **言語**: TypeScript
- **UI ライブラリ**: React 18
- **スタイリング**: Tailwind CSS
- **国際化**: i18next
- **フォーム**: React Hook Form + Zod
- **HTTP クライアント**: Axios
- **SDK**: @rss-reader/sdk
- **Linting/Formatting**: Biome
- **テスト**: Vitest + Testing Library

## 主要機能

- ユーザー認証（登録/ログイン/パスワードリセット）
- フィード管理（登録/削除/更新）
- 記事一覧表示・検索
- レスポンシブデザイン
- ダークモード対応
- 多言語対応（日本語/英語）
- OPML インポート/エクスポート

## セットアップ

### 依存関係のインストール

```bash
# ルートディレクトリから
npm install
```

### 環境変数の設定

```bash
cp .env.local.example .env.local
```

`.env.local` ファイルを編集して API のベース URL を設定：

```env
NEXT_PUBLIC_API_URL=http://localhost:3001
```

## 開発

### 開発サーバーの起動

```bash
npm run dev
```

アプリケーションは `http://localhost:3000` で起動します。

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

## ページ構成

### 認証ページ
- `/` - トップページ（ランディング）
- `/auth/register` - ユーザー登録
- `/auth/login` - ログイン
- `/auth/reset-password` - パスワードリセット

### アプリケーションページ
- `/feeds` - フィード一覧・記事表示（メイン画面）
- `/feeds/add` - フィード追加
- `/settings` - アカウント・設定

## コンポーネント構成

```
src/
├── app/              # Next.js App Router
│   ├── (auth)/      # 認証関連ページ
│   ├── feeds/       # フィード関連ページ
│   └── settings/    # 設定ページ
├── components/       # 再利用可能コンポーネント
│   ├── ui/          # UI プリミティブ
│   ├── forms/       # フォームコンポーネント
│   └── layout/      # レイアウトコンポーネント
├── hooks/           # カスタムフック
├── lib/             # ユーティリティ・設定
├── stores/          # 状態管理
├── types/           # TypeScript 型定義
└── styles/          # グローバルスタイル
```

## UI/UX 仕様

### デザインシステム
- **デザイン**: シンプル・フラットデザイン
- **レスポンシブ**: モバイルファースト
- **カラーテーマ**: システム/ライト/ダーク
- **フォント**: システムフォント

### レイアウト
- **フィードページ**: サイドバー（フィード一覧）+ メイン（記事一覧）
- **最大幅**: 情報量を最大化するため広幅レイアウト
- **アイコン**: Favicon/Icon 表示対応

### インタラクション
- **記事リンク**: 別タブで開く
- **検索**: リアルタイム検索（タイトル・説明文対象）
- **フィルタ**: フィード別フィルタリング

## 国際化

デフォルト言語は日本語で、英語にも対応しています。

```typescript
// 言語切り替え
import { useTranslation } from 'react-i18next';

const { t, i18n } = useTranslation();
i18n.changeLanguage('en'); // 英語に切り替え
```

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
- `NEXT_PUBLIC_API_URL`

## 開発ガイドライン

- コンポーネントは関数コンポーネント + TypeScript で記述
- Tailwind CSS を使用してスタイリング
- React Hook Form + Zod でフォームバリデーション
- @rss-reader/sdk を使用して API 通信
- テストは Vitest + Testing Library で記述