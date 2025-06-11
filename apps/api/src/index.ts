import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import { authRouter } from './auth/routes/authRoutes';
import { feedRouter } from './feeds/routes/feedRoutes';
import { articleRouter } from './articles/routes/articleRoutes';
import { adminRouter } from './admin/routes/adminRoutes';
import { tagRoutes } from './tags/routes/tagRoutes';
import opmlRouter from './opml/routes/opmlRoutes';
import { corsOptions } from './config/cors';
import {
  generalLimiter,
  authLimiter,
  passwordResetLimiter,
  registrationLimiter,
  securityHeaders,
  requestSizeLimit,
} from './middleware/security';

// 環境変数の検証
const requiredEnvVars = ['JWT_SECRET'];
for (const envVar of requiredEnvVars) {
  if (!process.env[envVar]) {
    console.error(`Error: ${envVar} environment variable is required`);
    process.exit(1);
  }
}

const app = express();
const PORT = process.env.PORT || 3001;

// セキュリティミドルウェア設定（順序重要）
app.use(helmet()); // セキュリティヘッダー
app.use(securityHeaders); // 追加セキュリティヘッダー
app.use(cors(corsOptions)); // CORS設定
app.use(generalLimiter); // 一般的なレート制限

// ログ設定
if (process.env.NODE_ENV !== 'test') {
  app.use(morgan('combined')); // ログ出力（テスト時は無効）
}

// リクエスト解析
app.use(express.json(requestSizeLimit.json)); // JSON解析
app.use(express.urlencoded(requestSizeLimit.urlencoded)); // URL解析

// ヘルスチェックエンドポイント
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
  });
});

// API ルート（認証関連のレート制限を個別適用）
app.use('/api/auth/register', registrationLimiter);
app.use('/api/auth/login', authLimiter);
app.use('/api/auth/forgot-password', passwordResetLimiter);
app.use('/api/auth', authRouter);

// フィード・記事・タグ管理ルート
app.use('/api/feeds', feedRouter);
app.use('/api/articles', articleRouter);
app.use('/api/tags', tagRoutes);

// OPML機能ルート
app.use('/api/opml', opmlRouter);

// 管理者ルート
app.use('/api/admin', adminRouter);

// 404ハンドラー
app.use('*', (req, res) => {
  res.status(404).json({
    error: 'エンドポイントが見つかりません',
    path: req.originalUrl,
  });
});

// グローバルエラーハンドラー
app.use((error: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Global error handler:', error);

  // Prisma エラーハンドリング
  if (error.code === 'P2002') {
    return res.status(409).json({
      error: '重複するデータが存在します',
      details: 'このデータは既に登録されています',
    });
  }

  if (error.code && error.code.startsWith('P')) {
    return res.status(400).json({
      error: 'データベースエラーが発生しました',
      details: 'データの処理中にエラーが発生しました',
    });
  }

  // その他のエラー
  return res.status(500).json({
    error: 'サーバーエラーが発生しました',
    details: process.env.NODE_ENV === 'development' ? error.message : undefined,
  });
});

// テスト環境でなければサーバーを起動
if (process.env.NODE_ENV !== 'test') {
  const server = app.listen(PORT, () => {
    console.log(`🚀 Server is running on port ${PORT}`);
    console.log(`📍 Environment: ${process.env.NODE_ENV || 'development'}`);
    console.log(`🏥 Health check: http://localhost:${PORT}/health`);
    console.log(`🔐 Auth API: http://localhost:${PORT}/api/auth`);
    console.log(`📰 Feed API: http://localhost:${PORT}/api/feeds`);
    console.log(`📄 Article API: http://localhost:${PORT}/api/articles`);
    console.log(`🏷️  Tag API: http://localhost:${PORT}/api/tags`);
    console.log(`📤 OPML API: http://localhost:${PORT}/api/opml`);
    console.log(`🛡️  Admin API: http://localhost:${PORT}/api/admin`);
  });

  // サーバータイムアウト設定（大きなOPMLファイルのインポートに対応）
  server.timeout = 5 * 60 * 1000; // 5分
  server.keepAliveTimeout = 5 * 60 * 1000; // 5分
  server.headersTimeout = 5 * 60 * 1000 + 1000; // 5分+1秒（keepAliveTimeoutより長く）

  // 優雅なシャットダウン
  process.on('SIGTERM', () => {
    console.log('SIGTERM received, shutting down gracefully');
    server.close(() => {
      console.log('Process terminated');
    });
  });

  process.on('SIGINT', () => {
    console.log('SIGINT received, shutting down gracefully');
    server.close(() => {
      console.log('Process terminated');
    });
  });
}

export default app;