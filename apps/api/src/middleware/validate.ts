import { Request, Response, NextFunction } from 'express';
import { ZodSchema, ZodError } from 'zod';

// バリデーションエラー応答型
interface ValidationErrorResponse {
  error: string;
  details: Array<{
    field: string;
    message: string;
  }>;
}

// 汎用バリデーションミドルウェア
export const validate = (schema: ZodSchema) => {
  return (req: Request, res: Response<ValidationErrorResponse>, next: NextFunction): void => {
    try {
      // リクエストボディをバリデーション
      schema.parse(req.body);
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        const validationErrors = error.errors.map((err) => ({
          field: err.path.join('.'),
          message: err.message,
        }));

        res.status(422).json({
          error: 'バリデーションエラーが発生しました',
          details: validationErrors,
        });
        return;
      }

      // Zodエラー以外の場合
      res.status(500).json({
        error: 'サーバーエラーが発生しました',
        details: [{ field: 'unknown', message: 'バリデーション処理でエラーが発生しました' }],
      });
    }
  };
};