import rateLimit from 'express-rate-limit';
import { Request, Response } from 'express';

// テスト環境でレート制限をスキップするミドルウェア
const skipIfTest = (req: Request, res: Response) => {
  return process.env.NODE_ENV === 'test';
};

// 一般的なAPIのレート制限
export const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15分
  max: 100, // リクエスト数上限
  message: {
    error: 'リクエストが多すぎます',
    details: '15分後に再試行してください',
  },
  standardHeaders: true, // `RateLimit-*` ヘッダーを含める
  legacyHeaders: false, // `X-RateLimit-*` ヘッダーを無効化
  skip: skipIfTest,
});

// 認証関連のレート制限（より厳格）
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15分
  max: 10, // ログイン試行回数上限
  message: {
    error: 'ログイン試行回数が多すぎます',
    details: '15分後に再試行してください',
  },
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: true, // 成功したリクエストはカウントしない
  skip: skipIfTest,
});

// パスワードリセットのレート制限
export const passwordResetLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1時間
  max: 3, // パスワードリセット要求上限
  message: {
    error: 'パスワードリセット要求が多すぎます',
    details: '1時間後に再試行してください',
  },
  standardHeaders: true,
  legacyHeaders: false,
  skip: skipIfTest,
});

// アカウント作成のレート制限
export const registrationLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1時間
  max: 5, // アカウント作成上限
  message: {
    error: 'アカウント作成回数が多すぎます',
    details: '1時間後に再試行してください',
  },
  standardHeaders: true,
  legacyHeaders: false,
  skip: skipIfTest,
});

// IPベースの重いレート制限（DDoS対策）
export const strictLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1分
  max: 20, // 1分間に20リクエスト
  message: {
    error: 'リクエストが多すぎます',
    details: '1分後に再試行してください',
  },
  standardHeaders: true,
  legacyHeaders: false,
  skip: skipIfTest,
});

// セキュリティヘッダー設定
export const securityHeaders = (req: Request, res: Response, next: Function) => {
  // XSS対策
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  
  // HTTPS強制（本番環境）
  if (process.env.NODE_ENV === 'production') {
    res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
  }
  
  // Content Security Policy
  res.setHeader(
    'Content-Security-Policy',
    "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self'; connect-src 'self';"
  );
  
  next();
};

// リクエストサイズ制限
export const requestSizeLimit = {
  json: { limit: '1mb' },
  urlencoded: { limit: '1mb', extended: true },
};

// OPML操作用の緩いレート制限（大量フィード処理対応）
export const opmlLimiter = rateLimit({
  windowMs: 10 * 60 * 1000, // 10分
  max: 5, // OPML操作上限
  message: {
    error: 'OPML操作回数が多すぎます',
    details: '10分後に再試行してください',
  },
  standardHeaders: true,
  legacyHeaders: false,
  skip: skipIfTest,
});

// OPML用のタイムアウト設定ミドルウェア
export const opmlTimeout = (req: Request, res: Response, next: Function) => {
  // レスポンスタイムアウトを5分に設定
  res.setTimeout(5 * 60 * 1000, () => {
    if (!res.headersSent) {
      res.status(408).json({
        error: 'リクエストがタイムアウトしました',
        details: 'OPML処理が完了しませんでした。ファイルサイズを確認して再試行してください。',
      });
    }
  });
  next();
};

// API Key検証（将来の拡張用）
export const apiKeyAuth = (req: Request, res: Response, next: Function) => {
  const apiKey = req.headers['x-api-key'];
  
  // 現在は無効化（将来の実装用）
  if (false && process.env.API_KEY && apiKey !== process.env.API_KEY) {
    return res.status(401).json({
      error: '無効なAPIキーです',
    });
  }
  
  next();
};