'use client'

import React from 'react'
import { useRouter } from 'next/navigation'
import { GuestGuard } from '@/components/auth/GuestGuard'
import { AuthLayout } from '@/components/layout/AuthLayout'
import { RegisterForm } from '@/components/auth/RegisterForm'

export default function RegisterPage() {
  const router = useRouter()

  const handleRegisterSuccess = () => {
    router.push('/dashboard')
  }

  return (
    <GuestGuard>
      <AuthLayout title="アカウント作成" subtitle="新しいアカウントを作成してください">
        <RegisterForm onSuccess={handleRegisterSuccess} />
      </AuthLayout>
    </GuestGuard>
  )
}
