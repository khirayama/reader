import { z } from 'zod';

// Tag creation schema
export const createTagSchema = z.object({
  name: z
    .string()
    .min(1, 'タグ名は必須です')
    .max(20, 'タグ名は20文字以内で入力してください')
    .trim(),
  color: z
    .string()
    .regex(/^#[0-9A-Fa-f]{6}$/, '有効な色コード（例: #3B82F6）を入力してください')
    .optional()
});

// Tag update schema
export const updateTagSchema = z.object({
  name: z
    .string()
    .min(1, 'タグ名は必須です')
    .max(20, 'タグ名は20文字以内で入力してください')
    .trim()
    .optional(),
  color: z
    .string()
    .regex(/^#[0-9A-Fa-f]{6}$/, '有効な色コード（例: #3B82F6）を入力してください')
    .optional()
});

// Feed tag assignment schema
export const assignTagToFeedSchema = z.object({
  tagId: z.string().cuid('有効なタグIDを指定してください').optional(),
  tagName: z.string().min(1).max(20).trim().optional(),
  color: z
    .string()
    .regex(/^#[0-9A-Fa-f]{6}$/, '有効な色コード（例: #3B82F6）を入力してください')
    .optional()
}).refine(
  (data) => data.tagId || data.tagName,
  {
    message: 'タグIDまたはタグ名のいずれかを指定してください',
    path: ['tagId']
  }
);

// Query parameters for tag filtering
export const tagQuerySchema = z.object({
  search: z.string().optional(),
  limit: z.string().transform(Number).pipe(z.number().min(1).max(100)).optional(),
  offset: z.string().transform(Number).pipe(z.number().min(0)).optional()
});

export type CreateTagInput = z.infer<typeof createTagSchema>;
export type UpdateTagInput = z.infer<typeof updateTagSchema>;
export type AssignTagToFeedInput = z.infer<typeof assignTagToFeedSchema>;
export type TagQueryInput = z.infer<typeof tagQuerySchema>;