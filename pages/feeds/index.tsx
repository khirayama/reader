import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/router';
import { useTranslation } from 'next-i18next';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
import Head from 'next/head';
import Link from 'next/link';
import { GetServerSideProps } from 'next';
import { z } from 'zod';
import { useTheme } from '../../lib/theme';

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
  reads: Array<{
    id: string;
    createdAt: string;
  }>;
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
      <h2 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
        {t('addFeed')}
      </h2>
      
      <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-2">
        <div className="flex-grow">
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
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 dark:focus:ring-offset-gray-800 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isLoading ? t('processing') : t('addFeedButton')}
        </button>
      </form>
    </div>
  );
}

// Component for displaying a single feed item
function FeedItem({ feed, onRemove }: { feed: Feed; onRemove: (id: string) => Promise<void> }) {
  const { t } = useTranslation('feeds');
  const [isRemoving, setIsRemoving] = useState(false);

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
  const isRead = article.reads.length > 0;
  
  return (
    <div className={`bg-white dark:bg-gray-800 rounded-lg shadow p-4 mb-3 ${isRead ? 'opacity-70' : ''}`}>
      <div className="flex items-center mb-2">
        <span className="text-xs px-2 py-1 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 rounded">
          {article.feed.title}
        </span>
        {isRead && (
          <span className="ml-2 text-xs px-2 py-1 bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-300 rounded">
            {t('markAsRead')}
          </span>
        )}
      </div>
      <h3 className="text-lg font-medium text-gray-900 dark:text-white">
        <Link href={`/articles/${article.id}`} className="hover:underline">
          {article.title}
        </Link>
      </h3>
      {article.description && (
        <p className="text-sm text-gray-600 dark:text-gray-400 mt-2 line-clamp-3">
          {article.description}
        </p>
      )}
      <div className="text-xs text-gray-500 dark:text-gray-500 mt-2 flex justify-between">
        <span>
          {new Date(article.publishedAt).toLocaleDateString()}
        </span>
        <Link 
          href={`/articles/${article.id}`} 
          className="text-blue-600 dark:text-blue-400 hover:underline"
        >
          {t('readMore')}
        </Link>
      </div>
    </div>
  );
}

