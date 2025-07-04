import type { NextFunction, Request, Response } from 'express'
import { ZodError, type ZodSchema } from 'zod'

// バリデーションエラー応答型
interface ValidationErrorResponse {
  error: string
  details: Array<{
    field: string
    message: string
  }>
}

// 汎用バリデーションミドルウェア
export const validate = (schema: ZodSchema) => {
  return (req: Request, res: Response<ValidationErrorResponse>, next: NextFunction): void => {
    try {
      // リクエスト全体をバリデーション（body, query, params, file）
      const dataToValidate = {
        ...req.body,
        query: req.query,
        params: req.params,
        file: req.file,
      }

      schema.parse(dataToValidate)
      next()
    } catch (error) {
      if (error instanceof ZodError) {
        const validationErrors = error.errors.map((err) => ({
          field: err.path.join('.'),
          message: err.message,
        }))

        res.status(422).json({
          error: 'バリデーションエラーが発生しました',
          details: validationErrors,
        })
        return
      }

      // Zodエラー以外の場合
      res.status(500).json({
        error: 'サーバーエラーが発生しました',
        details: [{ field: 'unknown', message: 'バリデーション処理でエラーが発生しました' }],
      })
    }
  }
}
