'use client'

import React, { useState, useEffect } from 'react'
import { AuthGuard } from '@/components/auth/AuthGuard'
import { useAuth } from '@/contexts/AuthContext'
import { Button } from '@/components/ui/Button'
import { FeedSidebar } from '@/components/feeds/FeedSidebar'
import { TaggedArticleCarousel } from '@/components/feeds/TaggedArticleCarousel'

export default function DashboardPage() {
  const { user } = useAuth()
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
      <div className="h-screen flex flex-col surface">
        {/* ヘッダー */}
        <header className="surface-elevated border-b divider px-4 py-3 flex items-center justify-between shadow-soft">
          <div className="flex items-center space-x-3">
            <button
              type="button"
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="md:hidden p-1.5 text-neutral-600 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-700 rounded touch-target focus-visible transition-all duration-200"
              aria-label={sidebarOpen ? "メニューを閉じる" : "メニューを開く"}
              aria-expanded={sidebarOpen}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                {sidebarOpen ? (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                )}
              </svg>
            </button>
            <div className="flex items-center space-x-2">
              <div className="w-7 h-7 bg-gradient-to-br from-primary-500 to-primary-600 rounded flex items-center justify-center shadow-soft">
                <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 5c7.18 0 13 5.82 13 13M6 11a7 7 0 017 7m-6 0a1 1 0 11-2 0 1 1 0 012 0z" />
                </svg>
              </div>
              <h1 className="text-xl font-semibold text-neutral-900 dark:text-neutral-100">RSS Reader</h1>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <span className="hidden sm:block text-sm text-neutral-600 dark:text-neutral-400">{user?.email}</span>
          </div>
        </header>

        {/* メインコンテンツ */}
        <div className="flex-1 flex overflow-hidden">
          {/* サイドバー */}
          <div className={`${
            sidebarOpen ? 'translate-x-0' : '-translate-x-full'
          } md:translate-x-0 transition-transform duration-300 ease-out fixed md:static inset-y-0 left-0 z-30 w-full md:w-80 surface-elevated border-r divider shadow-lg md:shadow-none`}>
            <FeedSidebar
              selectedFeedId={selectedFeedId}
              onFeedSelect={handleFeedSelect}
              onFeedRefresh={handleFeedRefresh}
            />
          </div>

          {/* オーバーレイ (モバイルのみ) */}
          {sidebarOpen && (
            <div
              className="md:hidden fixed inset-0 bg-neutral-900/50 backdrop-blur-sm z-20 cursor-pointer animate-fade-in"
              onClick={() => setSidebarOpen(false)}
              onKeyDown={(e) => {
                if (e.key === 'Escape' || e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault()
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
            <TaggedArticleCarousel
              key={`${selectedFeedId}-${refreshKey}`}
              selectedFeedId={selectedFeedId}
            />
          </div>
        </div>
      </div>
    </AuthGuard>
  )
}
