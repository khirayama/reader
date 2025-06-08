'use client'

import React, { useState, useEffect } from 'react'
import { AuthGuard } from '@/components/auth/AuthGuard'
import { useAuth } from '@/contexts/AuthContext'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Card } from '@/components/ui/Card'
import { sdk } from '@/lib/sdk'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useTranslation } from 'react-i18next'

type Theme = 'SYSTEM' | 'LIGHT' | 'DARK'
type Language = 'ja' | 'en' | 'zh' | 'es'

export default function SettingsPage() {
  const { user, updateUser, logout } = useAuth()
  const router = useRouter()
  const { t, i18n } = useTranslation()
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

  // テーマ設定の状態
  const [theme, setTheme] = useState<Theme>(user?.theme || 'SYSTEM')

  // 言語設定の状態
  const [language, setLanguage] = useState<Language>(() => {
    // 古い形式から新しい形式への変換
    const userLang = user?.language
    if (userLang === 'JA') return 'ja'
    if (userLang === 'EN') return 'en'
    if (userLang && ['ja', 'en', 'zh', 'es'].includes(userLang)) {
      return userLang as Language
    }
    return (i18n.language as Language) || 'en'
  })

  useEffect(() => {
    if (user?.language && user.language !== i18n.language) {
      i18n.changeLanguage(user.language)
    }
  }, [user?.language, i18n])

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
      const response = await sdk.auth.updateSettings({ 
        theme, 
        language: language as any // 型安全性は実行時にチェック
      })
      updateUser(response.user)
      // 言語が変更された場合はi18nも更新
      if (language !== i18n.language) {
        i18n.changeLanguage(language)
      }
      setMessage(t('settings.updateSuccess'))
    } catch (err: any) {
      setError(err.message || t('settings.updateError'))
    } finally {
      setLoading(false)
    }
  }

  // パスワード変更
  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (newPassword !== confirmPassword) {
      setError(t('auth.passwordMismatch', 'パスワードが一致しません'))
      return
    }

    setLoading(true)
    setError('')
    setMessage('')

    try {
      await sdk.auth.changePassword({ currentPassword, newPassword })
      setMessage(t('settings.passwordChangeSuccess', 'パスワードを変更しました'))
      setCurrentPassword('')
      setNewPassword('')
      setConfirmPassword('')
    } catch (err: any) {
      setError(err.message || t('settings.passwordChangeError', 'パスワードの変更に失敗しました'))
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
      setMessage(t('settings.emailChangeSuccess', 'メールアドレスを変更しました'))
      setNewEmail('')
      setEmailPassword('')
    } catch (err: any) {
      setError(err.message || t('settings.emailChangeError', 'メールアドレスの変更に失敗しました'))
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
      setError(err.message || t('settings.deleteAccountError', 'アカウントの削除に失敗しました'))
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
            <h1 className="text-xl font-semibold text-gray-900 dark:text-white">{t('settings.settings')}</h1>
            <Link href="/dashboard">
              <Button variant="outline" size="sm">
                {t('dashboard.dashboard')}
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
            <h2 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">{t('settings.general')}</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  {t('settings.theme')}
                </label>
                <select
                  value={theme}
                  onChange={(e) => setTheme(e.target.value as Theme)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="SYSTEM">{t('settings.system')}</option>
                  <option value="LIGHT">{t('settings.light')}</option>
                  <option value="DARK">{t('settings.dark')}</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  {t('settings.language')}
                </label>
                <select
                  value={language}
                  onChange={(e) => setLanguage(e.target.value as Language)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="ja">{t('languages.ja')}</option>
                  <option value="en">{t('languages.en')}</option>
                  <option value="zh">{t('languages.zh')}</option>
                  <option value="es">{t('languages.es')}</option>
                </select>
              </div>

              <Button
                onClick={handleUpdateSettings}
                disabled={loading}
                className="w-full sm:w-auto"
              >
                {t('settings.saveChanges')}
              </Button>
            </div>
          </Card>

          {/* パスワード変更 */}
          <Card className="p-6">
            <h2 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">{t('settings.changePassword')}</h2>
            <form onSubmit={handleChangePassword} className="space-y-4">
              <Input
                type="password"
                label={t('settings.currentPassword')}
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                required
              />
              <Input
                type="password"
                label={t('auth.newPassword')}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                required
                placeholder={t('auth.passwordMinLength')}
              />
              <Input
                type="password"
                label={t('auth.confirmPassword')}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
              />
              <Button type="submit" disabled={loading} className="w-full sm:w-auto">
                {t('settings.changePassword')}
              </Button>
            </form>
          </Card>

          {/* メールアドレス変更 */}
          <Card className="p-6">
            <h2 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">{t('settings.changeEmail')}</h2>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
              {t('auth.email')}: <strong>{user?.email}</strong>
            </p>
            <form onSubmit={handleChangeEmail} className="space-y-4">
              <Input
                type="email"
                label={t('settings.newEmail')}
                value={newEmail}
                onChange={(e) => setNewEmail(e.target.value)}
                required
              />
              <Input
                type="password"
                label={t('auth.password')}
                value={emailPassword}
                onChange={(e) => setEmailPassword(e.target.value)}
                required
                placeholder={t('settings.currentPassword')}
              />
              <Button type="submit" disabled={loading} className="w-full sm:w-auto">
                {t('settings.changeEmail')}
              </Button>
            </form>
          </Card>

          {/* アカウント削除 */}
          <Card className="p-6 border-red-200 dark:border-red-800">
            <h2 className="text-lg font-semibold mb-4 text-red-600 dark:text-red-400">{t('settings.deleteAccount')}</h2>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
              {t('settings.deleteAccountConfirm')}
            </p>
            {!showDeleteConfirm ? (
              <Button
                variant="danger"
                onClick={() => setShowDeleteConfirm(true)}
                className="w-full sm:w-auto"
              >
                {t('settings.deleteAccountButton')}
              </Button>
            ) : (
              <div className="space-y-4">
                <p className="text-sm font-medium text-red-600 dark:text-red-400">
                  {t('settings.deleteAccountConfirm')}
                </p>
                <Input
                  type="password"
                  label={t('auth.password')}
                  value={deletePassword}
                  onChange={(e) => setDeletePassword(e.target.value)}
                  placeholder={t('auth.password')}
                />
                <div className="flex space-x-3">
                  <Button
                    variant="danger"
                    onClick={handleDeleteAccount}
                    disabled={loading || !deletePassword}
                  >
                    {t('common.delete')}
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => {
                      setShowDeleteConfirm(false)
                      setDeletePassword('')
                    }}
                  >
                    {t('common.cancel')}
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