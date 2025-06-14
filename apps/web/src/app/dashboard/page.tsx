'use client'

import React, { useState, useEffect } from 'react'
import { AuthGuard } from '@/components/auth/AuthGuard'
import { Button } from '@/components/ui/Button'
import { FeedSidebar } from '@/components/feeds/FeedSidebar'
import { ArticleList } from '@/components/feeds/ArticleList'

export default function DashboardPage() {
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
      <div className="h-screen flex overflow-hidden surface">
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
          <ArticleList
            key={`${selectedFeedId}-${refreshKey}`}
            selectedFeedId={selectedFeedId}
            onToggleSidebar={() => setSidebarOpen(!sidebarOpen)}
          />
        </div>
      </div>
    </AuthGuard>
  )
}
