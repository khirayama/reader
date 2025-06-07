'use client'

import type React from 'react'
import { useState } from 'react'
import Link from 'next/link'
import { useAuth } from '@/contexts/AuthContext'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { registerSchema, type RegisterFormData } from '@/lib/validations/auth'

interface RegisterFormProps {
  onSuccess?: () => void
}

export function RegisterForm({ onSuccess }: RegisterFormProps) {
  const { register: registerUser } = useAuth()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [formData, setFormData] = useState({ email: '', password: '', confirmPassword: '' })
  const [fieldErrors, setFieldErrors] = useState<Partial<Record<keyof RegisterFormData, string>>>(
    {}
  )

  const validateField = (name: keyof RegisterFormData, value: string) => {
    try {
      registerSchema.parse({ ...formData, [name]: value })
      setFieldErrors((prev) => ({ ...prev, [name]: undefined }))
    } catch (err: any) {
      const message = err.errors?.[0]?.message || 'Invalid value'
      setFieldErrors((prev) => ({ ...prev, [name]: message }))
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
    validateField(name as keyof RegisterFormData, value)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    try {
      const validatedData = registerSchema.parse(formData)
      setIsLoading(true)
      setError(null)

      await registerUser(validatedData.email, validatedData.password)
      onSuccess?.()
    } catch (err: any) {
      if (err.errors) {
        const newErrors: Partial<Record<keyof RegisterFormData, string>> = {}
        err.errors.forEach((error: any) => {
          if (error.path[0]) {
            newErrors[error.path[0] as keyof RegisterFormData] = error.message
          }
        })
        setFieldErrors(newErrors)
      } else if (err instanceof Error) {
        setError(err.message)
      } else {
        setError('登録に失敗しました')
      }
    } finally {
      setIsLoading(false)
    }
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
        />
      </div>

      <div>
        <Input
          label="パスワード"
          type="password"
          name="password"
          value={formData.password}
          onChange={handleChange}
          autoComplete="new-password"
          error={fieldErrors.password}
          helperText="8文字以上、大文字・小文字・数字を含む"
        />
      </div>

      <div>
        <Input
          label="パスワード確認"
          type="password"
          name="confirmPassword"
          value={formData.confirmPassword}
          onChange={handleChange}
          autoComplete="new-password"
          error={fieldErrors.confirmPassword}
        />
      </div>

      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md p-4">
          <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
        </div>
      )}

      <div>
        <Button type="submit" className="w-full" loading={isLoading}>
          アカウント作成
        </Button>
      </div>

      <div className="text-center">
        <p className="text-sm text-gray-600 dark:text-gray-400">
          すでにアカウントをお持ちの方は{' '}
          <Link
            href="/login"
            className="text-primary-600 hover:text-primary-500 dark:text-primary-400"
          >
            ログイン
          </Link>
        </p>
      </div>
    </form>
  )
}
