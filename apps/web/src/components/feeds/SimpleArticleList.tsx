'use client'

import React, { useState, useEffect } from 'react'
import { sdk } from '@/lib/sdk'
import type { Article, Pagination } from '@/lib/rss-sdk'
import { Button } from '@/components/ui/Button'

interface SimpleArticleListProps {
  selectedFeedId?: string | null
  searchTerm?: string
}

export function SimpleArticleList({ selectedFeedId, searchTerm }: SimpleArticleListProps) {
  const [articles, setArticles] = useState<Article[]>([])
  const [pagination, setPagination] = useState<Pagination | null>(null)
  const [loading, setLoading] = useState(false)
  const [page, setPage] = useState(1)

  // 記事取得
  const loadArticles = async (pageNum = 1, reset = false) => {
    try {
      console.log('[SimpleArticleList] 記事読み込み開始:', { pageNum, reset, selectedFeedId, searchTerm })
      setLoading(true)
      
      const params: {
        page: number
        limit: number
        feedId?: string
        search?: string
      } = {
        page: pageNum,
        limit: 20,
      }

      if (selectedFeedId) {
        params.feedId = selectedFeedId
      }

      if (searchTerm) {
        params.search = searchTerm
      }

      console.log('[SimpleArticleList] API呼び出し開始:', params)
      const response = await sdk.articles.getAll(params)
      console.log('[SimpleArticleList] API呼び出し完了:', response.articles.length, '件取得')
      
      setArticles(prev => reset ? response.articles : [...prev, ...response.articles])
      setPagination(response.pagination)
      setPage(pageNum)
    } catch (error) {
      console.error('[SimpleArticleList] 記事取得エラー:', error)
    } finally {
      setLoading(false)
    }
  }

  // 初期読み込みと条件変更時の再読み込み
  useEffect(() => {
    console.log('[SimpleArticleList] useEffect発火:', { selectedFeedId, searchTerm })
    loadArticles(1, true)
  }, [selectedFeedId, searchTerm])

  // さらに読み込む
  const handleLoadMore = () => {
    if (pagination?.hasNext && !loading) {
      loadArticles(page + 1, false)
    }
  }

  // 記事の既読マーク
  const markArticleAsRead = async (articleId: string) => {
    try {
      await sdk.articles.markRead(articleId)
      setArticles(prev => 
        prev.map(article =>
          article.id === articleId
            ? { ...article, isRead: true, readAt: new Date().toISOString() }
            : article
        )
      )
    } catch (error) {
      console.error('既読マークエラー:', error)
    }
  }

  // ブックマーク切り替え
  const toggleBookmark = async (articleId: string, isBookmarked: boolean) => {
    try {
      if (isBookmarked) {
        await sdk.articles.unbookmark(articleId)
      } else {
        await sdk.articles.bookmark(articleId)
      }

      setArticles(prev => 
        prev.map(article =>
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

  // 記事クリック処理
  const handleArticleClick = async (articleUrl: string, articleId: string) => {
    await markArticleAsRead(articleId)
    window.open(articleUrl, '_blank')
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

  if (loading && articles.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center h-full">
        <div className="text-gray-500 dark:text-gray-400">読み込み中...</div>
      </div>
    )
  }

  if (articles.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center h-full">
        <div className="text-center">
          <div className="text-6xl mb-4">📰</div>
          <div className="text-gray-500 dark:text-gray-400 text-lg mb-2">
            記事がありません
          </div>
          <div className="text-gray-400 dark:text-gray-500 text-sm">
            フィードを追加して記事を読み始めましょう
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden">
      {/* 記事一覧 */}
      <div className="flex-1 overflow-y-auto surface">
        <div className="divide-y divide-neutral-200 dark:divide-neutral-700">
          {articles.map((article) => (
            <article 
              key={article.id} 
              className={`px-3 py-2 hover:bg-neutral-50 dark:hover:bg-neutral-800/50 transition-colors duration-200 group cursor-pointer ${
                article.isRead ? 'opacity-50' : ''
              }`}
              onClick={() => handleArticleClick(article.url, article.id)}
            >
              <div>
                {/* 上部行：フィード情報（左）とお気に入りボタン（右） */}
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-2">
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
                    <span className={`text-sm font-medium truncate ${
                      article.isRead
                        ? 'text-neutral-400 dark:text-neutral-600'
                        : 'text-neutral-700 dark:text-neutral-300'
                    }`}>
                      {article.feed?.title}
                    </span>
                    <span className="text-xs text-neutral-300 dark:text-neutral-600">•</span>
                    <time className={`text-sm flex-shrink-0 ${
                      article.isRead
                        ? 'text-neutral-400 dark:text-neutral-600'
                        : 'text-neutral-500 dark:text-neutral-400'
                    }`}>
                      {formatDate(article.publishedAt)}
                    </time>
                  </div>
                  
                  {/* お気に入りボタン */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      toggleBookmark(article.id, !!article.isBookmarked)
                    }}
                    className={`p-2 rounded-full hover:bg-neutral-100 dark:hover:bg-neutral-700 transition-colors flex-shrink-0 ${
                      article.isBookmarked
                        ? 'text-warning-600 dark:text-warning-400'
                        : 'text-neutral-400 dark:text-neutral-500'
                    }`}
                    title={article.isBookmarked ? 'ブックマーク解除' : 'ブックマーク'}
                  >
                    <svg className="w-5 h-5" fill={article.isBookmarked ? 'currentColor' : 'none'} stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
                    </svg>
                  </button>
                </div>
                
                {/* 下部行：記事タイトル（全幅） */}
                <h4 className={`text-sm font-medium leading-tight group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors duration-200 mb-1 ${
                  article.isRead
                    ? 'text-neutral-400 dark:text-neutral-600'
                    : 'text-neutral-900 dark:text-neutral-100'
                }`}>
                  {article.title}
                </h4>
              </div>
            </article>
          ))}

          {pagination?.hasNext && (
            <div className="text-center py-4 border-t border-neutral-200 dark:border-neutral-700">
              <Button 
                onClick={handleLoadMore} 
                disabled={loading} 
                loading={loading}
                variant="outline" 
                size="sm"
              >
                {loading ? '読み込み中...' : 'さらに読み込む'}
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}