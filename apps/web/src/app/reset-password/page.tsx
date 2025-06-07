'use client'

import { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { z } from 'zod'
import Link from 'next/link'
import { Card } from '@/components/ui/Card'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import { AuthLayout } from '@/components/layout/AuthLayout'
import { sdk } from '@/lib/sdk'

const resetPasswordSchema = z
  .object({
    password: z
      .string()
      .min(8, 'パスワードは8文字以上で入力してください')
      .regex(
        /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
        'パスワードは大文字・小文字・数字を含む必要があります'
      ),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'パスワードが一致しません',
    path: ['confirmPassword'],
  })

type ResetPasswordInput = z.infer<typeof resetPasswordSchema>

function ResetPasswordForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [isLoading, setIsLoading] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
  const [formData, setFormData] = useState({ password: '', confirmPassword: '' })
  const [fieldErrors, setFieldErrors] = useState<Partial<Record<keyof ResetPasswordInput, string>>>(
    {}
  )
  const token = searchParams.get('token')

  const validateField = (name: keyof ResetPasswordInput, value: string) => {
    try {
      resetPasswordSchema.parse({ ...formData, [name]: value })
      setFieldErrors((prev) => ({ ...prev, [name]: undefined }))
    } catch (err: any) {
      const message = err.errors?.[0]?.message || 'Invalid value'
      setFieldErrors((prev) => ({ ...prev, [name]: message }))
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
    validateField(name as keyof ResetPasswordInput, value)
  }

  useEffect(() => {
    if (!token) {
      setMessage({
        type: 'error',
        text: '無効なリンクです。パスワードリセットをもう一度お試しください。',
      })
    }
  }, [token])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!token) return

    try {
      const validatedData = resetPasswordSchema.parse(formData)
      setIsLoading(true)
      setMessage(null)

      await sdk.auth.resetPassword({ token, password: validatedData.password })
      setMessage({ type: 'success', text: 'パスワードが正常にリセットされました。' })

      // 3秒後にログインページへリダイレクト
      setTimeout(() => {
        router.push('/login')
      }, 3000)
    } catch (err: any) {
      if (err.errors) {
        const newErrors: Partial<Record<keyof ResetPasswordInput, string>> = {}
        err.errors.forEach((error: any) => {
          if (error.path[0]) {
            newErrors[error.path[0] as keyof ResetPasswordInput] = error.message
          }
        })
        setFieldErrors(newErrors)
      } else {
        setMessage({
          type: 'error',
          text:
            err.response?.data?.error ||
            'パスワードのリセットに失敗しました。もう一度お試しください。',
        })
      }
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <AuthLayout title="パスワードリセット">
      <Card className="w-full max-w-md p-8">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold mb-2">パスワードリセット</h1>
          <p className="text-gray-600">新しいパスワードを入力してください</p>
        </div>

        {message && (
          <div
            className={`mb-4 p-4 rounded ${
              message.type === 'success'
                ? 'bg-green-50 text-green-800 border border-green-200'
                : 'bg-red-50 text-red-800 border border-red-200'
            }`}
          >
            {message.text}
          </div>
        )}

        {!message?.type && token && (
          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              type="password"
              label="新しいパスワード"
              name="password"
              value={formData.password}
              onChange={handleChange}
              error={fieldErrors.password}
              disabled={isLoading}
            />

            <Input
              type="password"
              label="パスワード（確認）"
              name="confirmPassword"
              value={formData.confirmPassword}
              onChange={handleChange}
              error={fieldErrors.confirmPassword}
              disabled={isLoading}
            />

            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? 'リセット中...' : 'パスワードをリセット'}
            </Button>
          </form>
        )}

        <div className="mt-6 text-center text-sm">
          <Link href="/login" className="text-blue-600 hover:underline">
            ログインページに戻る
          </Link>
        </div>
      </Card>
    </AuthLayout>
  )
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <ResetPasswordForm />
    </Suspense>
  )
}
