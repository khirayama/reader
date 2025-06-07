'use client'

import React from 'react'
import { useRouter } from 'next/navigation'
import { GuestGuard } from '@/components/auth/GuestGuard'
import { AuthLayout } from '@/components/layout/AuthLayout'
import { LoginForm } from '@/components/auth/LoginForm'

export default function LoginPage() {
  const router = useRouter()

  const handleLoginSuccess = () => {
    router.push('/dashboard')
  }

  return (
    <GuestGuard>
      <AuthLayout title="ログイン" subtitle="アカウントにサインインしてください">
        <LoginForm onSuccess={handleLoginSuccess} />
      </AuthLayout>
    </GuestGuard>
  )
}
