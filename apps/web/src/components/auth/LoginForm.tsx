'use client'

import type React from 'react'
import { useState } from 'react'
import Link from 'next/link'
import { useAuth } from '@/contexts/AuthContext'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { loginSchema, type LoginFormData } from '@/lib/validations/auth'
import { ZodError } from 'zod'

interface LoginFormProps {
  onSuccess?: () => void
}

export function LoginForm({ onSuccess }: LoginFormProps) {
  const { login } = useAuth()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [formData, setFormData] = useState({ email: '', password: '' })
  const [fieldErrors, setFieldErrors] = useState<Partial<Record<keyof LoginFormData, string>>>({})

  const validateField = (name: keyof LoginFormData, value: string) => {
    try {
      loginSchema.parse({ ...formData, [name]: value })
      setFieldErrors((prev) => ({ ...prev, [name]: undefined }))
    } catch (err) {
      if (err instanceof ZodError) {
        const message = err.errors[0]?.message || 'Invalid value'
        setFieldErrors((prev) => ({ ...prev, [name]: message }))
      }
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
    validateField(name as keyof LoginFormData, value)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    try {
      const validatedData = loginSchema.parse(formData)
      setIsLoading(true)
      setError(null)

      await login(validatedData.email, validatedData.password)
      onSuccess?.()
    } catch (err: any) {
      if (err.errors) {
        const newErrors: Partial<Record<keyof LoginFormData, string>> = {}
        err.errors.forEach((error: any) => {
          if (error.path[0]) {
            newErrors[error.path[0] as keyof LoginFormData] = error.message
          }
        })
        setFieldErrors(newErrors)
      } else if (err instanceof Error) {
        setError(err.message)
      } else {
        setError('ログインに失敗しました')
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
          autoComplete="current-password"
          error={fieldErrors.password}
        />
      </div>

      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md p-4">
          <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
        </div>
      )}

      <div>
        <Button type="submit" className="w-full" loading={isLoading}>
          ログイン
        </Button>
      </div>

      <div className="text-center space-y-2">
        <p className="text-sm text-gray-600 dark:text-gray-400">
          <Link
            href="/forgot-password"
            className="text-blue-600 hover:text-blue-500 dark:text-blue-400 focus-visible"
          >
            パスワードを忘れた場合
          </Link>
        </p>
        <p className="text-sm text-gray-600 dark:text-gray-400">
          アカウントをお持ちでない方は{' '}
          <Link
            href="/register"
            className="text-blue-600 hover:text-blue-500 dark:text-blue-400 focus-visible"
          >
            新規登録
          </Link>
        </p>
      </div>
    </form>
  )
}
