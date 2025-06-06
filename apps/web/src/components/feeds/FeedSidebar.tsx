'use client';

import React, { useState, useEffect } from 'react';
import { sdk } from '@/lib/sdk';
// Feed型を直接定義
interface Feed {
  id: string;
  title: string;
  url: string;
  siteUrl?: string;
  description?: string;
  favicon?: string;
  userId: string;
  lastFetchedAt?: string;
  createdAt: string;
  updatedAt: string;
  _count?: {
    articles: number;
  };
}
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card } from '@/components/ui/Card';

interface FeedSidebarProps {
  selectedFeedId?: string;
  onFeedSelect: (feedId: string | null) => void;
  onFeedRefresh: () => void;
}

export function FeedSidebar({ selectedFeedId, onFeedSelect, onFeedRefresh }: FeedSidebarProps) {
  const [feeds, setFeeds] = useState<Feed[]>([]);
  const [newFeedUrl, setNewFeedUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [addingFeed, setAddingFeed] = useState(false);
  const [refreshingAll, setRefreshingAll] = useState(false);

  useEffect(() => {
    loadFeeds();
  }, []);

  const loadFeeds = async () => {
    try {
      setLoading(true);
      const response = await sdk.feeds.getFeeds({ limit: 100 });
      setFeeds(response.feeds);
    } catch (error) {
      console.error('フィード読み込みエラー:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddFeed = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFeedUrl.trim()) return;

    try {
      setAddingFeed(true);
      await sdk.feeds.createFeed({ url: newFeedUrl.trim() });
      setNewFeedUrl('');
      await loadFeeds();
      onFeedRefresh();
    } catch (error) {
      console.error('フィード追加エラー:', error);
      alert('フィードの追加に失敗しました');
    } finally {
      setAddingFeed(false);
    }
  };

  const handleDeleteFeed = async (feedId: string) => {
    if (!confirm('このフィードを削除しますか？')) return;

    try {
      await sdk.feeds.deleteFeed(feedId);
      await loadFeeds();
      if (selectedFeedId === feedId) {
        onFeedSelect(null);
      }
      onFeedRefresh();
    } catch (error) {
      console.error('フィード削除エラー:', error);
      alert('フィードの削除に失敗しました');
    }
  };

  const handleRefreshAll = async () => {
    try {
      setRefreshingAll(true);
      await sdk.feeds.refreshAllFeeds();
      await loadFeeds();
      onFeedRefresh();
    } catch (error) {
      console.error('全フィード更新エラー:', error);
      alert('フィードの更新に失敗しました');
    } finally {
      setRefreshingAll(false);
    }
  };

  return (
    <div className="w-80 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 h-full overflow-y-auto">
      <div className="p-4 border-b border-gray-200 dark:border-gray-700">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          フィード管理
        </h2>
        
        <form onSubmit={handleAddFeed} className="space-y-3">
          <Input
            type="url"
            placeholder="RSS フィード URL"
            value={newFeedUrl}
            onChange={(e) => setNewFeedUrl(e.target.value)}
            disabled={addingFeed}
          />
          <Button
            type="submit"
            disabled={addingFeed || !newFeedUrl.trim()}
            className="w-full"
          >
            {addingFeed ? '追加中...' : 'フィード追加'}
          </Button>
        </form>

        <div className="mt-4 space-y-2">
          <Button
            variant="outline"
            onClick={handleRefreshAll}
            disabled={refreshingAll}
            className="w-full"
          >
            {refreshingAll ? '更新中...' : '全フィード更新'}
          </Button>
          
          <Button
            variant={selectedFeedId ? 'outline' : 'primary'}
            onClick={() => onFeedSelect(null)}
            className="w-full"
          >
            全ての記事
          </Button>
        </div>
      </div>

      <div className="p-4">
        {loading ? (
          <div className="text-center text-gray-500 dark:text-gray-400">
            読み込み中...
          </div>
        ) : feeds.length === 0 ? (
          <div className="text-center text-gray-500 dark:text-gray-400">
            フィードがありません
          </div>
        ) : (
          <div className="space-y-2">
            {feeds.map((feed) => (
              <Card
                key={feed.id}
                className={`p-3 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors ${
                  selectedFeedId === feed.id 
                    ? 'bg-blue-50 dark:bg-blue-900 border-blue-200 dark:border-blue-700' 
                    : ''
                }`}
                onClick={() => onFeedSelect(feed.id)}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center space-x-2">
                      {feed.favicon && (
                        <img
                          src={feed.favicon}
                          alt=""
                          className="w-4 h-4 rounded"
                          onError={(e) => {
                            e.currentTarget.style.display = 'none';
                          }}
                        />
                      )}
                      <h3 className="text-sm font-medium text-gray-900 dark:text-white truncate">
                        {feed.title}
                      </h3>
                    </div>
                    {feed._count && (
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                        {feed._count.articles} 記事
                      </p>
                    )}
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeleteFeed(feed.id);
                    }}
                    className="text-red-500 hover:text-red-700 text-xs ml-2"
                  >
                    削除
                  </button>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}