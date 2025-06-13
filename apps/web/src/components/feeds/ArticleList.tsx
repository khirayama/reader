'use client'

import type React from 'react'
import { useState, useEffect } from 'react'
import { TagCarouselArticleList } from './TagCarouselArticleList'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import { sdk } from '@/lib/sdk'

interface ArticleListProps {
  selectedFeedId?: string | null
}

export function ArticleList({ selectedFeedId }: ArticleListProps) {
  const [searchTerm, setSearchTerm] = useState('')
  const [currentFeedName, setCurrentFeedName] = useState('')

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
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
            {selectedFeedId ? currentFeedName : 'すべての記事'}
          </h2>
          <form onSubmit={handleSearch} className="flex gap-2 max-w-md">
            <Input
              placeholder="記事を検索..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="flex-1 text-sm"
            />
            <Button type="submit" size="sm" className="text-sm">
              検索
            </Button>
          </form>
        </div>
      </div>

      {/* タグ別カルーセル記事一覧 */}
      <TagCarouselArticleList 
        selectedFeedId={selectedFeedId}
        searchTerm={searchTerm}
      />
    </div>
  )
}
