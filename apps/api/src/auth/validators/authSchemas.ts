import { z } from 'zod'

// 共通スキーマ
const emailSchema = z
  .string()
  .email('有効なメールアドレスを入力してください')
  .min(1, 'メールアドレスを入力してください')
  .max(255, 'メールアドレスが長すぎます')

const passwordSchema = z
  .string()
  .min(8, 'パスワードは8文字以上である必要があります')
  .max(128, 'パスワードが長すぎます')
  .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, 'パスワードは大文字、小文字、数字を含む必要があります')

const simplePasswordSchema = z.string().min(1, 'パスワードを入力してください')

// 登録スキーマ
export const registerSchema = z.object({
  email: emailSchema,
  password: passwordSchema,
})

// ログインスキーマ
export const loginSchema = z.object({
  email: emailSchema,
  password: simplePasswordSchema,
})

// パスワードリセット要求スキーマ
export const forgotPasswordSchema = z.object({
  email: emailSchema,
})

// パスワードリセット実行スキーマ
export const resetPasswordSchema = z.object({
  token: z.string().min(1, 'リセットトークンが必要です'),
  password: passwordSchema,
})

// パスワード変更スキーマ
export const changePasswordSchema = z.object({
  currentPassword: simplePasswordSchema,
  newPassword: passwordSchema,
})

// メールアドレス変更スキーマ
export const changeEmailSchema = z.object({
  email: emailSchema,
  password: simplePasswordSchema,
})

// ユーザー設定更新スキーマ
export const updateUserSettingsSchema = z.object({
  theme: z.enum(['SYSTEM', 'LIGHT', 'DARK']).optional(),
  language: z.enum(['JA', 'EN']).optional(),
})

// アカウント削除スキーマ
export const deleteAccountSchema = z.object({
  password: simplePasswordSchema,
})

// 型エクスポート
export type RegisterInput = z.infer<typeof registerSchema>
export type LoginInput = z.infer<typeof loginSchema>
export type ForgotPasswordInput = z.infer<typeof forgotPasswordSchema>
export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>
export type ChangePasswordInput = z.infer<typeof changePasswordSchema>
export type ChangeEmailInput = z.infer<typeof changeEmailSchema>
export type UpdateUserSettingsInput = z.infer<typeof updateUserSettingsSchema>
export type DeleteAccountInput = z.infer<typeof deleteAccountSchema>
