'use client';

import { useState, useRef, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import type { Tag } from '@/lib/rss-sdk';

interface TagCarouselProps {
  tags: Tag[];
  selectedTagId: string | null;
  onTagSelect: (tagId: string | null) => void;
  isLoading?: boolean;
}

export function TagCarousel({ tags, selectedTagId, onTagSelect, isLoading = false }: TagCarouselProps) {
  const { t } = useTranslation();
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [showLeftShadow, setShowLeftShadow] = useState(false);
  const [showRightShadow, setShowRightShadow] = useState(false);

  // スクロール位置に基づいてシャドウの表示を制御
  const updateShadows = () => {
    const container = scrollContainerRef.current;
    if (!container) return;

    const { scrollLeft, scrollWidth, clientWidth } = container;
    setShowLeftShadow(scrollLeft > 0);
    setShowRightShadow(scrollLeft < scrollWidth - clientWidth);
  };

  useEffect(() => {
    updateShadows();
  }, [tags]);

  useEffect(() => {
    const container = scrollContainerRef.current;
    if (container) {
      container.addEventListener('scroll', updateShadows);
      // タッチ操作のサポート
      let isScrolling = false;
      let startX = 0;
      let scrollLeft = 0;

      const handleTouchStart = (e: TouchEvent) => {
        isScrolling = true;
        startX = e.touches[0].pageX - container.offsetLeft;
        scrollLeft = container.scrollLeft;
        container.style.scrollSnapType = 'none';
        container.style.cursor = 'grabbing';
      };

      const handleTouchMove = (e: TouchEvent) => {
        if (!isScrolling) return;
        e.preventDefault();
        const x = e.touches[0].pageX - container.offsetLeft;
        const walk = (x - startX) * 2;
        container.scrollLeft = scrollLeft - walk;
      };

      const handleTouchEnd = () => {
        isScrolling = false;
        container.style.scrollSnapType = 'x mandatory';
        container.style.cursor = 'grab';
      };

      // マウス操作でのドラッグサポート
      const handleMouseDown = (e: MouseEvent) => {
        isScrolling = true;
        startX = e.pageX - container.offsetLeft;
        scrollLeft = container.scrollLeft;
        container.style.scrollSnapType = 'none';
        container.style.cursor = 'grabbing';
      };

      const handleMouseMove = (e: MouseEvent) => {
        if (!isScrolling) return;
        e.preventDefault();
        const x = e.pageX - container.offsetLeft;
        const walk = (x - startX) * 2;
        container.scrollLeft = scrollLeft - walk;
      };

      const handleMouseUp = () => {
        isScrolling = false;
        container.style.scrollSnapType = 'x mandatory';
        container.style.cursor = 'grab';
      };

      const handleMouseLeave = () => {
        isScrolling = false;
        container.style.scrollSnapType = 'x mandatory';
        container.style.cursor = 'grab';
      };

      // イベントリスナーの追加
      container.addEventListener('touchstart', handleTouchStart, { passive: false });
      container.addEventListener('touchmove', handleTouchMove, { passive: false });
      container.addEventListener('touchend', handleTouchEnd);
      container.addEventListener('mousedown', handleMouseDown);
      container.addEventListener('mousemove', handleMouseMove);
      container.addEventListener('mouseup', handleMouseUp);
      container.addEventListener('mouseleave', handleMouseLeave);

      return () => {
        container.removeEventListener('scroll', updateShadows);
        container.removeEventListener('touchstart', handleTouchStart);
        container.removeEventListener('touchmove', handleTouchMove);
        container.removeEventListener('touchend', handleTouchEnd);
        container.removeEventListener('mousedown', handleMouseDown);
        container.removeEventListener('mousemove', handleMouseMove);
        container.removeEventListener('mouseup', handleMouseUp);
        container.removeEventListener('mouseleave', handleMouseLeave);
      };
    }
  }, []);

  const handleTagClick = (tagId: string | null) => {
    onTagSelect(tagId);
  };

  if (isLoading) {
    return (
      <div className="relative border-b border-gray-200 dark:border-gray-700">
        <div className="flex gap-2 p-4 animate-pulse">
          {[...Array(5)].map((_, i) => (
            <div
              key={i}
              className="h-8 bg-gray-200 dark:bg-gray-700 rounded-full w-16 flex-shrink-0"
            />
          ))}
        </div>
      </div>
    );
  }

  if (tags.length === 0) {
    return (
      <div className="border-b border-gray-200 dark:border-gray-700 p-4">
        <div className="text-sm text-gray-500 dark:text-gray-400 text-center">
          {t('tags.noTags')}
        </div>
      </div>
    );
  }

  return (
    <div className="relative border-b border-gray-200 dark:border-gray-700">
      {/* 左側のフェードシャドウ */}
      {showLeftShadow && (
        <div className="absolute left-0 top-0 h-full w-8 bg-gradient-to-r from-white dark:from-gray-900 to-transparent z-10 pointer-events-none" />
      )}
      
      {/* 右側のフェードシャドウ */}
      {showRightShadow && (
        <div className="absolute right-0 top-0 h-full w-8 bg-gradient-to-l from-white dark:from-gray-900 to-transparent z-10 pointer-events-none" />
      )}

      <div
        ref={scrollContainerRef}
        className="flex gap-2 p-4 overflow-x-auto scrollbar-hide scroll-smooth"
        style={{ 
          scrollbarWidth: 'none', 
          msOverflowStyle: 'none',
          scrollSnapType: 'x mandatory',
          cursor: 'grab',
          userSelect: 'none'
        }}
      >
        {/* 「全て」タグ */}
        <button
          onClick={() => handleTagClick(null)}
          className={`px-4 py-2 rounded-full whitespace-nowrap text-sm font-medium transition-all duration-200 flex-shrink-0 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:focus:ring-offset-gray-900 ${
            selectedTagId === null
              ? 'bg-blue-500 text-white shadow-md'
              : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
          }`}
          style={{ scrollSnapAlign: 'start' }}
        >
          {t('tags.all')}
          {tags.reduce((total, tag) => total + (tag.feedCount || 0), 0) > 0 && (
            <span className="ml-1">
              ({tags.reduce((total, tag) => total + (tag.feedCount || 0), 0)})
            </span>
          )}
        </button>

        {/* タグ一覧 */}
        {tags.map((tag) => (
          <button
            key={tag.id}
            onClick={() => handleTagClick(tag.id)}
            className={`px-4 py-2 rounded-full whitespace-nowrap text-sm font-medium transition-all duration-200 flex-shrink-0 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:focus:ring-offset-gray-900 ${
              selectedTagId === tag.id
                ? 'text-white shadow-md'
                : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
            }`}
            style={{
              backgroundColor: selectedTagId === tag.id ? (tag.color || '#3B82F6') : undefined,
              scrollSnapAlign: 'start'
            }}
          >
            {tag.name}
            {tag.feedCount !== undefined && (
              <span className="ml-1">({tag.feedCount})</span>
            )}
          </button>
        ))}
      </div>
    </div>
  );
}