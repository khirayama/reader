import rateLimit from 'express-rate-limit';
import { Request, Response } from 'express';

// テスト環境でレート制限をスキップするミドルウェア
const skipIfTest = (req: Request, res: Response) => {
  return process.env.NODE_ENV === 'test';
};

// レート制限レスポンスを詳細化するミドルウェア
export const enhancedRateLimit = (limiter: any) => {
  return (req: Request, res: Response, next: Function) => {
    limiter(req, res, (err: any) => {
      if (err) {
        // レート制限エラーの場合、詳細な情報を追加
        const retryAfter = res.getHeader('Retry-After') || res.getHeader('RateLimit-Reset');
        const remaining = res.getHeader('RateLimit-Remaining') || 0;
        const limit = res.getHeader('RateLimit-Limit') || 0;
        
        return res.status(429).json({
          error: err.message?.error || 'リクエストが多すぎます',
          details: err.message?.details || 'しばらく待ってから再試行してください',
          retryAfter: err.message?.retryAfter || retryAfter,
          rateLimitType: err.message?.rateLimitType || 'general',
          remaining: parseInt(remaining.toString()),
          limit: parseInt(limit.toString()),
          resetTime: new Date(Date.now() + (parseInt(retryAfter?.toString() || '0') * 1000)).toISOString(),
        });
      }
      return next();
    });
  };
};

// 一般的なAPIのレート制限（大幅緩和）
export const generalLimiter = rateLimit({
  windowMs: 3 * 60 * 1000, // 3分
  max: 500, // リクエスト数上限
  message: {
    error: 'リクエストが多すぎます',
    details: '3分後に再試行してください',
    retryAfter: 3 * 60, // 秒単位
    rateLimitType: 'general',
  },
  standardHeaders: true, // `RateLimit-*` ヘッダーを含める
  legacyHeaders: false, // `X-RateLimit-*` ヘッダーを無効化
  skip: skipIfTest,
});

// 認証関連のレート制限（実質無制限型）
export const authLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 60分
  max: 100, // ログイン試行回数上限
  message: {
    error: 'ログイン試行回数が多すぎます',
    details: '60分後に再試行してください',
    retryAfter: 60 * 60, // 秒単位
    rateLimitType: 'auth',
  },
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: true, // 成功したリクエストはカウントしない
  skip: skipIfTest,
});

// パスワードリセットのレート制限（余裕の設定）
export const passwordResetLimiter = rateLimit({
  windowMs: 3 * 60 * 60 * 1000, // 3時間
  max: 15, // パスワードリセット要求上限
  message: {
    error: 'パスワードリセット要求が多すぎます',
    details: '3時間後に再試行してください',
    retryAfter: 3 * 60 * 60, // 秒単位
    rateLimitType: 'passwordReset',
  },
  standardHeaders: true,
  legacyHeaders: false,
  skip: skipIfTest,
});

// アカウント作成のレート制限（開発者フレンドリー）
export const registrationLimiter = rateLimit({
  windowMs: 4 * 60 * 60 * 1000, // 4時間
  max: 20, // アカウント作成上限
  message: {
    error: 'アカウント作成回数が多すぎます',
    details: '4時間後に再試行してください',
    retryAfter: 4 * 60 * 60, // 秒単位
    rateLimitType: 'registration',
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

// OPML操作用のレート制限（企業レベル対応）
export const opmlLimiter = rateLimit({
  windowMs: 2 * 60 * 60 * 1000, // 2時間
  max: 50, // OPML操作上限
  message: {
    error: 'OPML操作回数が多すぎます',
    details: '2時間後に再試行してください',
    retryAfter: 2 * 60 * 60, // 秒単位
    rateLimitType: 'opml',
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

// フィード更新専用のレート制限（短期集中型）
export const feedUpdateLimiter = rateLimit({
  windowMs: 3 * 60 * 1000, // 3分
  max: 50, // フィード更新上限
  message: {
    error: 'フィード更新回数が多すぎます',
    details: '3分後に再試行してください',
    retryAfter: 3 * 60, // 秒単位
    rateLimitType: 'feedUpdate',
  },
  standardHeaders: true,
  legacyHeaders: false,
  skip: skipIfTest,
});

// 記事操作専用のレート制限（爆速閲覧型）
export const articleLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1分
  max: 300, // 記事操作上限
  message: {
    error: '記事操作回数が多すぎます',
    details: '1分後に再試行してください',
    retryAfter: 1 * 60, // 秒単位
    rateLimitType: 'article',
  },
  standardHeaders: true,
  legacyHeaders: false,
  skip: skipIfTest,
});

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