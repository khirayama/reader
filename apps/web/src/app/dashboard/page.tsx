'use client'

import React, { useState } from 'react'
import { AuthGuard } from '@/components/auth/AuthGuard'
import { useAuth } from '@/contexts/AuthContext'
import { Button } from '@/components/ui/Button'
import { FeedSidebar } from '@/components/feeds/FeedSidebar'
import { ArticleList } from '@/components/feeds/ArticleList'
import Link from 'next/link'

export default function DashboardPage() {
  const { user, logout } = useAuth()
  const [selectedFeedId, setSelectedFeedId] = useState<string | null>(null)
  const [refreshKey, setRefreshKey] = useState(0)
  const [sidebarOpen, setSidebarOpen] = useState(false)

  const handleFeedSelect = (feedId: string | null) => {
    setSelectedFeedId(feedId)
    setSidebarOpen(false) // モバイルでフィード選択時にサイドバーを閉じる
  }

  const handleFeedRefresh = () => {
    setRefreshKey((prev) => prev + 1)
  }

  return (
    <AuthGuard>
      <div className="h-screen flex flex-col bg-gray-50 dark:bg-gray-900">
        {/* ヘッダー */}
        <header className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-4 py-3 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <button
              type="button"
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="md:hidden p-2 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md"
              aria-label="メニューを開く"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
            <h1 className="text-xl font-semibold text-gray-900 dark:text-white">RSS Reader</h1>
          </div>
          <div className="flex items-center space-x-3">
            <span className="hidden sm:block text-sm text-gray-600 dark:text-gray-300">{user?.email}</span>
            <Link href="/settings">
              <Button variant="outline" size="sm" className="text-sm">
                設定
              </Button>
            </Link>
            <Button variant="outline" size="sm" onClick={logout} className="text-sm">
              ログアウト
            </Button>
          </div>
        </header>

        {/* メインコンテンツ */}
        <div className="flex-1 flex overflow-hidden">
          {/* サイドバー */}
          <div className={`${
            sidebarOpen ? 'translate-x-0' : '-translate-x-full'
          } md:translate-x-0 transition-transform duration-200 ease-in-out fixed md:static inset-y-0 left-0 z-30 w-80 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700`}>
            <FeedSidebar
              selectedFeedId={selectedFeedId || undefined}
              onFeedSelect={handleFeedSelect}
              onFeedRefresh={handleFeedRefresh}
            />
          </div>

          {/* オーバーレイ (モバイルのみ) */}
          {sidebarOpen && (
            <div
              className="md:hidden fixed inset-0 bg-black bg-opacity-50 z-20"
              onClick={() => setSidebarOpen(false)}
              onKeyDown={(e) => {
                if (e.key === 'Escape') {
                  setSidebarOpen(false)
                }
              }}
              role="button"
              tabIndex={0}
              aria-label="メニューを閉じる"
            />
          )}

          {/* 記事一覧 */}
          <div className="flex-1 overflow-hidden">
            <ArticleList
              key={`${selectedFeedId}-${refreshKey}`}
              selectedFeedId={selectedFeedId || undefined}
            />
          </div>
        </div>
      </div>
    </AuthGuard>
  )
}
