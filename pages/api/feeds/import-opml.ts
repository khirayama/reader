import { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../auth/[...nextauth]';
import { parseOPML, OPMLFeed } from '../../../lib/opml';
import { prisma } from '../../../lib/prisma';
import { fetchRssFeed } from '../../../lib/rss';

// フィード取得のタイムアウト (ミリ秒)
const FEED_FETCH_TIMEOUT = 8000; // 8秒

/**
 * 指定した時間後にタイムアウトするPromiseを作成
 */
function timeoutPromise<T>(ms: number, promise: Promise<T>, errorMessage: string): Promise<T> {
  return new Promise((resolve, reject) => {
    const timeoutId = setTimeout(() => {
      reject(new Error(errorMessage));
    }, ms);
    
    promise.then(
      (result) => {
        clearTimeout(timeoutId);
        resolve(result);
      },
      (error) => {
        clearTimeout(timeoutId);
        reject(error);
      }
    );
  });
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  // POSTリクエストのみを受け付ける
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // セッションを取得し、認証を確認
    const session = await getServerSession(req, res, authOptions);
    
    if (!session || !session.user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const userId = session.user.id;
    
    // リクエストからOPMLデータを取得
    const { opmlContent } = req.body;
    
    if (!opmlContent || typeof opmlContent !== 'string') {
      return res.status(400).json({ error: 'Invalid OPML content' });
    }

    // OPMLをパース
    const feeds = parseOPML(opmlContent);
    
    if (feeds.length === 0) {
      return res.status(400).json({ error: 'No valid feeds found in OPML' });
    }

    // 各フィードをデータベースに追加
    const addedFeeds: string[] = [];
    const existingFeeds: string[] = [];
    const failedFeeds: string[] = [];
    const totalArticles = { added: 0, skipped: 0 };
    
    // 並列処理数を制限（サーバー負荷対策）
    const CONCURRENT_REQUESTS = 2;
    
    // フィードを処理するための関数
    const processFeed = async (feed: OPMLFeed): Promise<void> => {
      try {
        // すでに同じURLのフィードが存在するか確認
        const existingFeed = await prisma.feed.findFirst({
          where: {
            url: feed.xmlUrl,
            userId
          }
        });
        
        if (existingFeed) {
          existingFeeds.push(feed.title);
          return;
        }
        
        try {
          // RSSフィードを取得して解析
          const feedData = await timeoutPromise(
            FEED_FETCH_TIMEOUT,
            fetchRssFeed(feed.xmlUrl),
            `Feed fetch timeout after ${FEED_FETCH_TIMEOUT}ms: ${feed.xmlUrl}`
          );
          
          // 新しいフィードを追加
          const newFeed = await prisma.feed.create({
            data: {
              title: feedData.title || feed.title,
              url: feed.xmlUrl,
              description: feedData.description || feed.description || null,
              userId
            }
          });
          
          addedFeeds.push(newFeed.title);
          
          // 記事も追加
          if (feedData.items && feedData.items.length > 0) {
            // 既存のURLをチェックするための配列を作成
            const urls = feedData.items.map(item => item.url).filter(Boolean);
            
            if (urls.length > 0) {
              // 存在するURLを一括クエリ
              const existingArticles = await prisma.article.findMany({
                where: { url: { in: urls } },
                select: { url: true }
              });
              
              // 既存URLのセットを作成
              const existingUrls = new Set(existingArticles.map(article => article.url));
              
              // 新しい記事のみをフィルタリング
              const newItems = feedData.items.filter(item => item.url && !existingUrls.has(item.url));
              
              totalArticles.skipped += (urls.length - newItems.length);
              
              // 一括で記事を作成
              if (newItems.length > 0) {
                try {
                  await prisma.article.createMany({
                    data: newItems.map(item => ({
                      title: item.title.substring(0, 255), // タイトルが長すぎる場合は切り詰め
                      url: item.url,
                      description: item.description ? item.description.substring(0, 1000) : null,
                      content: item.content ? item.content.substring(0, 10000) : null,
                      publishedAt: item.publishedAt,
                      feedId: newFeed.id
                    })),
                  });
                  
                  totalArticles.added += newItems.length;
                } catch (articleError) {
                  console.error(`Error adding articles for feed ${newFeed.title}:`, articleError);
                }
              }
            }
          }
        } catch (rssError) {
          console.error(`Error fetching RSS data for ${feed.title} (${feed.xmlUrl}):`, rssError);
          
          // RSS取得に失敗しても、OPMLのメタデータだけでフィードを追加
          const newFeed = await prisma.feed.create({
            data: {
              title: feed.title,
              url: feed.xmlUrl,
              description: feed.description || null,
              userId
            }
          });
          
          addedFeeds.push(newFeed.title + ' (metadata only)');
        }
      } catch (error) {
        console.error(`Error adding feed ${feed.title}:`, error);
        failedFeeds.push(feed.title);
      }
    }
    
    // バッチで並列処理
    for (let i = 0; i < feeds.length; i += CONCURRENT_REQUESTS) {
      const batch = feeds.slice(i, i + CONCURRENT_REQUESTS);
      await Promise.all(batch.map(feed => processFeed(feed)));
    }

    return res.status(200).json({ 
      success: true, 
      message: `Added ${addedFeeds.length} feeds (with ${totalArticles.added} articles), ${existingFeeds.length} already existed`,
      addedFeeds,
      existingFeeds,
      failedFeeds,
      articles: totalArticles
    });
  } catch (error) {
    console.error('Error importing OPML:', error);
    return res.status(500).json({ error: 'Failed to import OPML' });
  }
}