export default function FeedsPage() {
  const { data: session, status } = useSession({ required: true });
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
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedFeed, setSelectedFeed] = useState<string | null>(null);
  const [showUnreadOnly, setShowUnreadOnly] = useState(false);

  // Fetch feeds
  const fetchFeeds = async () => {
    try {
      const response = await fetch('/api/feeds');
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

  // Fetch articles
  const fetchArticles = async (page = 1, feedId?: string | null, unread = false) => {
    setIsLoading(true);
    try {
      let url = `/api/articles?page=${page}&limit=${pagination.limit}`;
      
      if (feedId) {
        url += `&feedId=${feedId}`;
      }
      
      if (unread) {
        url += '&unread=true';
      }
      
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`Error: ${response.status}`);
      }
      
      const data = await response.json();
      setArticles(data.articles);
      setPagination(data.pagination);
    } catch (error) {
      console.error('Failed to fetch articles:', error);
      setError((error as Error).message);
    } finally {
      setIsLoading(false);
    }
  };

  // Add feed
  const addFeed = async (url: string) => {
    try {
      const response = await fetch('/api/feeds', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ url }),
      });
      
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || t('addFeedError'));
      }
      
      await fetchFeeds();
      await fetchArticles(1, selectedFeed, showUnreadOnly);
      
      return Promise.resolve();
    } catch (error) {
      console.error('Failed to add feed:', error);
      return Promise.reject(error);
    }
  };

  // Remove feed
  const removeFeed = async (id: string) => {
    try {
      const response = await fetch(`/api/feeds/${id}`, {
        method: 'DELETE',
      });
      
      if (!response.ok) {
        throw new Error(t('removeFeedError'));
      }
      
      await fetchFeeds();
      
      // If the removed feed was selected, reset to show all
      if (selectedFeed === id) {
        setSelectedFeed(null);
        await fetchArticles(1, null, showUnreadOnly);
      } else {
        await fetchArticles(1, selectedFeed, showUnreadOnly);
      }
      
      return Promise.resolve();
    } catch (error) {
      console.error('Failed to remove feed:', error);
      return Promise.reject(error);
    }
  };

  // Handle feed selection
  const handleFeedSelect = async (feedId: string | null) => {
    setSelectedFeed(feedId);
    await fetchArticles(1, feedId, showUnreadOnly);
  };

  // Handle unread filter toggle
  const handleUnreadToggle = async (unread: boolean) => {
    setShowUnreadOnly(unread);
    await fetchArticles(1, selectedFeed, unread);
  };

  // Load feeds and articles on initial load
  useEffect(() => {
    if (status === 'authenticated') {
      fetchFeeds();
      fetchArticles();
    }
  }, [status]);

  // Handle pagination
  const handlePageChange = async (page: number) => {
    await fetchArticles(page, selectedFeed, showUnreadOnly);
  };

  if (status === 'loading') {
    return <div className="flex justify-center items-center h-screen">{t('loading')}</div>;
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <Head>
        <title>{t('title')}</title>
      </Head>

      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            {t('pageTitle')}
          </h1>
          <Link
            href="/"
            className="text-blue-600 hover:text-blue-500 dark:text-blue-400 dark:hover:text-blue-300"
          >
            ← {t('goBack')}
          </Link>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-400 rounded-md">
            {error}
          </div>
        )}

        <AddFeedForm onAddFeed={addFeed} />

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Feeds column */}
          <div className="md:col-span-1">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4 mb-6">
              <h2 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
                {t('filterByFeed')}
              </h2>
              
              <div className="space-y-2">
                <button
                  onClick={() => handleFeedSelect(null)}
                  className={`w-full text-left px-3 py-2 rounded-md ${
                    selectedFeed === null
                      ? 'bg-blue-100 dark:bg-blue-900/50 text-blue-800 dark:text-blue-200'
                      : 'hover:bg-gray-100 dark:hover:bg-gray-700'
                  }`}
                >
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
                      className={`w-full text-left px-3 py-2 rounded-md ${
                        selectedFeed === feed.id
                          ? 'bg-blue-100 dark:bg-blue-900/50 text-blue-800 dark:text-blue-200'
                          : 'hover:bg-gray-100 dark:hover:bg-gray-700'
                      }`}
                    >
                      {feed.title}
                    </button>
                  ))
                )}
              </div>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
              <div className="flex items-center mb-2">
                <input
                  id="unread-toggle"
                  type="checkbox"
                  checked={showUnreadOnly}
                  onChange={(e) => handleUnreadToggle(e.target.checked)}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <label
                  htmlFor="unread-toggle"
                  className="ml-2 block text-sm text-gray-900 dark:text-white"
                >
                  {t('unread')}
                </label>
              </div>
            </div>
          </div>

          {/* Articles column */}
          <div className="md:col-span-2">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4 mb-6">
              <h2 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
                {t('articles')}
                {selectedFeed && feeds.find(f => f.id === selectedFeed) && (
                  <span className="ml-2 text-sm font-normal text-gray-600 dark:text-gray-400">
                    - {feeds.find(f => f.id === selectedFeed)?.title}
                  </span>
                )}
              </h2>

              {isLoading ? (
                <div className="text-center py-10">{t('loading')}</div>
              ) : articles.length === 0 ? (
                <div className="text-center py-10 text-gray-500 dark:text-gray-400">
                  {t('noArticles')}
                </div>
              ) : (
                <div className="space-y-4">
                  {articles.map((article) => (
                    <ArticleItem key={article.id} article={article} />
                  ))}
                </div>
              )}

              {/* Pagination */}
              {pagination.pages > 1 && (
                <div className="flex justify-center mt-6">
                  <nav className="flex items-center">
                    <button
                      onClick={() => handlePageChange(pagination.page - 1)}
                      disabled={pagination.page === 1}
                      className="px-3 py-1 rounded-md mr-2 bg-gray-200 dark:bg-gray-700 disabled:opacity-50"
                    >
                      &lt;
                    </button>
                    
                    <span className="text-sm text-gray-700 dark:text-gray-300">
                      {pagination.page} / {pagination.pages}
                    </span>
                    
                    <button
                      onClick={() => handlePageChange(pagination.page + 1)}
                      disabled={pagination.page === pagination.pages}
                      className="px-3 py-1 rounded-md ml-2 bg-gray-200 dark:bg-gray-700 disabled:opacity-50"
                    >
                      &gt;
                    </button>
                  </nav>
                </div>
              )}
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