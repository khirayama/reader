import { useState, useEffect, useRef, useMemo } from 'react';
import { useRouter } from 'next/router';
import { useTranslation } from 'next-i18next';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
import Head from 'next/head';
import Link from 'next/link';
import { GetServerSideProps } from 'next';
import { z } from 'zod';
import { useTheme } from '../../lib/theme';
import { useAuth } from '../../lib/auth-context';

// Types
interface Feed {
  id: string;
  title: string;
  url: string;
  description?: string;
  createdAt: string;
  updatedAt: string;
}

interface Article {
  id: string;
  title: string;
  url: string;
  description?: string;
  publishedAt: string;
  createdAt: string;
  feed: {
    id: string;
    title: string;
  };
}

interface Pagination {
  total: number;
  page: number;
  limit: number;
  pages: number;
}

// Component for adding a new feed
function AddFeedForm({ onAddFeed }: { onAddFeed: (url: string) => Promise<void> }) {
  const { t } = useTranslation('feeds');
  const [url, setUrl] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const urlSchema = z.string().url(t('addFeedInvalidUrl'));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    try {
      urlSchema.parse(url);
    } catch (error) {
      if (error instanceof z.ZodError) {
        setError(error.errors[0].message);
      }
      return;
    }
    
    setIsLoading(true);
    
    try {
      await onAddFeed(url);
      setUrl('');
    } catch (error) {
      setError((error as Error).message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="mb-6 bg-white dark:bg-gray-800 rounded-lg shadow p-4">
      <h2 className="text-lg font-medium text-gray-900 dark:text-white mb-3">
        {t('addFeed')}
      </h2>
      
      <form onSubmit={handleSubmit} className="flex flex-col gap-2">
        <div>
          <label htmlFor="feed-url" className="sr-only">{t('url')}</label>
          <input
            id="feed-url"
            type="text"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder={t('addFeedPlaceholder')}
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
            disabled={isLoading}
          />
          {error && (
            <p className="mt-1 text-sm text-red-600 dark:text-red-400">{error}</p>
          )}
        </div>
        <button
          type="submit"
          disabled={isLoading}
          className="w-full px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 dark:focus:ring-offset-gray-800 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isLoading ? t('processing') : t('addFeedButton')}
        </button>
      </form>
    </div>
  );
}

// Get favicon for a domain
function getFaviconUrl(url: string): string {
  try {
    if (!url || typeof url !== 'string') {
      return 'https://www.google.com/s2/favicons?domain=rss.com&sz=32';
    }
    
    // URLが正しい形式であることを確認
    let domain;
    try {
      const parsedUrl = new URL(url);
      domain = parsedUrl.hostname;
    } catch (e) {
      // URLではない場合、そのまま使用
      domain = url;
    }
    
    // クエリパラメータをエンコード
    const encodedDomain = encodeURIComponent(domain);
    return `https://www.google.com/s2/favicons?domain=${encodedDomain}&sz=32`;
  } catch (error) {
    console.error("Error getting favicon:", error);
    // Fallback to default icon if URL is invalid
    return 'https://www.google.com/s2/favicons?domain=rss.com&sz=32';
  }
}

// Component for displaying a single feed item
function FeedItem({ feed, onRemove }: { feed: Feed; onRemove: (id: string) => Promise<void> }) {
  const { t } = useTranslation('feeds');
  const [isRemoving, setIsRemoving] = useState(false);
  const [imageError, setImageError] = useState(false);

  const handleRemove = async () => {
    if (window.confirm(t('removeFeedConfirm'))) {
      setIsRemoving(true);
      try {
        await onRemove(feed.id);
      } catch (error) {
        console.error('Error removing feed:', error);
        alert(t('removeFeedError'));
      } finally {
        setIsRemoving(false);
      }
    }
  };

  return (
    <div className="flex items-center justify-between bg-white dark:bg-gray-800 rounded-lg shadow p-4 mb-3">
      <div className="flex flex-grow">
        <div className="flex-shrink-0 mr-3">
          <img 
            src={imageError ? 'https://www.google.com/s2/favicons?domain=rss.com&sz=32' : getFaviconUrl(feed.url)} 
            alt=""
            width="20" 
            height="20"
            className="rounded-sm"
            onError={() => setImageError(true)}
          />
        </div>
        <div className="flex-grow">
          <h3 className="text-lg font-medium text-gray-900 dark:text-white">
            <Link href={`/feeds/${feed.id}`} className="hover:underline">
              {feed.title}
            </Link>
          </h3>
          {feed.description && (
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1 line-clamp-2">
              {feed.description}
            </p>
          )}
          <div className="text-xs text-gray-500 dark:text-gray-500 mt-1">
            {new URL(feed.url).hostname}
          </div>
        </div>
      </div>
      <button
        onClick={handleRemove}
        disabled={isRemoving}
        className="ml-4 text-sm text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-300 disabled:opacity-50 disabled:cursor-not-allowed"
        aria-label={t('removeFeed')}
      >
        {isRemoving ? (
          <span>{t('processing')}</span>
        ) : (
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
          </svg>
        )}
      </button>
    </div>
  );
}

// Component for displaying a single article item
function ArticleItem({ article }: { article: Article }) {
  const { t } = useTranslation('feeds');
  const [imageError, setImageError] = useState(false);
  
  // 記事URLからfavicon URLを生成
  const faviconUrl = useMemo(() => {
    try {
      return getFaviconUrl(article.url);
    } catch (e) {
      return 'https://www.google.com/s2/favicons?domain=rss.com&sz=32';
    }
  }, [article.url]);
  
  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-3 mb-2">
      <div className="flex items-center justify-between mb-1">
        <div className="flex items-center">
          <img 
            src={imageError ? 'https://www.google.com/s2/favicons?domain=rss.com&sz=32' : faviconUrl} 
            alt=""
            width="16" 
            height="16"
            className="mr-2 rounded-sm"
            onError={() => setImageError(true)}
          />
          <span className="text-xs px-2 py-1 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 rounded">
            {article.feed.title}
          </span>
        </div>
        <span className="text-xs text-gray-500 dark:text-gray-500 flex-shrink-0 ml-2">
          {new Date(article.publishedAt).toLocaleDateString()}
        </span>
      </div>
      <h3 className="text-md font-medium text-gray-900 dark:text-white mt-1">
        <a 
          href={article.url} 
          className="hover:underline"
          target="_blank"
          rel="noopener noreferrer"
        >
          {article.title}
        </a>
      </h3>
      <div className="flex items-center text-xs text-gray-500 dark:text-gray-400 mt-1 justify-between">
        <span className="truncate">
          {new URL(article.url).hostname}
        </span>
        <a 
          href={article.url} 
          className="text-blue-600 dark:text-blue-400 hover:underline flex-shrink-0 ml-2"
          target="_blank"
          rel="noopener noreferrer"
        >
          {t('readMore')}
        </a>
      </div>
    </div>
  );
}

