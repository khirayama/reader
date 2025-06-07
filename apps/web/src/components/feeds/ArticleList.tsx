'use client'

import type React from 'react'
import { useState, useEffect } from 'react'
import { sdk } from '@/lib/sdk'
import type { Article } from '@/lib/rss-sdk'
import { Card } from '@/components/ui/Card'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'

interface ArticleListProps {
  selectedFeedId?: string
}

export function ArticleList({ selectedFeedId }: ArticleListProps) {
  const [articles, setArticles] = useState<Article[]>([])
  const [loading, setLoading] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [page, setPage] = useState(1)
  const [hasMore, setHasMore] = useState(false)

  useEffect(() => {
    loadArticles(true)
  }, [selectedFeedId, searchTerm])

  const loadArticles = async (reset = false) => {
    try {
      setLoading(true)
      const currentPage = reset ? 1 : page

      let response
      if (selectedFeedId) {
        response = await sdk.feeds.getFeedArticles(selectedFeedId, {
          page: currentPage,
          limit: 20,
          search: searchTerm || undefined,
        })
      } else {
        response = await sdk.articles.getArticles({
          page: currentPage,
          limit: 20,
          search: searchTerm || undefined,
        })
      }

      if (reset) {
        setArticles(response.articles)
        setPage(2)
      } else {
        setArticles((prev) => [...prev, ...response.articles])
        setPage((prev) => prev + 1)
      }

      setHasMore(response.pagination.hasNext)
    } catch (error) {
      console.error('記事読み込みエラー:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    loadArticles(true)
  }

  const handleMarkAsRead = async (articleId: string) => {
    try {
      await sdk.articles.markAsRead(articleId)
      setArticles((prev) =>
        prev.map((article) =>
          article.id === articleId
            ? { ...article, isRead: true, readAt: new Date().toISOString() }
            : article
        )
      )
    } catch (error) {
      console.error('既読マークエラー:', error)
    }
  }

  const handleToggleBookmark = async (articleId: string, isBookmarked: boolean) => {
    try {
      if (isBookmarked) {
        await sdk.articles.removeBookmark(articleId)
      } else {
        await sdk.articles.addBookmark(articleId)
      }

      setArticles((prev) =>
        prev.map((article) =>
          article.id === articleId
            ? {
                ...article,
                isBookmarked: !isBookmarked,
                bookmarkedAt: !isBookmarked ? new Date().toISOString() : undefined,
              }
            : article
        )
      )
    } catch (error) {
      console.error('ブックマーク操作エラー:', error)
    }
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('ja-JP', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden">
      {/* ヘッダー */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 p-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
            {selectedFeedId ? 'フィード記事' : 'すべての記事'}
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

      {/* 記事一覧 */}
      <div className="flex-1 overflow-y-auto bg-gray-50 dark:bg-gray-900">
        {loading && articles.length === 0 ? (
          <div className="flex items-center justify-center h-32">
            <div className="text-gray-500 dark:text-gray-400">読み込み中...</div>
          </div>
        ) : articles.length === 0 ? (
          <div className="flex items-center justify-center h-32">
            <div className="text-gray-500 dark:text-gray-400">記事がありません</div>
          </div>
        ) : (
          <div className="divide-y divide-gray-200 dark:divide-gray-700">
            {articles.map((article) => (
              <div 
                key={article.id} 
                className="bg-white dark:bg-gray-800 p-4 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
              >
                <div className="flex items-start gap-3">
                  <div className="flex-1 min-w-0">
                    {/* メタ情報 */}
                    <div className="flex items-center gap-2 mb-2 text-xs text-gray-500 dark:text-gray-400">
                      {article.feed?.favicon && (
                        <img
                          src={article.feed.favicon}
                          alt=""
                          className="w-4 h-4 rounded flex-shrink-0"
                          onError={(e) => {
                            e.currentTarget.style.display = 'none'
                          }}
                        />
                      )}
                      <span className="truncate">{article.feed?.title}</span>
                      <span>•</span>
                      <span>{formatDate(article.publishedAt)}</span>
                    </div>

                    {/* タイトル */}
                    <h3 className={`text-base font-medium mb-2 leading-snug ${
                      article.isRead
                        ? 'text-gray-600 dark:text-gray-400'
                        : 'text-gray-900 dark:text-white'
                    }`}>
                      <a
                        href={article.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                        onClick={() => handleMarkAsRead(article.id)}
                      >
                        {article.title}
                      </a>
                    </h3>

                    {/* 説明 */}
                    {article.description && (
                      <p 
                        className="text-sm text-gray-600 dark:text-gray-400"
                        style={{
                          display: '-webkit-box',
                          WebkitLineClamp: 2,
                          WebkitBoxOrient: 'vertical',
                          overflow: 'hidden'
                        }}
                      >
                        {article.description}
                      </p>
                    )}
                  </div>

                  {/* アクションボタン */}
                  <div className="flex flex-col items-center gap-2 flex-shrink-0">
                    <button
                      onClick={() => handleToggleBookmark(article.id, !!article.isBookmarked)}
                      className={`p-1 rounded transition-colors ${
                        article.isBookmarked
                          ? 'text-yellow-500 hover:text-yellow-600'
                          : 'text-gray-400 hover:text-yellow-500'
                      }`}
                      title={article.isBookmarked ? 'ブックマーク解除' : 'ブックマーク'}
                    >
                      <svg className="w-4 h-4" fill={article.isBookmarked ? 'currentColor' : 'none'} stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
                      </svg>
                    </button>

                    {!article.isRead && (
                      <button
                        onClick={() => handleMarkAsRead(article.id)}
                        className="p-1 text-gray-400 hover:text-blue-500 rounded transition-colors"
                        title="既読にする"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}

            {hasMore && (
              <div className="p-4 text-center bg-white dark:bg-gray-800">
                <Button onClick={() => loadArticles(false)} disabled={loading} variant="outline" size="sm">
                  {loading ? '読み込み中...' : 'さらに読み込む'}
                </Button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
