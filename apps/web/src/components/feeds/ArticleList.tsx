'use client'

import type React from 'react'
import { useState, useEffect } from 'react'
import { TagCarouselArticleList } from './TagCarouselArticleList'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import { sdk } from '@/lib/sdk'
import { useTranslation } from 'react-i18next'

interface ArticleListProps {
  selectedFeedId?: string | null
  onToggleSidebar?: () => void
}

export function ArticleList({ selectedFeedId, onToggleSidebar }: ArticleListProps) {
  const { t } = useTranslation()
  const [searchTerm, setSearchTerm] = useState('')
  const [currentFeedName, setCurrentFeedName] = useState('')
  const [showSearch, setShowSearch] = useState(false)
  const [hideReadArticles, setHideReadArticles] = useState(false)
  const [currentTagName, setCurrentTagName] = useState(t('common.all'))

  // フィード情報を取得
  useEffect(() => {
    const fetchFeedInfo = async () => {
      if (selectedFeedId) {
        try {
          const feed = await sdk.feeds.getFeed(selectedFeedId)
          setCurrentFeedName(feed.title)
        } catch (error) {
          console.error('フィード情報取得エラー:', error)
          setCurrentFeedName('フィード記事')
        }
      } else {
        setCurrentFeedName('')
      }
    }

    fetchFeedInfo()
  }, [selectedFeedId])

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    // 検索は SimpleArticleList 内で処理される
  }

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden">
      {/* ヘッダー */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 p-3">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            {/* モバイル用ドロワーオープンボタン */}
            {onToggleSidebar && (
              <button
                type="button"
                onClick={onToggleSidebar}
                className="md:hidden p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                aria-label="メニューを開く"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              </button>
            )}
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
              {selectedFeedId 
                ? `${currentFeedName} - ${currentTagName}` 
                : currentTagName === t('common.all')
                  ? t('articles.allArticles') 
                  : currentTagName}
            </h2>
          </div>
          
          <div className="flex items-center gap-2">
            {/* 既読記事の表示/非表示切り替えボタン */}
            <button
              type="button"
              onClick={() => setHideReadArticles(!hideReadArticles)}
              className={`p-2 rounded-lg transition-colors ${
                hideReadArticles 
                  ? 'text-blue-600 bg-blue-50 hover:bg-blue-100 dark:text-blue-400 dark:bg-blue-900/20 dark:hover:bg-blue-900/30' 
                  : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700'
              }`}
              title={hideReadArticles ? '既読記事を表示' : '既読記事を非表示'}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                {hideReadArticles ? (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                )}
              </svg>
            </button>
            
            {/* 検索ボタン */}
            <button
              type="button"
              onClick={() => setShowSearch(!showSearch)}
              className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              title="検索"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </button>
          </div>
        </div>
        
        {/* 検索フィールド（トグル表示） */}
        {showSearch && (
          <form onSubmit={handleSearch} className="mt-3 flex gap-2">
            <Input
              placeholder="記事を検索..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="flex-1 text-sm"
              autoFocus
            />
            <Button type="submit" size="sm" className="text-sm">
              検索
            </Button>
          </form>
        )}
      </div>

      {/* タグ別カルーセル記事一覧 */}
      <TagCarouselArticleList 
        selectedFeedId={selectedFeedId}
        searchTerm={searchTerm}
        hideReadArticles={hideReadArticles}
        onTagChange={setCurrentTagName}
      />
    </div>
  )
}
