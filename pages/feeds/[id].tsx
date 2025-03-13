import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/router';
import { useTranslation } from 'next-i18next';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
import Head from 'next/head';
import Link from 'next/link';
import { GetServerSideProps } from 'next';

// Types
interface Feed {
  id: string;
  title: string;
  url: string;
  description?: string;
  createdAt: string;
  updatedAt: string;
  articles: Article[];
}

interface Article {
  id: string;
  title: string;
  url: string;
  description?: string;
  content?: string;
  publishedAt: string;
  createdAt: string;
  updatedAt: string;
}

// Component for displaying a single article item
function ArticleItem({ article }: { 
  article: Article; 
}) {
  const { t } = useTranslation('feeds');
  
  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4 mb-3">
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
        <div>
          <Link 
            href={`/articles/${article.id}`} 
            className="text-blue-600 dark:text-blue-400 hover:underline"
          >
            {t('readMore')}
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function FeedDetailPage() {
  const { data: session, status } = useSession({ required: true });
  const router = useRouter();
  const { id } = router.query;
  const { t } = useTranslation('feeds');
  
  const [feed, setFeed] = useState<Feed | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Fetch feed details
  const fetchFeed = async () => {
    if (!id) return;

    setIsLoading(true);
    try {
      const response = await fetch(`/api/feeds/${id}`);
      if (!response.ok) {
        throw new Error(`Error: ${response.status}`);
      }
      const data = await response.json();
      setFeed(data);
    } catch (error) {
      console.error('Failed to fetch feed:', error);
      setError((error as Error).message);
    } finally {
      setIsLoading(false);
    }
  };

  // Refresh feed to get latest articles
  const refreshFeed = async () => {
    if (!id) return;

    setIsRefreshing(true);
    try {
      const response = await fetch(`/api/feeds/${id}`, {
        method: 'PUT',
      });
      
      if (!response.ok) {
        throw new Error(`Error: ${response.status}`);
      }
      
      await fetchFeed();
    } catch (error) {
      console.error('Failed to refresh feed:', error);
      setError((error as Error).message);
    } finally {
      setIsRefreshing(false);
    }
  };


  // Load feed on initial load and refresh if needed
  useEffect(() => {
    if (status === 'authenticated' && id) {
      fetchFeed().then(() => {
        // 初回ロード時に自動更新を実行
        refreshFeed().catch(err => {
          console.error('Auto refresh failed:', err);
        });
      });
    }
  }, [status, id]);

  if (status === 'loading' || isLoading) {
    return <div className="flex justify-center items-center h-screen">{t('loading')}</div>;
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <Head>
        <title>{feed?.title ? `${feed.title} | ${t('title')}` : t('title')}</title>
      </Head>

      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-6">
          <div>
            <Link
              href="/feeds"
              className="text-blue-600 hover:text-blue-500 dark:text-blue-400 dark:hover:text-blue-300 mb-2 inline-block"
            >
              ← {t('goBack')}
            </Link>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              {feed?.title}
            </h1>
          </div>
          <button
            onClick={refreshFeed}
            disabled={isRefreshing}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 dark:focus:ring-offset-gray-800 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isRefreshing ? t('refreshing') : t('refresh')}
          </button>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-400 rounded-md">
            {error}
          </div>
        )}

        {feed ? (
          <>
            {feed.description && (
              <div className="mb-6 p-4 bg-white dark:bg-gray-800 rounded-lg shadow">
                <p className="text-gray-600 dark:text-gray-400">
                  {feed.description}
                </p>
                <p className="text-sm text-gray-500 dark:text-gray-500 mt-2">
                  {t('lastUpdated')} {new Date(feed.updatedAt).toLocaleString()}
                </p>
              </div>
            )}

            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4 mb-6">
              <h2 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
                {t('articles')}
              </h2>

              {feed.articles.length === 0 ? (
                <div className="text-center py-10 text-gray-500 dark:text-gray-400">
                  <p className="mb-4">{t('noArticles')}</p>
                  <button
                    onClick={refreshFeed}
                    disabled={isRefreshing}
                    className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 dark:focus:ring-offset-gray-800 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isRefreshing ? t('refreshing') : t('refreshNow')}
                  </button>
                </div>
              ) : (
                <div className="space-y-4">
                  {feed.articles
                    .sort((a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime())
                    .map((article) => (
                      <ArticleItem 
                        key={article.id} 
                        article={article} 
                      />
                    ))}
                </div>
              )}
            </div>
          </>
        ) : (
          <div className="text-center py-10 text-gray-500 dark:text-gray-400">
            {t('loading')}
          </div>
        )}
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