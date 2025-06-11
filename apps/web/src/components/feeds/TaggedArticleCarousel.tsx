'use client'

import { useState, useRef, useEffect } from 'react'
import { useTaggedArticles } from '@/hooks/useTaggedArticles'
import { TagArticleList } from './TagArticleList'

interface TaggedArticleCarouselProps {
  selectedFeedId?: string
  searchTerm?: string
}

export function TaggedArticleCarousel({ selectedFeedId, searchTerm }: TaggedArticleCarouselProps) {
  const {
    articleGroups,
    currentGroupIndex,
    tagsLoading,
    changeGroup,
    loadMoreArticles,
    markArticleAsRead,
    toggleBookmark,
    refresh,
  } = useTaggedArticles({ selectedFeedId, searchTerm })

  const [showLeftShadow, setShowLeftShadow] = useState(false)
  const [showRightShadow, setShowRightShadow] = useState(false)
  const scrollContainerRef = useRef<HTMLDivElement>(null)
  const carouselRef = useRef<HTMLDivElement>(null)

  // タブの横スクロール制御
  const updateShadows = () => {
    const container = scrollContainerRef.current
    if (!container) return

    const { scrollLeft, scrollWidth, clientWidth } = container
    setShowLeftShadow(scrollLeft > 0)
    setShowRightShadow(scrollLeft < scrollWidth - clientWidth)
  }

  useEffect(() => {
    updateShadows()
  }, [articleGroups])

  // カルーセルのスクロール処理（スロットリング付き）
  const handleCarouselScroll = useRef<NodeJS.Timeout | null>(null)
  
  const onCarouselScroll = () => {
    if (handleCarouselScroll.current) {
      clearTimeout(handleCarouselScroll.current)
    }
    
    handleCarouselScroll.current = setTimeout(() => {
      const carousel = carouselRef.current
      if (!carousel) return
      
      const scrollLeft = carousel.scrollLeft
      const itemWidth = carousel.clientWidth
      const newIndex = Math.round(scrollLeft / itemWidth)
      
      if (newIndex !== currentGroupIndex && newIndex >= 0 && newIndex < articleGroups.length) {
        changeGroup(newIndex)
      }
    }, 100)
  }

  const handleGroupChange = (index: number) => {
    changeGroup(index)
    
    // カルーセルをスクロール
    const carousel = carouselRef.current
    if (carousel) {
      const itemWidth = carousel.clientWidth
      carousel.scrollTo({
        left: index * itemWidth,
        behavior: 'smooth'
      })
    }
    
    // タブナビゲーションを中央に表示
    const tabContainer = scrollContainerRef.current
    if (tabContainer) {
      const tabButton = tabContainer.children[index] as HTMLElement
      if (tabButton) {
        tabButton.scrollIntoView({
          behavior: 'smooth',
          block: 'nearest',
          inline: 'center'
        })
      }
    }
  }

  const handleArticleClick = async (articleUrl: string, articleId: string) => {
    await markArticleAsRead(articleId)
    window.open(articleUrl, '_blank')
  }

  if (tagsLoading) {
    return (
      <div className="flex-1 flex flex-col h-full overflow-hidden">
        <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 p-3">
          <div className="flex gap-2 animate-pulse">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-8 bg-gray-200 dark:bg-gray-700 rounded-full w-20" />
            ))}
          </div>
        </div>
        <div className="flex-1 flex items-center justify-center">
          <div className="text-gray-500 dark:text-gray-400">読み込み中...</div>
        </div>
      </div>
    )
  }

  if (articleGroups.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center h-full">
        <div className="text-center">
          <div className="text-6xl mb-4">📰</div>
          <div className="text-gray-500 dark:text-gray-400 text-lg mb-2">
            タグがありません
          </div>
          <div className="text-gray-400 dark:text-gray-500 text-sm">
            フィードにタグを設定してください
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden">
      {/* タグタブナビゲーション */}
      <div className="relative bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
        {/* 左側のフェードシャドウ */}
        {showLeftShadow && (
          <div className="absolute left-0 top-0 h-full w-8 bg-gradient-to-r from-white dark:from-gray-800 to-transparent z-10 pointer-events-none" />
        )}
        
        {/* 右側のフェードシャドウ */}
        {showRightShadow && (
          <div className="absolute right-0 top-0 h-full w-8 bg-gradient-to-l from-white dark:from-gray-800 to-transparent z-10 pointer-events-none" />
        )}

        <div
          ref={scrollContainerRef}
          className="flex gap-1 p-3 overflow-x-auto scrollbar-hide scroll-smooth"
          style={{ 
            scrollbarWidth: 'none', 
            msOverflowStyle: 'none',
          }}
          onScroll={updateShadows}
        >
          {articleGroups.map((group, index) => (
            <button
              key={group.id}
              onClick={() => handleGroupChange(index)}
              className={`px-4 py-2 rounded-lg whitespace-nowrap text-sm font-medium transition-all duration-200 flex-shrink-0 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:focus:ring-offset-gray-800 flex items-center gap-2 ${
                currentGroupIndex === index
                  ? 'bg-blue-500 text-white shadow-md'
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
              }`}
            >
              {group.color && currentGroupIndex === index && (
                <div 
                  className="w-2 h-2 rounded-full bg-white"
                />
              )}
              {group.color && currentGroupIndex !== index && (
                <div 
                  className="w-2 h-2 rounded-full" 
                  style={{ backgroundColor: group.color }}
                />
              )}
              {group.name}
              {group.articles.length > 0 && (
                <span className="text-xs">
                  ({group.articles.length})
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* カルーセルコンテンツ */}
      <div 
        ref={carouselRef}
        className="flex-1 flex overflow-x-auto overflow-y-hidden snap-x snap-mandatory scroll-smooth scrollbar-hide"
        style={{ 
          scrollbarWidth: 'none',
          msOverflowStyle: 'none'
        }}
        onScroll={onCarouselScroll}
      >
        {articleGroups.map((group, index) => (
          <div 
            key={group.id} 
            className="w-full flex-shrink-0 snap-start"
          >
            <TagArticleList
              group={group}
              onLoadMore={loadMoreArticles}
              onMarkAsRead={markArticleAsRead}
              onToggleBookmark={toggleBookmark}
              onArticleClick={handleArticleClick}
            />
          </div>
        ))}
      </div>
    </div>
  )
}