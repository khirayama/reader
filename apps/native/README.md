# RSS Reader Native

RSS Readerアプリケーションのネイティブモバイルアプリです。

## 技術スタック

- **Framework**: React Native + Expo
- **言語**: TypeScript
- **UI ライブラリ**: React Native
- **国際化**: i18next + react-native-localize
- **フォーム**: React Hook Form + Zod
- **HTTP クライアント**: Axios
- **SDK**: @rss-reader/sdk
- **Linting/Formatting**: Biome
- **テスト**: Vitest + Testing Library for React Native

## 主要機能

- ユーザー認証（登録/ログイン/パスワードリセット）
- フィード管理（登録/削除/更新）
- 記事一覧表示・検索
- ネイティブナビゲーション
- プッシュ通知（将来実装予定）
- オフライン対応（将来実装予定）
- 多言語対応（日本語/英語）

## セットアップ

### 依存関係のインストール

```bash
# ルートディレクトリから
npm install
```

### Expo CLI のインストール

```bash
npm install -g @expo/cli
```

### 環境変数の設定

```bash
cp .env.example .env
```

`.env` ファイルを編集して API のベース URL を設定：

```env
EXPO_PUBLIC_API_URL=http://localhost:3001
```

## 開発

### 開発サーバーの起動

```bash
npm run dev
# または
npm start
```

### プラットフォーム別の起動

```bash
# iOS シミュレーター
npm run ios

# Android エミュレーター
npm run android

# ウェブブラウザ
npm run web
```

### その他のコマンド

```bash
# ビルド
npm run build

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

# キャッシュクリア
npm run clean
```

## アプリ構成

### 画面構成
- **認証画面**
  - ウェルカム画面
  - ユーザー登録
  - ログイン
  - パスワードリセット

- **メイン画面**
  - フィード一覧
  - 記事一覧
  - 記事詳細
  - フィード追加

- **設定画面**
  - アカウント設定
  - アプリ設定
  - テーマ設定

### ナビゲーション
- **Stack Navigator**: 認証フロー
- **Tab Navigator**: メインアプリ
- **Modal**: フィード追加・設定

## プロジェクト構造

```
src/
├── screens/          # 画面コンポーネント
│   ├── auth/        # 認証関連画面
│   ├── feeds/       # フィード関連画面
│   └── settings/    # 設定画面
├── components/       # 再利用可能コンポーネント
│   ├── ui/          # UI プリミティブ
│   ├── forms/       # フォームコンポーネント
│   └── layout/      # レイアウトコンポーネント
├── navigation/       # ナビゲーション設定
├── hooks/           # カスタムフック
├── stores/          # 状態管理
├── services/        # API サービス
├── utils/           # ユーティリティ
├── types/           # TypeScript 型定義
└── constants/       # 定数定義
```

## デザインガイドライン

### UI/UX
- **デザイン**: ネイティブプラットフォームに準拠
- **アクセシビリティ**: スクリーンリーダー対応
- **タッチターゲット**: 最小44pt/dp
- **レスポンシブ**: 各種画面サイズ対応

### プラットフォーム固有
- **iOS**: Human Interface Guidelines 準拠
- **Android**: Material Design 準拠

## 国際化

デバイスの言語設定に基づいて自動的に言語を選択します。

```typescript
// 言語設定の取得
import { getLocales } from 'react-native-localize';
import { useTranslation } from 'react-i18next';

const deviceLocale = getLocales()[0].languageCode;
const { t } = useTranslation();
```

## ビルド・デプロイ

### 開発ビルド

```bash
# iOS
expo build:ios --type simulator

# Android
expo build:android --type apk
```

### 本番ビルド

```bash
# iOS (App Store)
expo build:ios --type archive

# Android (Google Play)
expo build:android --type app-bundle
```

### EAS Build（推奨）

```bash
# EAS CLI インストール
npm install -g eas-cli

# EAS プロジェクト設定
eas build:configure

# ビルド実行
eas build --platform all
```

## 環境設定

### iOS 開発
- Xcode 最新版
- iOS Simulator

### Android 開発
- Android Studio
- Android SDK
- Android Emulator

## テスト

```bash
# 単体テスト
npm run test

# E2E テスト（将来実装予定）
npm run test:e2e
```

## パフォーマンス最適化

- **Bundle 分割**: Dynamic imports 使用
- **画像最適化**: Expo Image 使用
- **メモリ管理**: FlatList での仮想化
- **キャッシュ**: React Query / SWR 使用予定

## 開発ガイドライン

- TypeScript strict モード使用
- React Native best practices 準拠
- @rss-reader/sdk を使用した API 通信
- プラットフォーム固有のコード分離
- アクセシビリティ対応必須