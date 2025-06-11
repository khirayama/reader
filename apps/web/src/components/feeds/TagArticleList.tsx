'use client'

import type React from 'react'
import type { TaggedArticleGroup } from '@/hooks/useTaggedArticles'
import { Button } from '@/components/ui/Button'

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

  if (group.loading && group.articles.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center h-full">
        <div className="text-gray-500 dark:text-gray-400">読み込み中...</div>
      </div>
    )
  }

  if (group.articles.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center h-full">
        <div className="text-center">
          <div className="text-6xl mb-4">📰</div>
          <div className="text-gray-500 dark:text-gray-400 text-lg mb-2">
            {group.id === '__all__' ? '記事がありません' : `「${group.name}」の記事がありません`}
          </div>
          <div className="text-gray-400 dark:text-gray-500 text-sm">
            {group.id === '__all__' 
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
              className="p-3 hover:bg-neutral-50 dark:hover:bg-neutral-800/50 transition-colors duration-200 group cursor-pointer"
              onClick={() => onArticleClick(article.url, article.id)}
            >
              <div className="flex items-center justify-between">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
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
                    <span className="text-xs text-neutral-500 dark:text-neutral-400 truncate">
                      {article.feed?.title}
                    </span>
                    <span className="text-xs text-neutral-300 dark:text-neutral-600">•</span>
                    <time className="text-xs text-neutral-500 dark:text-neutral-400 flex-shrink-0">
                      {formatDate(article.publishedAt)}
                    </time>
                    {article.isRead && (
                      <span className="text-xs px-1.5 py-0.5 bg-neutral-100 text-neutral-600 dark:bg-neutral-700 dark:text-neutral-300 rounded">
                        読了済み
                      </span>
                    )}
                  </div>
                  <h4 className={`text-sm font-medium leading-tight group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors duration-200 ${
                    article.isRead
                      ? 'text-neutral-600 dark:text-neutral-400'
                      : 'text-neutral-900 dark:text-neutral-100'
                  }`}>
                    {article.title}
                  </h4>

                  {article.description && (
                    <p className="text-xs text-neutral-500 dark:text-neutral-400 line-clamp-1 mt-1">
                      {article.description}
                    </p>
                  )}
                </div>

                <div className="flex items-center gap-2 ml-4">
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      onToggleBookmark(article.id, !!article.isBookmarked)
                    }}
                    className={`p-1.5 rounded hover:bg-neutral-100 dark:hover:bg-neutral-700 transition-colors ${
                      article.isBookmarked
                        ? 'text-warning-600 dark:text-warning-400'
                        : 'text-neutral-400 dark:text-neutral-500'
                    }`}
                    title={article.isBookmarked ? 'ブックマーク解除' : 'ブックマーク'}
                  >
                    <svg className="w-4 h-4" fill={article.isBookmarked ? 'currentColor' : 'none'} stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
                    </svg>
                  </button>
                  {!article.isRead && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        onMarkAsRead(article.id)
                      }}
                      className="p-1.5 rounded hover:bg-neutral-100 dark:hover:bg-neutral-700 transition-colors text-success-600 dark:text-success-400"
                      title="既読にする"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    </button>
                  )}
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      window.open(article.url, '_blank')
                    }}
                    className="p-1.5 rounded hover:bg-neutral-100 dark:hover:bg-neutral-700 transition-colors text-primary-600 dark:text-primary-400"
                    title="記事を開く"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                    </svg>
                  </button>
                </div>
              </div>
            </article>
          ))}

          {group.hasMore && (
            <div className="text-center py-4 border-t border-neutral-200 dark:border-neutral-700">
              <Button 
                onClick={onLoadMore} 
                disabled={group.loading} 
                loading={group.loading}
                variant="outline" 
                size="sm"
              >
                {group.loading ? '読み込み中...' : 'さらに読み込む'}
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}