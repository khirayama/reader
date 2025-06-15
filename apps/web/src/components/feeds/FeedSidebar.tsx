'use client'

import type React from 'react'
import { useState, useEffect } from 'react'
import { sdk } from '@/lib/sdk'
import type { Feed, Tag } from '@/lib/rss-sdk'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Card } from '@/components/ui/Card'
import { useToast } from '@/components/ui/Toast'
import { FeedTagManager } from './FeedTagManager'
import Link from 'next/link'
import { useAuth } from '@/contexts/AuthContext'
import { useRouter } from 'next/navigation'

interface FeedSidebarProps {
  selectedFeedId?: string | null
  onFeedSelect: (feedId: string | null) => void
  onFeedRefresh: () => void
}

export function FeedSidebar({ selectedFeedId, onFeedSelect, onFeedRefresh }: FeedSidebarProps) {
  const { addToast } = useToast()
  const { user, logout } = useAuth()
  const router = useRouter()
  const [feeds, setFeeds] = useState<Feed[]>([])
  const [tags, setTags] = useState<Tag[]>([])
  const [newFeedUrl, setNewFeedUrl] = useState('')
  const [loading, setLoading] = useState(false)
  const [addingFeed, setAddingFeed] = useState(false)
  const [refreshingAll, setRefreshingAll] = useState(false)
  const [managingFeed, setManagingFeed] = useState<Feed | null>(null)

  useEffect(() => {
    loadFeeds()
    loadTags()
  }, [])

  const loadFeeds = async () => {
    try {
      setLoading(true)
      const response = await sdk.feeds.getFeeds()
      setFeeds(response.feeds)
    } catch (error) {
      console.error('フィード読み込みエラー:', error)
    } finally {
      setLoading(false)
    }
  }

  const loadTags = async () => {
    try {
      const response = await sdk.tags.getTags()
      setTags(response.data.tags)
    } catch (error) {
      console.error('タグ読み込みエラー:', error)
    }
  }

  const handleAddFeed = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newFeedUrl.trim()) return

    try {
      setAddingFeed(true)
      await sdk.feeds.createFeed({ url: newFeedUrl.trim() })
      setNewFeedUrl('')
      await loadFeeds()
      await loadTags()
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
      await sdk.feeds.deleteFeed(feedId)
      await loadFeeds()
      await loadTags()
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


  const handleManageTagsClick = (feed: Feed, e: React.MouseEvent) => {
    e.stopPropagation()
    setManagingFeed(feed)
  }

  const handleTagsUpdated = async () => {
    await loadFeeds()
    await loadTags()
    onFeedRefresh()
  }

  const handleLogout = () => {
    logout()
    router.push('/')
  }

  return (
    <div className="h-full flex flex-col surface-elevated">
      {/* ロゴとユーザー情報セクション */}
      <div className="p-4 border-b divider">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-2">
            <div className="w-7 h-7 bg-gradient-to-br from-primary-500 to-primary-600 rounded flex items-center justify-center shadow-soft">
              <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 5c7.18 0 13 5.82 13 13M6 11a7 7 0 017 7m-6 0a1 1 0 11-2 0 1 1 0 012 0z" />
              </svg>
            </div>
            <h1 className="text-xl font-semibold text-neutral-900 dark:text-neutral-100">RSS Reader</h1>
          </div>
          <button
            onClick={handleLogout}
            className="p-1.5 text-neutral-600 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-700 rounded touch-target focus-visible transition-all duration-200"
            aria-label="ログアウト"
            title="ログアウト"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
          </button>
        </div>
      </div>

      {/* フィード管理セクション */}
      <div className="p-4 border-b divider">
        <h2 className="text-lg font-semibold mb-3 flex items-center gap-2 text-neutral-900 dark:text-neutral-100">
          <svg className="w-5 h-5 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 5c7.18 0 13 5.82 13 13M6 11a7 7 0 017 7m-6 0a1 1 0 11-2 0 1 1 0 012 0z" />
          </svg>
          フィード管理
        </h2>

        {/* フィード追加フォーム */}
        <form onSubmit={handleAddFeed} className="space-y-2 mb-3">
          <Input
            type="url"
            placeholder="RSS フィードのURLを入力..."
            value={newFeedUrl}
            onChange={(e) => setNewFeedUrl(e.target.value)}
            disabled={addingFeed}
          />
          <Button 
            type="submit" 
            disabled={addingFeed || !newFeedUrl.trim()}
            loading={addingFeed}
            fullWidth
            icon={
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
            }
          >
            {addingFeed ? 'フィード追加中...' : 'フィードを追加'}
          </Button>
        </form>

        {/* 操作ボタン */}
        <div>
          <Button
            variant="secondary"
            fullWidth
            onClick={handleRefreshAll}
            disabled={refreshingAll}
            loading={refreshingAll}
            size="sm"
            icon={
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
            }
          >
            {refreshingAll ? '更新中' : '更新'}
          </Button>
        </div>
      </div>

      {/* すべてのフィード・お気に入り（Sticky） */}
      <div className="sticky top-0 z-10 bg-white dark:bg-gray-800 border-b border-neutral-200 dark:border-neutral-700">
        <div className="p-2 space-y-1">
          {/* すべてのフィード */}
          <div
            className={`group relative py-2 px-2 cursor-pointer transition-colors duration-200 ${
              !selectedFeedId
                ? 'bg-primary-50 dark:bg-primary-900/20 border-l-2 border-primary-500'
                : 'hover:bg-neutral-50 dark:hover:bg-neutral-800/50'
            }`}
            onClick={() => onFeedSelect(null)}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2 flex-1 min-w-0">
                <div className="w-4 h-4 flex-shrink-0 flex items-center justify-center bg-gradient-to-br from-primary-500 to-primary-600 rounded text-white text-xs font-bold">
                  全
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-neutral-900 dark:text-neutral-100 truncate">
                      すべてのフィード
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          {/* お気に入り記事 */}
          <div
            className={`group relative py-2 px-2 cursor-pointer transition-colors duration-200 ${
              selectedFeedId === 'bookmarks'
                ? 'bg-primary-50 dark:bg-primary-900/20 border-l-2 border-primary-500'
                : 'hover:bg-neutral-50 dark:hover:bg-neutral-800/50'
            }`}
            onClick={() => onFeedSelect('bookmarks')}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2 flex-1 min-w-0">
                <div className="w-4 h-4 flex-shrink-0 flex items-center justify-center bg-gradient-to-br from-yellow-100 to-yellow-200 dark:from-yellow-200 dark:to-yellow-300 rounded">
                  <svg className="w-3 h-3 text-yellow-600 dark:text-yellow-500" fill="currentColor" stroke="none" viewBox="0 0 24 24">
                    <path d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
                  </svg>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-neutral-900 dark:text-neutral-100 truncate">
                      お気に入り記事
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* フィード一覧 */}
      <div className="flex-1 overflow-y-auto">
        {loading ? (
          <div className="p-4 text-center">
            <div className="inline-flex items-center gap-2 text-neutral-500 dark:text-neutral-400">
              <svg className="w-4 h-4 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              <span className="text-sm">読み込み中...</span>
            </div>
          </div>
        ) : feeds.length === 0 ? (
          <div className="p-4 text-center">
            <div className="mb-4">
              <svg className="w-12 h-12 mx-auto text-neutral-300 dark:text-neutral-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 5c7.18 0 13 5.82 13 13M6 11a7 7 0 717 7m-6 0a1 1 0 11-2 0 1 1 0 012 0z" />
              </svg>
            </div>
            <p className="text-sm text-neutral-500 dark:text-neutral-400 mb-2">フィードがありません</p>
            <p className="text-xs text-neutral-400 dark:text-neutral-500">上のフォームからRSSフィードを追加してください</p>
          </div>
        ) : (
          <div className="p-2">
            <div className="mb-2">
              <h3 className="text-xs text-neutral-500 dark:text-neutral-400 uppercase tracking-wider font-semibold px-2">
                フィード ({feeds.length})
              </h3>
            </div>
            <div className="divide-y divide-neutral-200 dark:divide-neutral-700">
              {feeds.map((feed) => (
                <div
                  key={feed.id}
                  className={`group relative py-2 px-2 cursor-pointer transition-colors duration-200 ${
                    selectedFeedId === feed.id
                      ? 'bg-primary-50 dark:bg-primary-900/20 border-l-2 border-primary-500'
                      : 'hover:bg-neutral-50 dark:hover:bg-neutral-800/50'
                  }`}
                  onClick={() => onFeedSelect(feed.id)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2 flex-1 min-w-0">
                        {feed.favicon ? (
                          <img
                            src={feed.favicon}
                            alt=""
                            className="w-4 h-4 rounded flex-shrink-0"
                            onError={(e) => {
                              e.currentTarget.style.display = 'none'
                            }}
                          />
                        ) : (
                          <div className="w-4 h-4 rounded bg-neutral-200 dark:bg-neutral-700 flex-shrink-0 flex items-center justify-center">
                            <svg className="w-2.5 h-2.5 text-neutral-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 5c7.18 0 13 5.82 13 13M6 11a7 7 0 017 7m-6 0a1 1 0 11-2 0 1 1 0 012 0z" />
                            </svg>
                          </div>
                        )}
                        <div className="min-w-0 flex-1">
                          <div className={`text-sm font-medium truncate ${
                            selectedFeedId === feed.id
                              ? 'text-primary-700 dark:text-primary-300'
                              : 'text-neutral-900 dark:text-neutral-100'
                          }`}>
                            {feed.title}
                          </div>
                          {feed.tags && feed.tags.length > 0 && (
                            <div className="flex gap-1 mt-1">
                              {feed.tags.slice(0, 2).map((tag) => (
                                <span
                                  key={tag.id}
                                  className="inline-block px-1.5 py-0.5 text-xs rounded-full text-white"
                                  style={{ backgroundColor: tag.color || '#6B7280' }}
                                >
                                  {tag.name}
                                </span>
                              ))}
                              {feed.tags.length > 2 && (
                                <span className="text-xs text-neutral-400">+{feed.tags.length - 2}</span>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                      {feed._count && (
                        <span className="text-xs text-neutral-500 dark:text-neutral-400 ml-2">
                          {feed._count.articles}
                        </span>
                      )}
                      
                      <div className="flex items-center gap-1 ml-1">
                        {/* タグ管理ボタン */}
                        <button
                          onClick={(e) => handleManageTagsClick(feed, e)}
                          className="opacity-0 group-hover:opacity-100 text-neutral-400 hover:text-primary-500 transition-all duration-200 p-1 rounded hover:bg-primary-50 dark:hover:bg-primary-900/20 touch-target"
                          title="タグを管理"
                        >
                          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                          </svg>
                        </button>
                        
                        {/* 削除ボタン */}
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            handleDeleteFeed(feed.id)
                          }}
                          className="opacity-0 group-hover:opacity-100 text-neutral-400 hover:text-error-500 transition-all duration-200 p-1 rounded hover:bg-error-50 dark:hover:bg-error-900/20 touch-target"
                          title="フィードを削除"
                        >
                          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* サイドバー固定フッター */}
      <div className="border-t divider bg-white dark:bg-gray-800">
        {/* 設定セクション */}
        <div className="p-4">
          <Link href="/settings">
            <Button
              variant="outline"
              fullWidth
              size="sm"
              icon={
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              }
            >
              設定
            </Button>
          </Link>
        </div>
      </div>

      {/* フィードタグ管理モーダル */}
      {managingFeed && (
        <FeedTagManager
          feed={managingFeed}
          isOpen={!!managingFeed}
          onClose={() => setManagingFeed(null)}
          onTagsUpdated={handleTagsUpdated}
        />
      )}
    </div>
  )
}
