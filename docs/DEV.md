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
- Biome
- Prettier
- Vitest
- Testing Library

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
```

### 2. 環境変数の設定

各アプリケーションで必要な環境変数を設定してください。

#### apps/api

```bash
cd apps/api
cp .env.example .env
# DATABASE_URL, JWT_SECRET などを設定
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
npx prisma migrate dev
npx prisma db seed
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
- **環境変数**: DATABASE_URL, JWT_SECRET

### apps/web

- **プラットフォーム**: Vercel
- **環境変数**: NEXT_PUBLIC_API_URL

### apps/native

- **ビルド**: EAS Build (Expo Application Services)
- **配布**: App Store / Google Play Store
