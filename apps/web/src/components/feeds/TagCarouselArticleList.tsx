'use client'

import React, { useState, useEffect, useRef, useCallback } from 'react'
import { sdk } from '@/lib/sdk'
import type { Article, Tag, Pagination } from '@/lib/rss-sdk'
import { Button } from '@/components/ui/Button'
import { useTranslation } from 'react-i18next'

interface TagCarouselArticleListProps {
  selectedFeedId?: string | null
  searchTerm?: string
  hideReadArticles?: boolean
  onTagChange?: (tagName: string) => void
}

interface TagWithArticles {
  tag: Tag
  articles: Article[]
  pagination: Pagination | null
  loading: boolean
  hasLoadedOnce: boolean
}

export function TagCarouselArticleList({ selectedFeedId, searchTerm, hideReadArticles = false, onTagChange }: TagCarouselArticleListProps) {
  const { t } = useTranslation()
  const [tags, setTags] = useState<Tag[]>([])
  const [tagArticles, setTagArticles] = useState<Map<string, TagWithArticles>>(new Map())
  const [allArticles, setAllArticles] = useState<Article[]>([])
  const [allPagination, setAllPagination] = useState<Pagination | null>(null)
  const [allLoading, setAllLoading] = useState(false)
  const [currentTagIndex, setCurrentTagIndex] = useState(0)
  const [loading, setLoading] = useState(false)
  const carouselRef = useRef<HTMLDivElement>(null)
  const scrollPositions = useRef<Map<string, number>>(new Map())

  // タグ一覧を取得
  const loadTags = async () => {
    try {
      setLoading(true)
      console.log('[TagCarousel] タグ読み込み開始')
      
      const response = await sdk.tags.getTags({ limit: 50 })
      console.log('[TagCarousel] タグ取得完了:', response.data.tags.length)
      
      setTags(response.data.tags)
    } catch (error) {
      console.error('[TagCarousel] タグ取得エラー:', error)
    } finally {
      setLoading(false)
    }
  }

  // すべての記事を取得（タグなしのフィード記事も含む）
  const loadAllArticles = async (pageNum = 1, reset = false) => {
    try {
      setAllLoading(true)
      
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

      const response = await sdk.articles.getAll(params)
      
      setAllArticles(prev => reset ? response.articles : [...prev, ...response.articles])
      setAllPagination(response.pagination)
    } catch (error) {
      console.error('[TagCarousel] 全記事取得エラー:', error)
    } finally {
      setAllLoading(false)
    }
  }

  // 特定のタグの記事を取得
  const loadTagArticles = async (tagId: string, pageNum = 1, reset = false) => {
    try {
      const currentData = tagArticles.get(tagId)
      
      setTagArticles(prev => {
        const newMap = new Map(prev)
        const existing = newMap.get(tagId) || {
          tag: tags.find(t => t.id === tagId)!,
          articles: [],
          pagination: null,
          loading: false,
          hasLoadedOnce: false
        }
        newMap.set(tagId, { ...existing, loading: true })
        return newMap
      })

      const params: {
        page: number
        limit: number
        tagId: string
        feedId?: string
        search?: string
      } = {
        page: pageNum,
        limit: 20,
        tagId: tagId
      }

      if (selectedFeedId) {
        params.feedId = selectedFeedId
      }

      if (searchTerm) {
        params.search = searchTerm
      }

      const response = await sdk.articles.getAll(params)
      
      setTagArticles(prev => {
        const newMap = new Map(prev)
        const existing = newMap.get(tagId)!
        newMap.set(tagId, {
          ...existing,
          articles: reset ? response.articles : [...existing.articles, ...response.articles],
          pagination: response.pagination,
          loading: false,
          hasLoadedOnce: true
        })
        return newMap
      })
    } catch (error) {
      console.error('[TagCarousel] タグ記事取得エラー:', error, 'tagId:', tagId)
      
      setTagArticles(prev => {
        const newMap = new Map(prev)
        const existing = newMap.get(tagId)!
        newMap.set(tagId, { ...existing, loading: false })
        return newMap
      })
    }
  }

  // 初期化
  useEffect(() => {
    loadTags()
    loadAllArticles(1, true)
  }, [])

  // 検索条件変更時の再読み込み
  useEffect(() => {
    loadAllArticles(1, true)
    // タグ記事もクリア
    setTagArticles(new Map())
  }, [selectedFeedId, searchTerm])

  // 現在のタグが変更されたときに記事を読み込み
  useEffect(() => {
    if (tags.length > 0 && currentTagIndex > 0) { // 0番目は「すべて」なのでスキップ
      const currentTag = tags[currentTagIndex - 1] // 「すべて」分のオフセット
      if (currentTag && !tagArticles.get(currentTag.id)?.hasLoadedOnce) {
        loadTagArticles(currentTag.id, 1, true)
      }
    }
  }, [currentTagIndex, tags])

  // カルーセルをスクロール
  const scrollToIndex = (index: number) => {
    if (carouselRef.current) {
      const container = carouselRef.current
      const itemWidth = container.offsetWidth
      container.scrollTo({
        left: itemWidth * index,
        behavior: 'smooth'
      })
    }
    setCurrentTagIndex(index)
    
    // タグ変更を親コンポーネントに通知
    if (onTagChange) {
      const tagOptions = [
        { id: 'all', name: t('common.all'), color: undefined },
        ...tags.map(tag => ({ id: tag.id, name: tag.name, color: tag.color }))
      ]
      if (tagOptions[index]) {
        onTagChange(tagOptions[index].name)
      }
    }
  }

  // 記事操作関数
  const markArticleAsRead = async (articleId: string) => {
    try {
      await sdk.articles.markRead(articleId)
      
      // すべての記事リストを更新
      setAllArticles(prev => 
        prev.map(article =>
          article.id === articleId
            ? { ...article, isRead: true, readAt: new Date().toISOString() }
            : article
        )
      )

      // タグ記事リストも更新
      setTagArticles(prev => {
        const newMap = new Map(prev)
        prev.forEach((data, tagId) => {
          newMap.set(tagId, {
            ...data,
            articles: data.articles.map(article =>
              article.id === articleId
                ? { ...article, isRead: true, readAt: new Date().toISOString() }
                : article
            )
          })
        })
        return newMap
      })
    } catch (error) {
      console.error('既読マークエラー:', error)
    }
  }

  const toggleBookmark = async (articleId: string, isBookmarked: boolean) => {
    try {
      if (isBookmarked) {
        await sdk.articles.unbookmark(articleId)
      } else {
        await sdk.articles.bookmark(articleId)
      }

      const updateArticle = (article: Article) =>
        article.id === articleId
          ? {
              ...article,
              isBookmarked: !isBookmarked,
              bookmarkedAt: !isBookmarked ? new Date().toISOString() : undefined,
            }
          : article

      // すべての記事リストを更新
      setAllArticles(prev => prev.map(updateArticle))

      // タグ記事リストも更新
      setTagArticles(prev => {
        const newMap = new Map(prev)
        prev.forEach((data, tagId) => {
          newMap.set(tagId, {
            ...data,
            articles: data.articles.map(updateArticle)
          })
        })
        return newMap
      })
    } catch (error) {
      console.error('ブックマーク操作エラー:', error)
    }
  }

  const handleArticleClick = async (articleUrl: string, articleId: string) => {
    await markArticleAsRead(articleId)
    window.open(articleUrl, '_blank')
  }

  const handleLoadMore = useCallback((tagId?: string) => {
    if (tagId) {
      const data = tagArticles.get(tagId)
      if (data?.pagination?.hasNext && !data.loading) {
        loadTagArticles(tagId, (data.pagination.page || 0) + 1, false)
      }
    } else {
      if (allPagination?.hasNext && !allLoading) {
        loadAllArticles((allPagination.page || 0) + 1, false)
      }
    }
  }, [tagArticles, allPagination, allLoading])

  // 無限スクロールハンドラー
  const handleScroll = useCallback((e: React.UIEvent<HTMLDivElement>, tagId?: string) => {
    const target = e.currentTarget
    const { scrollTop, scrollHeight, clientHeight } = target
    
    // スクロール位置を保存
    const key = tagId || 'all'
    scrollPositions.current.set(key, scrollTop)
    
    // 底に近づいたら次のページを読み込み（100px余裕を持たせる）
    if (scrollHeight - scrollTop - clientHeight < 100) {
      handleLoadMore(tagId)
    }
  }, [handleLoadMore])

  // スクロール位置を復元
  const restoreScrollPosition = useCallback((element: HTMLElement, tagId?: string) => {
    const key = tagId || 'all'
    const savedPosition = scrollPositions.current.get(key)
    if (savedPosition !== undefined) {
      element.scrollTop = savedPosition
    }
  }, [])

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

  // 記事リストコンポーネント
  const ArticleListContent = ({ articles, isLoading, pagination, onLoadMore, tagId }: {
    articles: Article[]
    isLoading: boolean
    pagination: Pagination | null
    onLoadMore: () => void
    tagId?: string
  }) => {
    // 既読記事をフィルタリング
    const filteredArticles = hideReadArticles 
      ? articles.filter(article => !article.isRead)
      : articles
    if (isLoading && articles.length === 0) {
      return (
        <div className="flex-1 flex items-center justify-center h-full">
          <div className="text-gray-500 dark:text-gray-400">読み込み中...</div>
        </div>
      )
    }

    if (filteredArticles.length === 0) {
      return (
        <div className="flex-1 flex items-center justify-center h-full">
          <div className="text-center">
            <div className="text-6xl mb-4">📰</div>
            <div className="text-gray-500 dark:text-gray-400 text-lg mb-2">
              記事がありません
            </div>
            <div className="text-gray-400 dark:text-gray-500 text-sm">
              {hideReadArticles && articles.length > 0
                ? 'すべての記事が既読です'
                : 'このタグに記事がないか、フィルター条件を見直してください'}
            </div>
          </div>
        </div>
      )
    }

    return (
      <div className="flex-1 flex flex-col h-full overflow-hidden">
        <div 
          className="flex-1 overflow-y-auto"
          onScroll={(e) => handleScroll(e, tagId)}
          ref={(el) => {
            if (el) {
              // スクロール位置を復元（初回レンダリング時のみ）
              setTimeout(() => restoreScrollPosition(el, tagId), 0)
            }
          }}
        >
          <div className="divide-y divide-neutral-200 dark:divide-neutral-700">
            {filteredArticles.map((article) => (
              <article 
                key={article.id} 
                className={`px-3 py-1.5 hover:bg-neutral-50 dark:hover:bg-neutral-800/50 transition-colors duration-200 group cursor-pointer ${
                  article.isRead ? 'opacity-50' : ''
                }`}
                onClick={() => handleArticleClick(article.url, article.id)}
              >
                <div>
                  {/* 上部行：フィード情報（左）と右側エリア（公開日時＋お気に入りボタン） */}
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-2 min-w-0 flex-1">
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
                      <span className={`text-xs font-normal truncate ${
                        article.isRead
                          ? 'text-neutral-400 dark:text-neutral-600'
                          : 'text-neutral-500 dark:text-neutral-400'
                      }`}>
                        {article.feed?.title}
                      </span>
                    </div>
                    
                    {/* 右側：公開日時＋お気に入りボタン */}
                    <div className="flex items-center gap-2">
                      <time className={`text-xs flex-shrink-0 ${
                        article.isRead
                          ? 'text-neutral-400 dark:text-neutral-600'
                          : 'text-neutral-400 dark:text-neutral-500'
                      }`}>
                        {formatDate(article.publishedAt)}
                      </time>
                      
                      {/* お気に入りボタン */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        toggleBookmark(article.id, !!article.isBookmarked)
                      }}
                      className={`p-1 rounded hover:bg-neutral-100 dark:hover:bg-neutral-700 transition-colors flex-shrink-0 ${
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
                    </div>
                  </div>
                  
                  {/* 下部行：記事タイトル（全幅） */}
                  <h4 className={`text-sm font-semibold leading-tight group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors duration-200 mb-0.5 ${
                    article.isRead
                      ? 'text-neutral-400 dark:text-neutral-600'
                      : 'text-neutral-900 dark:text-neutral-100'
                  }`}>
                    {article.title}
                  </h4>
                </div>
              </article>
            ))}

            {/* 無限スクロール用のローディングインジケーター */}
            {isLoading && (
              <div className="text-center py-4 border-t border-neutral-200 dark:border-neutral-700">
                <div className="text-gray-500 dark:text-gray-400 text-sm">読み込み中...</div>
              </div>
            )}
            
            {/* フォールバック：手動読み込みボタン */}
            {pagination?.hasNext && !isLoading && (
              <div className="text-center py-4 border-t border-neutral-200 dark:border-neutral-700">
                <Button 
                  onClick={onLoadMore} 
                  variant="outline" 
                  size="sm"
                >
                  さらに読み込む
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>
    )
  }

  if (loading && tags.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center h-full">
        <div className="text-gray-500 dark:text-gray-400">読み込み中...</div>
      </div>
    )
  }

  // タグがない場合は通常の記事一覧表示
  if (tags.length === 0) {
    return (
      <ArticleListContent
        articles={allArticles}
        isLoading={allLoading}
        pagination={allPagination}
        onLoadMore={() => handleLoadMore()}
        tagId={undefined}
      />
    )
  }

  const tagOptions = [
    { id: 'all', name: t('common.all'), color: undefined },
    ...tags.map(tag => ({ id: tag.id, name: tag.name, color: tag.color }))
  ]

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden">
      {/* タグ選択タブ */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-3 py-2">
        <div className="flex items-center gap-2 overflow-x-auto scrollbar-thin scrollbar-thumb-gray-300 dark:scrollbar-thumb-gray-600">
          {tagOptions.map((tag, index) => (
            <button
              key={tag.id}
              onClick={() => scrollToIndex(index)}
              className={`px-3 py-1.5 text-sm font-medium rounded-full whitespace-nowrap transition-colors duration-200 ${
                currentTagIndex === index
                  ? 'bg-primary-100 text-primary-700 dark:bg-primary-900 dark:text-primary-300'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600'
              }`}
              style={tag.color && currentTagIndex === index ? {
                backgroundColor: tag.color + '20',
                color: tag.color,
                borderColor: tag.color + '40'
              } : undefined}
            >
              {tag.name}
            </button>
          ))}
        </div>
      </div>

      {/* カルーセルコンテナ */}
      <div 
        ref={carouselRef}
        className="flex-1 flex overflow-x-auto overflow-y-hidden"
        style={{ 
          scrollSnapType: 'x mandatory',
          scrollBehavior: 'smooth',
          WebkitOverflowScrolling: 'touch'
        }}
        onScroll={(e) => {
          const container = e.currentTarget
          const scrollLeft = container.scrollLeft
          const itemWidth = container.offsetWidth
          const index = Math.round(scrollLeft / itemWidth)
          if (index !== currentTagIndex) {
            setCurrentTagIndex(index)
            
            // タグ変更を親コンポーネントに通知
            if (onTagChange) {
              const tagOptions = [
                { id: 'all', name: t('common.all'), color: undefined },
                ...tags.map(tag => ({ id: tag.id, name: tag.name, color: tag.color }))
              ]
              if (tagOptions[index]) {
                onTagChange(tagOptions[index].name)
              }
            }
          }
        }}
      >
        {/* すべての記事 */}
        <div className="w-full flex-shrink-0" style={{ scrollSnapAlign: 'start' }}>
          <ArticleListContent
            articles={allArticles}
            isLoading={allLoading}
            pagination={allPagination}
            onLoadMore={() => handleLoadMore()}
            tagId={undefined}
          />
        </div>

        {/* タグ別記事 */}
        {tags.map((tag) => {
          const tagData = tagArticles.get(tag.id)
          return (
            <div key={tag.id} className="w-full flex-shrink-0" style={{ scrollSnapAlign: 'start' }}>
              <ArticleListContent
                articles={tagData?.articles || []}
                isLoading={tagData?.loading || false}
                pagination={tagData?.pagination || null}
                onLoadMore={() => handleLoadMore(tag.id)}
                tagId={tag.id}
              />
            </div>
          )
        })}
      </div>
    </div>
  )
}