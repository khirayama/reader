import type React from 'react'
import { Card } from '@/components/ui/Card'

interface AuthLayoutProps {
  children: React.ReactNode
  title: string
  subtitle?: string
}

export function AuthLayout({ children, title, subtitle }: AuthLayoutProps) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">RSS Reader</h1>
          <h2 className="mt-6 text-2xl font-bold text-gray-900 dark:text-white">{title}</h2>
          {subtitle && <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">{subtitle}</p>}
        </div>
        <Card className="mt-8">{children}</Card>
      </div>
    </div>
  )
}
