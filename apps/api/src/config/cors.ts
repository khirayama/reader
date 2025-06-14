import type { CorsOptions } from 'cors'

// 許可するオリジンの設定
const getAllowedOrigins = (): string[] => {
  const origins: string[] = []

  // 開発環境
  if (process.env.NODE_ENV === 'development') {
    origins.push(
      'http://localhost:3000', // Next.js dev server
      'http://localhost:3001', // API server
      'http://localhost:19006', // Expo dev server
      'exp://localhost:8081' // Expo development
    )
  }

  // 本番環境
  if (process.env.NODE_ENV === 'production') {
    // 本番環境のドメインを追加
    if (process.env.WEB_URL) {
      origins.push(process.env.WEB_URL)
    }
    if (process.env.ADMIN_URL) {
      origins.push(process.env.ADMIN_URL)
    }
  }

  // 環境変数から追加のオリジンを読み込み
  if (process.env.ALLOWED_ORIGINS) {
    const additionalOrigins = process.env.ALLOWED_ORIGINS.split(',')
    origins.push(...additionalOrigins)
  }

  return origins
}

// CORS設定
export const corsOptions: CorsOptions = {
  origin: (origin, callback) => {
    const allowedOrigins = getAllowedOrigins()

    // オリジンが未定義の場合（サーバーサイドリクエストなど）
    if (!origin) {
      return callback(null, true)
    }

    // 許可されたオリジンリストに含まれているかチェック
    if (allowedOrigins.includes(origin)) {
      return callback(null, true)
    }

    // 開発環境ではlocalhostを許可
    if (process.env.NODE_ENV === 'development' && origin.startsWith('http://localhost:')) {
      return callback(null, true)
    }

    // 本番環境でのVercel Preview URLs
    if (process.env.NODE_ENV === 'production' && origin.includes('.vercel.app')) {
      return callback(null, true)
    }

    // 許可されていないオリジン
    callback(new Error('CORS policy violation: Origin not allowed'))
  },

  // 許可するHTTPメソッド
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],

  // 許可するヘッダー
  allowedHeaders: [
    'Origin',
    'X-Requested-With',
    'Content-Type',
    'Accept',
    'Authorization',
    'Cache-Control',
    'X-API-Key',
  ],

  // 認証情報の送信を許可
  credentials: true,

  // プリフライトリクエストのキャッシュ時間
  maxAge: 86400, // 24時間
}

// プリフライトリクエスト用の簡単なCORS設定
export const simpleCorsOptions: CorsOptions = {
  origin: true,
  methods: ['GET', 'POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true,
}
