import { z } from 'zod';

// フィード作成バリデーションスキーマ
export const createFeedSchema = z.object({
  url: z
    .string()
    .min(1, 'URLが必要です')
    .url('有効なURLを入力してください')
    .refine(
      (url) => {
        // HTTP/HTTPSのみ許可
        return url.startsWith('http://') || url.startsWith('https://');
      },
      { message: 'HTTP または HTTPS URL のみ許可されています' }
    ),
});

// フィード更新バリデーションスキーマ
export const updateFeedSchema = z.object({
  title: z.string().min(1, 'タイトルが必要です').optional(),
  siteUrl: z.string().url('有効なサイトURLを入力してください').nullable().optional(),
  description: z.string().nullable().optional(),
  favicon: z.string().url('有効なfaviconURLを入力してください').nullable().optional(),
});

// フィード取得クエリパラメータスキーマ
export const getFeedsQuerySchema = z.object({
  page: z
    .string()
    .optional()
    .transform((val) => (val ? Number.parseInt(val, 10) : 1))
    .refine((val) => val > 0, { message: 'ページ番号は1以上である必要があります' }),
  limit: z
    .string()
    .optional()
    .transform((val) => (val ? Number.parseInt(val, 10) : 20))
    .refine((val) => val > 0 && val <= 100, {
      message: '1ページあたりの件数は1〜100の範囲で指定してください',
    }),
  search: z.string().optional(),
});

// レスポンス型定義
export type CreateFeedRequest = z.infer<typeof createFeedSchema>;
export type UpdateFeedRequest = z.infer<typeof updateFeedSchema>;
export type GetFeedsQuery = z.infer<typeof getFeedsQuerySchema>;