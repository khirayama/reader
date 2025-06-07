'use client'

import React from 'react'
import { GuestGuard } from '@/components/auth/GuestGuard'
import { AuthLayout } from '@/components/layout/AuthLayout'
import { ForgotPasswordForm } from '@/components/auth/ForgotPasswordForm'

export default function ForgotPasswordPage() {
  return (
    <GuestGuard>
      <AuthLayout
        title="パスワードリセット"
        subtitle="登録したメールアドレスにリセットリンクを送信します"
      >
        <ForgotPasswordForm />
      </AuthLayout>
    </GuestGuard>
  )
}
