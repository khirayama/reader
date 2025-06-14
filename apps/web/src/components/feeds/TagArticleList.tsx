'use client'

import type React from 'react'
import { useEffect, useRef, useCallback } from 'react'
import type { TaggedArticleGroup } from '@/hooks/useTaggedArticles'

interface TagArticleListProps {
  group: TaggedArticleGroup
  onLoadMore: () => void
  onMarkAsRead: (articleId: string) => void
  onToggleBookmark: (articleId: string, isBookmarked: boolean) => void
  onArticleClick: (articleUrl: string, articleId: string) => void
}

export function TagArticleList({
  group,
  onLoadMore,
  onMarkAsRead,
  onToggleBookmark,
  onArticleClick
}: TagArticleListProps) {
  const observerRef = useRef<IntersectionObserver | null>(null)
  const loadMoreRef = useRef<HTMLDivElement | null>(null)
  const isLoadingRef = useRef(false)

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

  // 無限スクロールのための自動読み込み
  const handleLoadMore = useCallback(() => {
    if (isLoadingRef.current || !group.hasMore || group.loading) return
    
    isLoadingRef.current = true
    onLoadMore()
    
    // 読み込み完了後にフラグをリセット
    setTimeout(() => {
      isLoadingRef.current = false
    }, 1000)
  }, [onLoadMore, group.hasMore, group.loading])

  // Intersection Observer のセットアップ
  useEffect(() => {
    if (!loadMoreRef.current) return

    observerRef.current = new IntersectionObserver(
      (entries) => {
        const [entry] = entries
        if (entry.isIntersecting) {
          handleLoadMore()
        }
      },
      {
        threshold: 0.1,
        rootMargin: '100px',
      }
    )

    observerRef.current.observe(loadMoreRef.current)

    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect()
      }
    }
  }, [handleLoadMore])

  // 記事リストが変更された時にロード状態をリセット
  useEffect(() => {
    isLoadingRef.current = false
  }, [group.articles.length])

  if (group.loading && group.articles.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center h-full">
        <div className="text-gray-500 dark:text-gray-400">読み込み中...</div>
      </div>
    )
  }

  if (group.articles.length === 0) {
    // ブックマーク専用のメッセージ処理
    const isBookmarks = group.id === '__bookmarks__' || group.name === 'お気に入り記事'
    
    return (
      <div className="flex-1 flex items-center justify-center h-full">
        <div className="text-center">
          <div className="text-6xl mb-4">{isBookmarks ? '⭐' : '📰'}</div>
          <div className="text-gray-500 dark:text-gray-400 text-lg mb-2">
            {isBookmarks 
              ? 'お気に入り記事がありません'
              : group.id === '__all__' 
                ? '記事がありません' 
                : `「${group.name}」の記事がありません`
            }
          </div>
          <div className="text-gray-400 dark:text-gray-500 text-sm">
            {isBookmarks
              ? '記事をブックマークするとここに表示されます'
              : group.id === '__all__' 
                ? 'フィードを追加して記事を読み始めましょう'
                : 'このタグの記事が更新されるまでお待ちください'
            }
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
          {group.articles.map((article) => (
            <article 
              key={article.id} 
              className={`px-3 py-2 hover:bg-neutral-50 dark:hover:bg-neutral-800/50 transition-colors duration-200 group cursor-pointer ${
                article.isRead ? 'opacity-50' : ''
              }`}
              onClick={() => onArticleClick(article.url, article.id)}
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
                      onToggleBookmark(article.id, !!article.isBookmarked)
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

          {/* 無限スクロール用のトリガー要素 */}
          {group.hasMore && (
            <div 
              ref={loadMoreRef}
              className="text-center py-4 border-t border-neutral-200 dark:border-neutral-700"
            >
              {group.loading ? (
                <div className="flex items-center justify-center gap-2 text-neutral-500 dark:text-neutral-400">
                  <svg className="w-4 h-4 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                  <span className="text-sm">読み込み中...</span>
                </div>
              ) : (
                <div className="text-xs text-neutral-400 dark:text-neutral-500">
                  スクロールして続きを読み込み
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}