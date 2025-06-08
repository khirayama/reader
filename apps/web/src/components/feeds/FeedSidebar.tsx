'use client'

import type React from 'react'
import { useState, useEffect } from 'react'
import { sdk } from '@/lib/sdk'
// Feed型を直接定義
interface Feed {
  id: string
  title: string
  url: string
  siteUrl?: string
  description?: string
  favicon?: string
  userId: string
  lastFetchedAt?: string
  createdAt: string
  updatedAt: string
  _count?: {
    articles: number
  }
}
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Card } from '@/components/ui/Card'
import { useToast } from '@/components/ui/Toast'

interface FeedSidebarProps {
  selectedFeedId?: string
  onFeedSelect: (feedId: string | null) => void
  onFeedRefresh: () => void
}

export function FeedSidebar({ selectedFeedId, onFeedSelect, onFeedRefresh }: FeedSidebarProps) {
  const { addToast } = useToast()
  const [feeds, setFeeds] = useState<Feed[]>([])
  const [newFeedUrl, setNewFeedUrl] = useState('')
  const [loading, setLoading] = useState(false)
  const [addingFeed, setAddingFeed] = useState(false)
  const [refreshingAll, setRefreshingAll] = useState(false)

  useEffect(() => {
    loadFeeds()
  }, [])

  const loadFeeds = async () => {
    try {
      setLoading(true)
      const response = await sdk.feeds.getAll()
      setFeeds(response)
    } catch (error) {
      console.error('フィード読み込みエラー:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleAddFeed = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newFeedUrl.trim()) return

    try {
      setAddingFeed(true)
      await sdk.feeds.create({ url: newFeedUrl.trim() })
      setNewFeedUrl('')
      await loadFeeds()
      onFeedRefresh()
      addToast({
        type: 'success',
        title: 'フィード追加完了',
        message: 'フィードが正常に追加されました。'
      })
    } catch (error) {
      console.error('フィード追加エラー:', error)
      addToast({
        type: 'error',
        title: 'フィード追加エラー',
        message: 'フィードの追加に失敗しました。URLを確認してください。'
      })
    } finally {
      setAddingFeed(false)
    }
  }

  const handleDeleteFeed = async (feedId: string) => {
    if (!confirm('このフィードを削除しますか？')) return

    try {
      await sdk.feeds.delete(feedId)
      await loadFeeds()
      if (selectedFeedId === feedId) {
        onFeedSelect(null)
      }
      onFeedRefresh()
    } catch (error) {
      console.error('フィード削除エラー:', error)
      addToast({
        type: 'error',
        title: 'フィード削除エラー',
        message: 'フィードの削除に失敗しました。'
      })
    }
  }

  const handleRefreshAll = async () => {
    try {
      setRefreshingAll(true)
      await sdk.feeds.refreshAll()
      await loadFeeds()
      onFeedRefresh()
      addToast({
        type: 'success',
        title: 'フィード更新完了',
        message: 'すべてのフィードが更新されました。'
      })
    } catch (error) {
      console.error('全フィード更新エラー:', error)
      addToast({
        type: 'error',
        title: 'フィード更新エラー',
        message: 'フィードの更新に失敗しました。'
      })
    } finally {
      setRefreshingAll(false)
    }
  }

  return (
    <div className="h-full flex flex-col bg-white dark:bg-gray-800">
      {/* フィード管理セクション */}
      <div className="p-4 border-b border-gray-200 dark:border-gray-700">
        <h2 className="text-base font-semibold text-gray-900 dark:text-white mb-3">フィード</h2>

        {/* フィード追加フォーム */}
        <form onSubmit={handleAddFeed} className="space-y-2 mb-3">
          <Input
            type="url"
            placeholder="フィードURLを追加..."
            value={newFeedUrl}
            onChange={(e) => setNewFeedUrl(e.target.value)}
            disabled={addingFeed}
            className="text-sm"
          />
          <Button 
            type="submit" 
            disabled={addingFeed || !newFeedUrl.trim()} 
            className="w-full text-sm py-2"
            size="sm"
          >
            {addingFeed ? '追加中...' : '追加'}
          </Button>
        </form>

        {/* 操作ボタン */}
        <div className="space-y-2">
          <Button
            variant={selectedFeedId ? 'outline' : 'primary'}
            onClick={() => onFeedSelect(null)}
            className="w-full text-sm py-2"
            size="sm"
          >
            すべて
          </Button>
          <Button
            variant="outline"
            onClick={handleRefreshAll}
            disabled={refreshingAll}
            className="w-full text-sm py-2"
            size="sm"
          >
            {refreshingAll ? '更新中...' : '更新'}
          </Button>
        </div>
      </div>

      {/* フィード一覧 */}
      <div className="flex-1 overflow-y-auto">
        {loading ? (
          <div className="p-4 text-center text-sm text-gray-500 dark:text-gray-400">読み込み中...</div>
        ) : feeds.length === 0 ? (
          <div className="p-4 text-center text-sm text-gray-500 dark:text-gray-400">フィードがありません</div>
        ) : (
          <div className="p-2">
            {feeds.map((feed) => (
              <div
                key={feed.id}
                className={`group p-3 cursor-pointer rounded-md transition-colors hover:bg-gray-50 dark:hover:bg-gray-700 ${
                  selectedFeedId === feed.id
                    ? 'bg-blue-50 dark:bg-blue-900/30 border-l-2 border-blue-500'
                    : ''
                }`}
                onClick={() => onFeedSelect(feed.id)}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2 flex-1 min-w-0">
                    {feed.favicon && (
                      <img
                        src={feed.favicon}
                        alt=""
                        className="w-4 h-4 rounded flex-shrink-0"
                        onError={(e) => {
                          e.currentTarget.style.display = 'none'
                        }}
                      />
                    )}
                    <div className="min-w-0 flex-1">
                      <div className="text-sm font-medium text-gray-900 dark:text-white truncate">
                        {feed.title}
                      </div>
                      {feed._count && (
                        <div className="text-xs text-gray-500 dark:text-gray-400">
                          {feed._count.articles}
                        </div>
                      )}
                    </div>
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      handleDeleteFeed(feed.id)
                    }}
                    className="opacity-0 group-hover:opacity-100 text-gray-400 hover:text-red-500 transition-opacity p-1"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
