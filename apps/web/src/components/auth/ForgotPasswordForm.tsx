'use client'

import type React from 'react'
import { useState } from 'react'
import Link from 'next/link'
import { sdk } from '@/lib/sdk'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { forgotPasswordSchema, type ForgotPasswordFormData } from '@/lib/validations/auth'

export function ForgotPasswordForm() {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [formData, setFormData] = useState({ email: '' })
  const [fieldErrors, setFieldErrors] = useState<
    Partial<Record<keyof ForgotPasswordFormData, string>>
  >({})

  const validateField = (name: keyof ForgotPasswordFormData, value: string) => {
    try {
      forgotPasswordSchema.parse({ ...formData, [name]: value })
      setFieldErrors((prev) => ({ ...prev, [name]: undefined }))
    } catch (err: any) {
      const message = err.errors?.[0]?.message || 'Invalid value'
      setFieldErrors((prev) => ({ ...prev, [name]: message }))
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
    validateField(name as keyof ForgotPasswordFormData, value)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    try {
      const validatedData = forgotPasswordSchema.parse(formData)
      setIsLoading(true)
      setError(null)

      await sdk.auth.forgotPassword(validatedData.email)
      setSuccess(true)
    } catch (err: any) {
      if (err.errors) {
        const newErrors: Partial<Record<keyof ForgotPasswordFormData, string>> = {}
        err.errors.forEach((error: any) => {
          if (error.path[0]) {
            newErrors[error.path[0] as keyof ForgotPasswordFormData] = error.message
          }
        })
        setFieldErrors(newErrors)
      } else if (err instanceof Error) {
        setError(err.message)
      } else {
        setError('リクエストの送信に失敗しました')
      }
    } finally {
      setIsLoading(false)
    }
  }

  if (success) {
    return (
      <div className="text-center space-y-4">
        <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-md p-4">
          <h3 className="text-lg font-medium text-green-800 dark:text-green-200 mb-2">
            メールを送信しました
          </h3>
          <p className="text-sm text-green-600 dark:text-green-300">
            パスワードリセットのリンクをメールで送信しました。
            メールをご確認の上、リンクをクリックしてパスワードをリセットしてください。
          </p>
        </div>
        <Link
          href="/login"
          className="text-primary-600 hover:text-primary-500 dark:text-primary-400"
        >
          ログインページに戻る
        </Link>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <Input
          label="メールアドレス"
          type="email"
          name="email"
          value={formData.email}
          onChange={handleChange}
          autoComplete="email"
          error={fieldErrors.email}
          helperText="登録されているメールアドレスを入力してください"
        />
      </div>

      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md p-4">
          <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
        </div>
      )}

      <div>
        <Button type="submit" className="w-full" loading={isLoading}>
          リセットメールを送信
        </Button>
      </div>

      <div className="text-center">
        <Link
          href="/login"
          className="text-sm text-primary-600 hover:text-primary-500 dark:text-primary-400"
        >
          ログインページに戻る
        </Link>
      </div>
    </form>
  )
}
