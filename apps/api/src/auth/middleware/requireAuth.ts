import { Request, Response, NextFunction } from 'express';
import { AuthService } from '../services/authService';

// 認証エラー応答型
interface ErrorResponse {
  error: string;
  details?: string;
}

// 認証必須ミドルウェア
export const requireAuth = async (
  req: Request,
  res: Response<ErrorResponse>,
  next: NextFunction
): Promise<void> => {
  try {
    // Authorizationヘッダーからトークン取得
    const authHeader = req.headers.authorization;

    if (!authHeader) {
      res.status(401).json({
        error: '認証が必要です',
        details: 'Authorizationヘッダーが見つかりません',
      });
      return;
    }

    // Bearer トークン形式の検証
    if (!authHeader.startsWith('Bearer ')) {
      res.status(401).json({
        error: '認証が必要です',
        details: '無効なAuthorizationヘッダー形式です',
      });
      return;
    }

    // トークン抽出
    const token = authHeader.substring(7); // "Bearer " を除去

    if (!token) {
      res.status(401).json({
        error: '認証が必要です',
        details: 'トークンが見つかりません',
      });
      return;
    }

    // JWT検証
    const payload = AuthService.verifyToken(token);

    // ユーザー存在確認
    const user = await AuthService.getUserById(payload.userId);

    if (!user) {
      res.status(401).json({
        error: '認証が必要です',
        details: 'ユーザーが見つかりません',
      });
      return;
    }

    // リクエストオブジェクトにユーザー情報を追加
    req.user = {
      userId: payload.userId,
      email: payload.email,
    };

    next();
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : '認証エラーが発生しました';

    res.status(401).json({
      error: '認証が失敗しました',
      details: errorMessage,
    });
  }
};

// オプション認証ミドルウェア（認証は必須でないが、あれば処理する）
export const optionalAuth = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      next();
      return;
    }

    const token = authHeader.substring(7);

    if (!token) {
      next();
      return;
    }

    // JWT検証
    const payload = AuthService.verifyToken(token);

    // ユーザー存在確認
    const user = await AuthService.getUserById(payload.userId);

    if (user) {
      req.user = {
        userId: payload.userId,
        email: payload.email,
      };
    }

    next();
  } catch (error) {
    // オプション認証では、エラーが発生してもそのまま続行
    next();
  }
};