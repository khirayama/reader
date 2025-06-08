'use client'

import React, { useState } from 'react'
import { AuthGuard } from '@/components/auth/AuthGuard'
import { useAuth } from '@/contexts/AuthContext'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Card } from '@/components/ui/Card'
import { sdk } from '@/lib/sdk'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

type Theme = 'SYSTEM' | 'LIGHT' | 'DARK'
type Language = 'JA' | 'EN'

export default function SettingsPage() {
  const { user, updateUser, logout } = useAuth()
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

  // テーマ設定の状態
  const [theme, setTheme] = useState<Theme>(user?.theme || 'SYSTEM')

  // 言語設定の状態
  const [language, setLanguage] = useState<Language>(user?.language || 'JA')

  // パスワード変更の状態
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')

  // メールアドレス変更の状態
  const [newEmail, setNewEmail] = useState('')
  const [emailPassword, setEmailPassword] = useState('')

  // アカウント削除の状態
  const [deletePassword, setDeletePassword] = useState('')
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)

  // テーマと言語設定の更新
  const handleUpdateSettings = async () => {
    if (!user) return

    setLoading(true)
    setError('')
    setMessage('')

    try {
      const response = await sdk.auth.updateSettings({ theme, language })
      updateUser(response.user)
      setMessage('設定を更新しました')
    } catch (err: any) {
      setError(err.message || '設定の更新に失敗しました')
    } finally {
      setLoading(false)
    }
  }

  // パスワード変更
  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (newPassword !== confirmPassword) {
      setError('新しいパスワードが一致しません')
      return
    }

    setLoading(true)
    setError('')
    setMessage('')

    try {
      await sdk.auth.changePassword({ currentPassword, newPassword })
      setMessage('パスワードを変更しました')
      setCurrentPassword('')
      setNewPassword('')
      setConfirmPassword('')
    } catch (err: any) {
      setError(err.message || 'パスワードの変更に失敗しました')
    } finally {
      setLoading(false)
    }
  }

  // メールアドレス変更
  const handleChangeEmail = async (e: React.FormEvent) => {
    e.preventDefault()

    setLoading(true)
    setError('')
    setMessage('')

    try {
      const response = await sdk.auth.changeEmail({ email: newEmail, password: emailPassword })
      updateUser(response.user)
      setMessage('メールアドレスを変更しました')
      setNewEmail('')
      setEmailPassword('')
    } catch (err: any) {
      setError(err.message || 'メールアドレスの変更に失敗しました')
    } finally {
      setLoading(false)
    }
  }

  // アカウント削除
  const handleDeleteAccount = async () => {
    setLoading(true)
    setError('')

    try {
      await sdk.auth.deleteAccount({ password: deletePassword })
      logout()
      router.push('/')
    } catch (err: any) {
      setError(err.message || 'アカウントの削除に失敗しました')
      setShowDeleteConfirm(false)
    } finally {
      setLoading(false)
    }
  }

  return (
    <AuthGuard>
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        {/* ヘッダー */}
        <header className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-4 py-3">
          <div className="max-w-4xl mx-auto flex items-center justify-between">
            <h1 className="text-xl font-semibold text-gray-900 dark:text-white">設定</h1>
            <Link href="/dashboard">
              <Button variant="outline" size="sm">
                ダッシュボードに戻る
              </Button>
            </Link>
          </div>
        </header>

        <div className="max-w-4xl mx-auto p-4 space-y-6">
          {/* メッセージ表示 */}
          {message && (
            <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 text-green-800 dark:text-green-200 px-4 py-3 rounded-md">
              {message}
            </div>
          )}
          {error && (
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-800 dark:text-red-200 px-4 py-3 rounded-md">
              {error}
            </div>
          )}

          {/* 一般設定 */}
          <Card className="p-6">
            <h2 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">一般設定</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  テーマ
                </label>
                <select
                  value={theme}
                  onChange={(e) => setTheme(e.target.value as Theme)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="SYSTEM">システム設定に従う</option>
                  <option value="LIGHT">ライト</option>
                  <option value="DARK">ダーク</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  言語
                </label>
                <select
                  value={language}
                  onChange={(e) => setLanguage(e.target.value as Language)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="JA">日本語</option>
                  <option value="EN">English</option>
                </select>
              </div>

              <Button
                onClick={handleUpdateSettings}
                disabled={loading}
                className="w-full sm:w-auto"
              >
                設定を保存
              </Button>
            </div>
          </Card>

          {/* パスワード変更 */}
          <Card className="p-6">
            <h2 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">パスワード変更</h2>
            <form onSubmit={handleChangePassword} className="space-y-4">
              <Input
                type="password"
                label="現在のパスワード"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                required
              />
              <Input
                type="password"
                label="新しいパスワード"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                required
                placeholder="8文字以上、大文字・小文字・数字を含む"
              />
              <Input
                type="password"
                label="新しいパスワード（確認）"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
              />
              <Button type="submit" disabled={loading} className="w-full sm:w-auto">
                パスワードを変更
              </Button>
            </form>
          </Card>

          {/* メールアドレス変更 */}
          <Card className="p-6">
            <h2 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">メールアドレス変更</h2>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
              現在のメールアドレス: <strong>{user?.email}</strong>
            </p>
            <form onSubmit={handleChangeEmail} className="space-y-4">
              <Input
                type="email"
                label="新しいメールアドレス"
                value={newEmail}
                onChange={(e) => setNewEmail(e.target.value)}
                required
              />
              <Input
                type="password"
                label="パスワード"
                value={emailPassword}
                onChange={(e) => setEmailPassword(e.target.value)}
                required
                placeholder="確認のため現在のパスワードを入力"
              />
              <Button type="submit" disabled={loading} className="w-full sm:w-auto">
                メールアドレスを変更
              </Button>
            </form>
          </Card>

          {/* アカウント削除 */}
          <Card className="p-6 border-red-200 dark:border-red-800">
            <h2 className="text-lg font-semibold mb-4 text-red-600 dark:text-red-400">危険な操作</h2>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
              アカウントを削除すると、すべてのデータが完全に削除され、復元することはできません。
            </p>
            {!showDeleteConfirm ? (
              <Button
                variant="danger"
                onClick={() => setShowDeleteConfirm(true)}
                className="w-full sm:w-auto"
              >
                アカウントを削除
              </Button>
            ) : (
              <div className="space-y-4">
                <p className="text-sm font-medium text-red-600 dark:text-red-400">
                  本当にアカウントを削除しますか？この操作は取り消せません。
                </p>
                <Input
                  type="password"
                  label="パスワードを入力して確認"
                  value={deletePassword}
                  onChange={(e) => setDeletePassword(e.target.value)}
                  placeholder="パスワード"
                />
                <div className="flex space-x-3">
                  <Button
                    variant="danger"
                    onClick={handleDeleteAccount}
                    disabled={loading || !deletePassword}
                  >
                    削除を実行
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => {
                      setShowDeleteConfirm(false)
                      setDeletePassword('')
                    }}
                  >
                    キャンセル
                  </Button>
                </div>
              </div>
            )}
          </Card>
        </div>
      </div>
    </AuthGuard>
  )
}