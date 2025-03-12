# RSS Reader アプリケーションのデプロイ手順

このドキュメントでは、RSS Readerアプリケーションを[Vercel](https://vercel.com)にデプロイし、メール送信に[Resend](https://resend.com)を使用する方法を説明します。PostgreSQLデータベースは[Supabase](https://supabase.com)を利用します。

## 前提条件

デプロイ前に以下のアカウントが必要です：

- [Vercel](https://vercel.com) アカウント
- [Resend](https://resend.com) アカウント
- [Supabase](https://supabase.com) アカウント（PostgreSQLデータベース用）

## 環境変数の設定

アプリケーションの正常な動作には以下の環境変数が必要です：

| 環境変数 | 説明 | 例 |
|----------|------|-----|
| `DATABASE_URL` | Supabase PostgreSQLデータベースの接続文字列 | `postgresql://postgres:[YOUR-PASSWORD]@db.xxxxxxxxxxx.supabase.co:5432/postgres` |
| `NEXTAUTH_URL` | アプリケーションのURL | `https://your-app.vercel.app` |
| `NEXTAUTH_SECRET` | NextAuthセッションの暗号化キー（32文字以上） | ランダムな文字列 |
| `RESEND_API_KEY` | ResendのAPIキー | `re_123456789` |
| `EMAIL_FROM` | 送信元メールアドレス | `noreply@yourdomain.com` |
| `CRON_SECRET` | Cronジョブ用の認証シークレット | ランダムな文字列 |

## Vercelへのデプロイ手順

### 1. リポジトリの準備

GitHubにリポジトリをプッシュします：

```bash
git push origin main
```

### 2. Vercelでプロジェクトをインポート

1. [Vercel](https://vercel.com)にログインします
2. 「Add New...」 > 「Project」をクリックします
3. GitHubからリポジトリをインポートします
4. 以下の設定を行います：
   - Framework Preset: Next.js
   - Root Directory: ./
   - Build Command: デフォルト（`next build`）

### 3. 環境変数の設定

Vercelのプロジェクト設定で、以下の環境変数を追加します：

1. `DATABASE_URL` - Supabaseから取得したPostgreSQLデータベース接続文字列
2. `NEXTAUTH_URL` - デプロイ後のアプリケーションURL（例：`https://your-app.vercel.app`）
3. `NEXTAUTH_SECRET` - 安全なランダム文字列（32文字以上）
   ```bash
   # ランダム文字列の生成例
   openssl rand -base64 32
   ```
4. `RESEND_API_KEY` - ResendのAPIキー
5. `EMAIL_FROM` - システムメールの送信元アドレス
6. `CRON_SECRET` - Cronジョブ用の認証シークレット（ランダム文字列）
   ```bash
   # ランダム文字列の生成例
   openssl rand -base64 24
   ```

### 4. デプロイの実行

「Deploy」ボタンをクリックして、デプロイを開始します。デプロイが完了すると、アプリケーションのURLが表示されます。

## Supabaseの設定

### 1. Supabaseプロジェクトの作成

1. [Supabase](https://supabase.com)にサインアップまたはログインします
2. 「New Project」をクリックして新しいプロジェクトを作成します
3. プロジェクト名、パスワード、リージョンを設定します
4. 「Create new project」をクリックします

### 2. データベース接続文字列の取得

1. Supabaseダッシュボードで「Project Settings」 > 「Database」に移動します
2. 「Connection String」セクションで「URI」を選択します
3. 表示された接続文字列をコピーします。これが`DATABASE_URL`として使用するものです
4. 接続文字列の`[YOUR-PASSWORD]`部分を、プロジェクト作成時に設定したパスワードに置き換えます

### 3. データベースのマイグレーション

初回デプロイ後、データベースのマイグレーションを実行します：

```bash
# Vercel CLIをインストール
npm install -g vercel

# Vercelにログイン
vercel login

# 以下のコマンドでプロダクション環境でのマイグレーションを実行
vercel run npx prisma migrate deploy
```

## Resendの設定

### 1. Resendアカウントのセットアップ

1. [Resend](https://resend.com)にサインアップします
2. ドメインを検証します（または、resend.devドメインを利用）
3. APIキーを発行します

### 2. メール送信機能の実装

アプリケーションでメール送信機能を有効にするには、以下のファイルを編集します：

1. lib/email.ts ファイルを作成：

```tsx
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

export const sendPasswordResetEmail = async (
  email: string, 
  token: string
) => {
  const resetUrl = `${process.env.NEXTAUTH_URL}/auth/reset-password?token=${token}`;
  
  await resend.emails.send({
    from: process.env.EMAIL_FROM || 'onboarding@resend.dev',
    to: email,
    subject: 'Reset your password',
    html: `
      <h1>Reset your password</h1>
      <p>Click the link below to reset your password:</p>
      <a href="${resetUrl}">${resetUrl}</a>
      <p>This link will expire in 1 hour.</p>
    `,
  });
};
```

2. pages/api/auth/forgot-password.ts を更新し、コメントアウトされている部分を有効にします：

```tsx
// 既存のコメントアウトされた行を探す
// sendPasswordResetEmail(user.email, token);

// 上記を以下に置き換え
import { sendPasswordResetEmail } from '../../../lib/email';
// ...
await sendPasswordResetEmail(user.email, token);
```

## 定期的なフィード更新の設定

フィードを1時間ごとに更新するには、Vercel Cronジョブを設定します：

1. vercel.json ファイルをプロジェクトのルートに作成：

```json
{
  "crons": [
    {
      "path": "/api/cron/refresh-feeds",
      "schedule": "0 * * * *"
    }
  ]
}
```

2. pages/api/cron/refresh-feeds.ts ファイルを作成：

```tsx
import { NextApiRequest, NextApiResponse } from 'next';
import { prisma } from '../../../lib/prisma';
import { fetchRssFeed } from '../../../lib/rss';

// Vercel Cronジョブのための認証シークレット
const CRON_SECRET = process.env.CRON_SECRET;

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  // 本番環境での認証チェック
  if (process.env.NODE_ENV === 'production') {
    const authHeader = req.headers.authorization;
    
    if (authHeader !== `Bearer ${CRON_SECRET}`) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
  }

  try {
    // 全フィードを取得
    const feeds = await prisma.feed.findMany();
    let updatedCount = 0;

    // 各フィードを更新
    for (const feed of feeds) {
      try {
        const rssFeed = await fetchRssFeed(feed.url);
        
        // 新しい記事を追加
        for (const item of rssFeed.items) {
          // 記事が既に存在するか確認
          const existingArticle = await prisma.article.findUnique({
            where: { url: item.link }
          });

          if (!existingArticle) {
            await prisma.article.create({
              data: {
                title: item.title,
                url: item.link,
                description: item.description || null,
                content: item.content || null,
                publishedAt: item.pubDate ? new Date(item.pubDate) : new Date(),
                feedId: feed.id
              }
            });
            updatedCount++;
          }
        }
      } catch (error) {
        console.error(`Error updating feed ${feed.url}:`, error);
      }
    }

    return res.status(200).json({ 
      success: true, 
      message: `Updated ${updatedCount} articles across ${feeds.length} feeds` 
    });
  } catch (error) {
    console.error('Error refreshing feeds:', error);
    return res.status(500).json({ error: 'Failed to refresh feeds' });
  }
}
```

3. 環境変数に `CRON_SECRET` を追加（ランダムな文字列）

## デプロイ後の確認

1. アプリケーションにアクセスしてサインアップが正常に機能するか確認
2. フィードの追加と記事の取得ができるか確認
3. パスワードリセット機能が正常に動作するか確認
4. 定期的なフィード更新が行われるか確認（Vercelダッシュボードの「Logs」で確認可能）

## トラブルシューティング

- **データベース接続エラー**: 
  - `DATABASE_URL` が正しく設定されているか確認してください
  - Supabaseダッシュボードで「Project Settings」>「Database」から接続文字列を再確認してください
  - Supabaseプロジェクトのネットワーク設定で「Port 5432」が有効になっているか確認してください
- **メール送信エラー**: Resendのダッシュボードでエラーを確認してください
- **デプロイエラー**: Vercelのビルドログを確認してください
- **API機能が動作しない**: ログを確認し、環境変数が正しく設定されているか確認してください
- **マイグレーションエラー**: 
  - Supabaseのコンソールから直接SQLエディタを使用して確認することもできます
  - Prismaマイグレーションの履歴が問題を起こしている場合は、`_prisma_migrations`テーブルを確認してください