export default function FeedsPage() {
  const { user, isLoading: authLoading, authenticatedFetch } = useAuth();
  const router = useRouter();
  const { t } = useTranslation('feeds');
  const { resolvedTheme } = useTheme();
  const [feeds, setFeeds] = useState<Feed[]>([]);
  const [articles, setArticles] = useState<Article[]>([]);
  const [pagination, setPagination] = useState<Pagination>({
    total: 0,
    page: 1,
    limit: 10,
    pages: 0,
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [selectedFeed, setSelectedFeed] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  
  // References for scroll containers
  const contentContainerRef = useRef<HTMLDivElement>(null);
  const sidebarContainerRef = useRef<HTMLDivElement>(null);
  const infiniteScrollTriggerRef = useRef<HTMLDivElement>(null);

  // Fetch feeds with optional force refresh
  const fetchFeeds = async (forceRefresh = false) => {
    try {
      const url = forceRefresh ? '/api/feeds?forceRefresh=true' : '/api/feeds';
      const response = await authenticatedFetch(url);
      if (!response.ok) {
        throw new Error(`Error: ${response.status}`);
      }
      const data = await response.json();
      setFeeds(data);
    } catch (error) {
      console.error('Failed to fetch feeds:', error);
      setError((error as Error).message);
    }
  };

  // Fetch articles with infinite scroll
  const fetchArticles = async (page = 1, feedId?: string | null, append = false) => {
    // Only check loading state for appending during infinite scroll
    if (isLoading && append) return;
    
    console.log(`Fetching articles: page=${page}, feedId=${feedId}, append=${append}`);
    
    setIsLoading(true);
    try {
      let url = `/api/articles?page=${page}&limit=${pagination.limit}`;
      
      if (feedId) {
        url += `&feedId=${feedId}`;
      }
      
      console.log(`Request URL: ${url}`);
      
      const response = await authenticatedFetch(url);
      if (!response.ok) {
        throw new Error(`Error: ${response.status}`);
      }
      
      const data = await response.json();
      console.log(`Received ${data.articles.length} articles, total: ${data.pagination.total}`);
      
      if (append) {
        setArticles(prev => [...prev, ...data.articles]);
      } else {
        setArticles(data.articles);
        // Reset scroll position when loading new feed
        if (contentContainerRef.current) {
          contentContainerRef.current.scrollTop = 0;
        }
      }
      
      setPagination(data.pagination);
      setHasMore(page < data.pagination.pages);
    } catch (error) {
      console.error('Failed to fetch articles:', error);
      setError((error as Error).message);
    } finally {
      setIsLoading(false);
    }
  };

  // Load more articles for infinite scroll
  const loadMoreArticles = () => {
    if (!isLoading && pagination.page < pagination.pages) {
      fetchArticles(pagination.page + 1, selectedFeed, true);
    }
  };

  // Add feed
  const addFeed = async (url: string) => {
    try {
      const response = await authenticatedFetch('/api/feeds', {
        method: 'POST',
        body: JSON.stringify({ url }),
      });
      
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || t('addFeedError'));
      }
      
      await fetchFeeds();
      await fetchArticles(1, selectedFeed);
      
      return Promise.resolve();
    } catch (error) {
      console.error('Failed to add feed:', error);
      return Promise.reject(error);
    }
  };

  // Remove feed
  const removeFeed = async (id: string) => {
    try {
      const response = await authenticatedFetch(`/api/feeds/${id}`, {
        method: 'DELETE',
      });
      
      if (!response.ok) {
        throw new Error(t('removeFeedError'));
      }
      
      await fetchFeeds();
      
      // If the removed feed was selected, reset to show all
      if (selectedFeed === id) {
        setSelectedFeed(null);
        await fetchArticles(1, null);
      } else {
        await fetchArticles(1, selectedFeed);
      }
      
      return Promise.resolve();
    } catch (error) {
      console.error('Failed to remove feed:', error);
      return Promise.reject(error);
    }
  };

  // Handle feed selection
  const handleFeedSelect = async (feedId: string | null) => {
    console.log(`Selecting feed: ${feedId}`);
    setSelectedFeed(feedId);
    
    try {
      // 初回ページの記事を取得（追加ではなく置換）
      await fetchArticles(1, feedId, false);
    } catch (error) {
      console.error('Error while selecting feed:', error);
      setError(`Failed to load articles for selected feed: ${(error as Error).message}`);
    }
  };

  // Set up Intersection Observer for infinite scrolling
  useEffect(() => {
    if (!infiniteScrollTriggerRef.current) return;
    
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && !isLoading && hasMore) {
          loadMoreArticles();
        }
      },
      { threshold: 1.0 }
    );
    
    observer.observe(infiniteScrollTriggerRef.current);
    
    return () => {
      if (infiniteScrollTriggerRef.current) {
        observer.unobserve(infiniteScrollTriggerRef.current);
      }
    };
  }, [infiniteScrollTriggerRef, isLoading, hasMore, pagination]);

  // Save and restore scroll positions using bfcache
  useEffect(() => {
    // Save scroll positions before page unload
    const saveScrollPositions = () => {
      if (contentContainerRef.current && sidebarContainerRef.current) {
        sessionStorage.setItem('feedContentScrollPosition', contentContainerRef.current.scrollTop.toString());
        sessionStorage.setItem('feedSidebarScrollPosition', sidebarContainerRef.current.scrollTop.toString());
      }
    };
    
    // Restore scroll positions on page load
    const restoreScrollPositions = () => {
      const contentScrollPosition = sessionStorage.getItem('feedContentScrollPosition');
      const sidebarScrollPosition = sessionStorage.getItem('feedSidebarScrollPosition');
      
      if (contentScrollPosition && contentContainerRef.current) {
        contentContainerRef.current.scrollTop = parseInt(contentScrollPosition);
      }
      
      if (sidebarScrollPosition && sidebarContainerRef.current) {
        sidebarContainerRef.current.scrollTop = parseInt(sidebarScrollPosition);
      }
    };
    
    // Add event listeners for page visibility changes (for bfcache)
    window.addEventListener('beforeunload', saveScrollPositions);
    window.addEventListener('pageshow', (event) => {
      if (event.persisted) {
        // Page was restored from bfcache
        restoreScrollPositions();
      }
    });
    
    // Restore on initial mount
    setTimeout(restoreScrollPositions, 100); // Delay to ensure elements are rendered
    
    return () => {
      window.removeEventListener('beforeunload', saveScrollPositions);
    };
  }, []);

  // フィードの自動更新を行う関数
  const refreshOldestFeeds = async (specificFeedId?: string) => {
    try {
      setIsRefreshing(true);
      
      // URLを構築 - 特定のフィードIDが指定されていればそれを更新、そうでなければ最も古いフィードを更新
      let url = '/api/cron/refresh-feeds?userId=current&partial=true';
      
      if (specificFeedId) {
        url += `&specificFeedId=${specificFeedId}`;
      }
      
      // 最も古いフィードを更新するエンドポイントを呼び出す
      const response = await authenticatedFetch(url, {
        method: 'GET',
      });
      
      if (!response.ok) {
        console.error('Failed to refresh feeds:', response.status);
        setIsRefreshing(false);
        return;
      }
      
      const data = await response.json();
      console.log('Auto-refresh status:', data.message);
      
      // 一定時間後に最新のフィードとニュースを取得
      setTimeout(() => {
        fetchFeeds();
        
        // 特定のフィードが選択されている場合はそのフィードの記事のみを再取得
        if (selectedFeed || specificFeedId) {
          fetchArticles(1, selectedFeed || specificFeedId, false);
        } else {
          fetchArticles(1, null, false);
        }
        
        setIsRefreshing(false);
      }, 2000);
    } catch (error) {
      console.error('Error refreshing feeds:', error);
      setIsRefreshing(false);
    }
  };

  // Load feeds and articles on initial load
  useEffect(() => {
    // 一時的にフィードとニュースをロードして動作を確認（認証チェックを無効化）
    // TODO: Supabaseの設定が完了したら認証チェックを有効にする
    fetchFeeds(true);
    fetchArticles();
    refreshOldestFeeds();
    
    /*
    if (user) {
      // 初回ロード時は強制更新フラグ付きでフィードを取得
      fetchFeeds(true);
      fetchArticles();
      
      // 自動的にフィードの更新も実行
      refreshOldestFeeds();
    } else if (!authLoading && !user) {
      // Not authenticated, redirect to signin
      router.push('/auth/signin');
    }
    */
  }, []);

  if (authLoading) {
    return <div className="flex justify-center items-center h-screen">{t('loading')}</div>;
  }

  /*
  if (!user) {
    return null; // Will redirect to signin
  }
  */

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <Head>
        <title>{t('title')}</title>
      </Head>

      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              {t('pageTitle')}
            </h1>
            {isRefreshing && (
              <span className="ml-3 text-sm bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200 px-2 py-1 rounded-full animate-pulse">
                {t('refreshing')}
              </span>
            )}
          </div>
          <Link
            href="/settings"
            className="text-blue-600 hover:text-blue-500 dark:text-blue-400 dark:hover:text-blue-300"
          >
            {t('settings')}
          </Link>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-400 rounded-md">
            {error}
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 h-[calc(100vh-10rem)]">
          {/* Feeds column - fixed sidebar */}
          <div className="md:col-span-1 h-full overflow-hidden">
            <div className="h-full overflow-y-auto pb-4 pr-2 space-y-6" id="sidebar-container" ref={sidebarContainerRef}>
              <AddFeedForm onAddFeed={addFeed} />
              
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
                <div className="flex justify-between items-center mb-4 sticky top-0 bg-white dark:bg-gray-800 z-10 py-1">
                  <h2 className="text-lg font-medium text-gray-900 dark:text-white">
                    {t('filterByFeed')}
                  </h2>
                  <button 
                    onClick={() => refreshOldestFeeds()}
                    disabled={isRefreshing}
                    className="text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 text-sm flex items-center disabled:opacity-50 disabled:cursor-not-allowed"
                    title={t('refreshAllFeeds')}
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className={`h-4 w-4 mr-1 ${isRefreshing ? 'animate-spin' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                    <span>{isRefreshing ? t('refreshing') : t('refreshAllFeeds')}</span>
                  </button>
                </div>
                
                <div className="space-y-1 max-h-60 overflow-y-auto">
                  <button
                    onClick={() => handleFeedSelect(null)}
                    className={`w-full text-left px-3 py-2 rounded-md text-sm flex items-center ${
                      selectedFeed === null
                        ? 'bg-blue-100 dark:bg-blue-900/50 text-blue-800 dark:text-blue-200'
                        : 'hover:bg-gray-100 dark:hover:bg-gray-700'
                    }`}
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
                    </svg>
                    {t('all')}
                  </button>
                  
                  {feeds.length === 0 ? (
                    <p className="text-sm text-gray-500 dark:text-gray-400 py-2">
                      {t('noFeeds')}
                    </p>
                  ) : (
                    feeds.map((feed) => (
                      <button
                        key={feed.id}
                        onClick={() => handleFeedSelect(feed.id)}
                        className={`w-full text-left px-3 py-2 rounded-md text-sm truncate flex items-center ${
                          selectedFeed === feed.id
                            ? 'bg-blue-100 dark:bg-blue-900/50 text-blue-800 dark:text-blue-200'
                            : 'hover:bg-gray-100 dark:hover:bg-gray-700'
                        }`}
                        title={feed.title}
                      >
                        <img 
                          src={getFaviconUrl(feed.url)} 
                          alt=""
                          width="16" 
                          height="16"
                          className="mr-2 rounded-sm"
                          onError={(e) => {
                            (e.target as HTMLImageElement).src = 'https://www.google.com/s2/favicons?domain=rss.com&sz=32';
                          }}
                        />
                        <span className="truncate flex-grow">{feed.title}</span>
                        <button
                          onClick={(e) => {
                            e.stopPropagation(); // 親ボタンのクリックイベントを止める
                            refreshOldestFeeds(feed.id);
                          }}
                          disabled={isRefreshing}
                          className="ml-1 p-1 text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-50"
                          title={t('refreshFeed')}
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                          </svg>
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation(); // 親ボタンのクリックイベントを止める
                            if (window.confirm(t('removeFeedConfirm'))) {
                              removeFeed(feed.id);
                            }
                          }}
                          className="ml-1 p-1 text-gray-400 hover:text-red-500 dark:text-gray-500 dark:hover:text-red-400 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700"
                          title={t('removeFeed')}
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                          </svg>
                        </button>
                      </button>
                    ))
                  )}
                </div>
              </div>

            </div>
          </div>

          {/* Articles column - scrollable content */}
          <div className="md:col-span-2 h-full overflow-hidden">
            <div className="h-full overflow-y-auto pb-4 pr-2" id="content-container" ref={contentContainerRef}>
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4 mb-6">
                <div className="flex justify-between items-center mb-4 sticky top-0 bg-white dark:bg-gray-800 z-10 py-1">
                  <h2 className="text-lg font-medium text-gray-900 dark:text-white flex items-center">
                    {t('articles')}
                    {selectedFeed && feeds.find(f => f.id === selectedFeed) && (
                      <span className="ml-2 text-sm font-normal text-gray-600 dark:text-gray-400">
                        - {feeds.find(f => f.id === selectedFeed)?.title}
                      </span>
                    )}
                  </h2>
                  {selectedFeed && (
                    <button
                      onClick={() => refreshOldestFeeds(selectedFeed)}
                      disabled={isRefreshing}
                      className="text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 text-sm flex items-center disabled:opacity-50 disabled:cursor-not-allowed"
                      title={t('refreshFeed')}
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className={`h-4 w-4 mr-1 ${isRefreshing ? 'animate-spin' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                      </svg>
                      <span>{isRefreshing ? t('refreshing') : t('refreshFeed')}</span>
                    </button>
                  )}
                </div>

                {isLoading && pagination.page === 1 ? (
                  <div className="text-center py-10">{t('loading')}</div>
                ) : articles.length === 0 ? (
                  <div className="text-center py-10 text-gray-500 dark:text-gray-400">
                    {selectedFeed ? (
                      <>
                        <p className="mb-2">{t('noArticlesForFeed')}</p>
                        <button
                          onClick={() => selectedFeed ? refreshOldestFeeds(selectedFeed) : refreshOldestFeeds()}
                          disabled={isRefreshing}
                          className="mt-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 dark:focus:ring-offset-gray-800 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {isRefreshing ? t('refreshing') : t('refreshNow')}
                        </button>
                      </>
                    ) : (
                      <>
                        <p className="mb-2">{t('noArticles')}</p>
                        {feeds.length > 0 && (
                          <button
                            onClick={() => refreshOldestFeeds()}
                            disabled={isRefreshing}
                            className="mt-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 dark:focus:ring-offset-gray-800 disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            {isRefreshing ? t('refreshing') : t('refreshAllFeeds')}
                          </button>
                        )}
                      </>
                    )}
                  </div>
                ) : (
                  <div className="space-y-2" id="articles-container">
                    {articles.map((article) => (
                      <ArticleItem key={article.id} article={article} />
                    ))}
                    
                    {isLoading && pagination.page > 1 && (
                      <div className="text-center py-4">{t('loading')}</div>
                    )}
                    
                    {!isLoading && pagination.page < pagination.pages && (
                      <div id="infinite-scroll-trigger" className="h-10" ref={infiniteScrollTriggerRef}></div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export const getServerSideProps: GetServerSideProps = async ({ locale }) => {
  return {
    props: {
      ...(await serverSideTranslations(locale || 'en', ['feeds', 'common'])),
    },
  };
};