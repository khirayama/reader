import { useState, useEffect, useMemo } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/router';
import { useTranslation } from 'next-i18next';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
import Head from 'next/head';
import Link from 'next/link';
import { GetServerSideProps } from 'next';

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

// Types
interface Article {
  id: string;
  title: string;
  url: string;
  description?: string;
  content?: string;
  publishedAt: string;
  createdAt: string;
  updatedAt: string;
  feed: {
    id: string;
    title: string;
    url: string;
  };
}

export default function ArticleDetailPage() {
  const { data: session, status } = useSession({ required: true });
  const router = useRouter();
  const { id } = router.query;
  const { t } = useTranslation('feeds');
  
  const [article, setArticle] = useState<Article | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  // Fetch article details
  const fetchArticle = async () => {
    if (!id) return;

    setIsLoading(true);
    try {
      const response = await fetch(`/api/articles/${id}`);
      if (!response.ok) {
        throw new Error(`Error: ${response.status}`);
      }
      const data = await response.json();
      setArticle(data);
    } catch (error) {
      console.error('Failed to fetch article:', error);
      setError((error as Error).message);
    } finally {
      setIsLoading(false);
    }
  };


  // Load article on initial load
  useEffect(() => {
    if (status === 'authenticated' && id) {
      fetchArticle();
    }
  }, [status, id]);

  if (status === 'loading' || isLoading) {
    return <div className="flex justify-center items-center h-screen">{t('loading')}</div>;
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <Head>
        <title>{article?.title ? `${article.title} | ${t('title')}` : t('title')}</title>
      </Head>

      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="mb-6">
          <Link
            href={`/feeds/${article?.feed.id}`}
            className="text-blue-600 hover:text-blue-500 dark:text-blue-400 dark:hover:text-blue-300 mb-2 inline-block"
          >
            ← {t('goBack')}
          </Link>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-400 rounded-md">
            {error}
          </div>
        )}

        {article ? (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <div className="flex items-center mb-4">
              <div className="flex items-center">
                <img 
                  src={getFaviconUrl(article.url)}
                  alt=""
                  width="16" 
                  height="16"
                  className="mr-2 rounded-sm"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = 'https://www.google.com/s2/favicons?domain=rss.com&sz=32';
                  }}
                />
                <Link
                  href={`/feeds/${article.feed.id}`}
                  className="text-sm px-2 py-1 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 rounded hover:bg-blue-200 dark:hover:bg-blue-800"
                >
                  {article.feed.title}
                </Link>
              </div>
              <span className="text-sm text-gray-500 dark:text-gray-400 ml-2">
                {new Date(article.publishedAt).toLocaleDateString()}
              </span>
            </div>
            
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
              {article.title}
            </h1>
            
            <div className="flex justify-end mb-6">
              <a
                href={article.url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-blue-600 dark:text-blue-400 hover:underline"
              >
                {t('viewOriginal')} ↗
              </a>
            </div>
            
            {article.description && (
              <div className="mb-6">
                <p className="text-gray-700 dark:text-gray-300 italic">
                  {article.description}
                </p>
              </div>
            )}
            
            {article.content ? (
              <div className="prose dark:prose-invert max-w-none prose-img:rounded-lg prose-a:text-blue-600 dark:prose-a:text-blue-400">
                <div dangerouslySetInnerHTML={{ __html: article.content }} />
              </div>
            ) : (
              <div className="p-4 bg-gray-100 dark:bg-gray-700 rounded-lg">
                <p className="text-gray-700 dark:text-gray-300">
                  {t('noArticles')}
                </p>
                <a
                  href={article.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-2 inline-block text-blue-600 dark:text-blue-400 hover:underline"
                >
                  {t('viewOriginal')} ↗
                </a>
              </div>
            )}
          </div>
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