'use client';

import React, { useState, useEffect } from 'react';
import { sdk } from '@/lib/sdk';
import { Article } from '@rss-reader/sdk';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';

interface ArticleListProps {
  selectedFeedId?: string;
}

export function ArticleList({ selectedFeedId }: ArticleListProps) {
  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);

  useEffect(() => {
    loadArticles(true);
  }, [selectedFeedId, searchTerm]);

  const loadArticles = async (reset = false) => {
    try {
      setLoading(true);
      const currentPage = reset ? 1 : page;
      
      let response;
      if (selectedFeedId) {
        response = await sdk.feeds.getFeedArticles(selectedFeedId, {
          page: currentPage,
          limit: 20,
          search: searchTerm || undefined,
        });
      } else {
        response = await sdk.articles.getArticles({
          page: currentPage,
          limit: 20,
          search: searchTerm || undefined,
        });
      }

      if (reset) {
        setArticles(response.articles);
        setPage(2);
      } else {
        setArticles(prev => [...prev, ...response.articles]);
        setPage(prev => prev + 1);
      }
      
      setHasMore(response.pagination.hasNext);
    } catch (error) {
      console.error('記事読み込みエラー:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    loadArticles(true);
  };

  const handleMarkAsRead = async (articleId: string) => {
    try {
      await sdk.articles.markAsRead(articleId);
      setArticles(prev => 
        prev.map(article => 
          article.id === articleId 
            ? { ...article, isRead: true, readAt: new Date().toISOString() }
            : article
        )
      );
    } catch (error) {
      console.error('既読マークエラー:', error);
    }
  };

  const handleToggleBookmark = async (articleId: string, isBookmarked: boolean) => {
    try {
      if (isBookmarked) {
        await sdk.articles.removeBookmark(articleId);
      } else {
        await sdk.articles.addBookmark(articleId);
      }
      
      setArticles(prev => 
        prev.map(article => 
          article.id === articleId 
            ? { 
                ...article, 
                isBookmarked: !isBookmarked,
                bookmarkedAt: !isBookmarked ? new Date().toISOString() : undefined
              }
            : article
        )
      );
    } catch (error) {
      console.error('ブックマーク操作エラー:', error);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('ja-JP', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className="flex-1 p-6">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
          {selectedFeedId ? 'フィード記事' : '全ての記事'}
        </h2>
        
        <form onSubmit={handleSearch} className="flex space-x-2">
          <Input
            placeholder="記事を検索..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="flex-1"
          />
          <Button type="submit">検索</Button>
        </form>
      </div>

      {loading && articles.length === 0 ? (
        <div className="text-center text-gray-500 dark:text-gray-400">
          読み込み中...
        </div>
      ) : articles.length === 0 ? (
        <div className="text-center text-gray-500 dark:text-gray-400">
          記事がありません
        </div>
      ) : (
        <div className="space-y-4">
          {articles.map((article) => (
            <Card key={article.id} className="p-4">
              <div className="flex items-start justify-between">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center space-x-2 mb-2">
                    {article.feed?.favicon && (
                      <img
                        src={article.feed.favicon}
                        alt=""
                        className="w-4 h-4 rounded"
                        onError={(e) => {
                          e.currentTarget.style.display = 'none';
                        }}
                      />
                    )}
                    <span className="text-sm text-gray-500 dark:text-gray-400">
                      {article.feed?.title}
                    </span>
                    <span className="text-sm text-gray-400 dark:text-gray-500">
                      {formatDate(article.publishedAt)}
                    </span>
                  </div>
                  
                  <h3 className={`text-lg font-medium mb-2 ${
                    article.isRead 
                      ? 'text-gray-600 dark:text-gray-400' 
                      : 'text-gray-900 dark:text-white'
                  }`}>
                    <a
                      href={article.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="hover:text-blue-600 dark:hover:text-blue-400"
                      onClick={() => handleMarkAsRead(article.id)}
                    >
                      {article.title}
                    </a>
                  </h3>
                  
                  {article.description && (
                    <p className="text-gray-600 dark:text-gray-400 text-sm overflow-hidden" style={{
                      display: '-webkit-box',
                      WebkitLineClamp: 2,
                      WebkitBoxOrient: 'vertical',
                    }}>
                      {article.description}
                    </p>
                  )}
                </div>
                
                <div className="flex items-center space-x-2 ml-4">
                  <button
                    onClick={() => handleToggleBookmark(article.id, !!article.isBookmarked)}
                    className={`text-yellow-500 hover:text-yellow-600 ${
                      article.isBookmarked ? 'fill-current' : ''
                    }`}
                  >
                    {article.isBookmarked ? '★' : '☆'}
                  </button>
                  
                  {!article.isRead && (
                    <button
                      onClick={() => handleMarkAsRead(article.id)}
                      className="text-blue-500 hover:text-blue-600 text-sm"
                    >
                      既読
                    </button>
                  )}
                </div>
              </div>
            </Card>
          ))}
          
          {hasMore && (
            <div className="text-center">
              <Button
                onClick={() => loadArticles(false)}
                disabled={loading}
                variant="outline"
              >
                {loading ? '読み込み中...' : 'さらに読み込む'}
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}