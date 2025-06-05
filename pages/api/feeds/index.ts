import type { NextApiRequest, NextApiResponse } from 'next';
import { z } from 'zod';
import { withAuth, getAuthenticatedUserId } from '../../../lib/auth-middleware';
import { prisma } from '../../../lib/prisma';
import { fetchRssFeed } from '../../../lib/rss';

// バリデーションスキーマ
const createFeedSchema = z.object({
  url: z.string().url('Please enter a valid URL'),
});

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

/**
 * 最も古いフィードを更新するためのヘルパー関数
 */
async function refreshOldestFeed(req: NextApiRequest, userId: string, forceRefresh = false) {
  try {
    // 最も古く更新されたフィードを1つ取得
    const oldestFeed = await prisma.feed.findFirst({
      where: { userId },
      orderBy: { updatedAt: 'asc' },
    });
    
    if (!oldestFeed) return null;
    
    // 強制更新モードでない場合、時間条件をチェック
    if (!forceRefresh) {
      // 3時間以上前に更新されたフィードのみ更新対象とする
      const threeHoursAgo = new Date(Date.now() - 3 * 60 * 60 * 1000);
      if (oldestFeed.updatedAt > threeHoursAgo) {
        return null; // まだ最近更新されているので更新しない
      }
    }
    
    // バックグラウンドで更新を実行
    fetch(`${req.headers.origin}/api/feeds/${oldestFeed.id}?background=true`, {
      method: 'PUT',
      headers: {
        'Authorization': req.headers.authorization || '',
        'Content-Type': 'application/json'
      }
    }).catch(err => {
      console.error('Background feed refresh failed:', err);
    });
    
    console.log(`Started background refresh for oldest feed: ${oldestFeed.title}`);
    return oldestFeed;
  } catch (error) {
    console.error('Error refreshing oldest feed:', error);
    return null;
  }
}

async function handler(req: NextApiRequest, res: NextApiResponse, userId: string) {

  // フィード一覧を取得
  if (req.method === 'GET') {
    try {
      const feeds = await prisma.feed.findMany({
        where: {
          userId: userId,
        },
        orderBy: {
          createdAt: 'desc',
        },
      });

      // フィードの自動更新処理
      const forceRefresh = req.query.forceRefresh === 'true';
      
      // フィード更新が必要かチェック
      // 1. フィードがある
      // 2. 強制更新フラグがON、または5つ以上のフィードがある
      if (feeds.length > 0 && (forceRefresh || feeds.length >= 5)) {
        // すべてのフィードを更新するが、ヘッダーテストのため1つだけ先に実行
        refreshOldestFeed(req, userId, forceRefresh).catch(err => {
          console.error('Failed to schedule background refresh:', err);
        });

        // 強制更新の場合は全フィードを順次更新
        if (forceRefresh) {
          console.log('Force refreshing all feeds');
          const otherFeeds = feeds.slice(1); // 最初のフィードは既に更新中なのでスキップ
          
          // 複数フィードを同時に更新すると認証問題が生じるため、1秒間隔で順次実行
          for (let i = 0; i < otherFeeds.length; i++) {
            const feed = otherFeeds[i];
            setTimeout(() => {
              fetch(`${req.headers.origin}/api/feeds/${feed.id}?background=true`, {
                method: 'PUT',
                headers: {
                  'Authorization': req.headers.authorization || '',
                  'Content-Type': 'application/json'
                }
              }).catch(err => {
                console.error(`Background refresh failed for feed ${feed.id}:`, err);
              });
              console.log(`Scheduled refresh for feed: ${feed.title}`);
            }, (i + 1) * 1000); // 1秒間隔で実行
          }
        }
      }

      return res.status(200).json(feeds);
    } catch (error) {
      console.error('Error fetching feeds:', error);
      return res.status(500).json({ message: 'Failed to fetch feeds' });
    }
  }

  // 新しいフィードを追加
  if (req.method === 'POST') {
    try {
      // リクエストボディのバリデーション
      const validationResult = createFeedSchema.safeParse(req.body);
      if (!validationResult.success) {
        return res.status(400).json({ 
          message: 'Invalid input', 
          errors: validationResult.error.errors 
        });
      }

      const { url } = validationResult.data;

      // 既にURL登録済みかチェック
      const existingFeed = await prisma.feed.findFirst({
        where: {
          userId: userId,
          url: url,
        },
      });

      if (existingFeed) {
        return res.status(400).json({ message: 'This feed already exists' });
      }

      // URLをフォーマット
      const formattedUrl = url.trim();
      
      try {
        // RSSフィードを取得して解析（タイムアウト付き）
        const feedData = await timeoutPromise(
          FEED_FETCH_TIMEOUT,
          fetchRssFeed(formattedUrl),
          `Feed fetch timeout after ${FEED_FETCH_TIMEOUT}ms: ${formattedUrl}`
        );

        // タイトルが空の場合はエラー
        if (!feedData.title) {
          return res.status(400).json({ message: 'Invalid RSS feed: Missing title' });
        }

        // フィードをデータベースに保存
        const feed = await prisma.feed.create({
          data: {
            title: feedData.title.substring(0, 255), // タイトルが長すぎる場合に切り詰め
            url: feedData.url || formattedUrl,
            description: feedData.description ? feedData.description.substring(0, 1000) : null, // 説明が長すぎる場合に切り詰め
            userId: userId,
          },
        });

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
          
          // 一括で記事を作成
          if (newItems.length > 0) {
            try {
              await prisma.article.createMany({
                data: newItems.map(item => ({
                  title: item.title.substring(0, 255), // タイトルが長すぎる場合は切り詰め
                  url: item.url,
                  description: item.description ? item.description.substring(0, 1000) : null, // 説明が長すぎる場合は切り詰め
                  content: item.content ? item.content.substring(0, 10000) : null, // 内容が長すぎる場合は切り詰め
                  publishedAt: item.publishedAt,
                  feedId: feed.id
                })),
              });
            } catch (articleError) {
              // 記事の作成に失敗しても、フィード自体は作成済みなので続行
              console.error('Failed to create articles:', articleError);
            }
          }
        }

        return res.status(201).json(feed);
      } catch (rssFetchError) {
        console.error('Error processing RSS feed:', rssFetchError);
        return res.status(400).json({ 
          message: `Failed to process RSS feed: ${(rssFetchError as Error).message}` 
        });
      }
    } catch (error) {
      console.error('Error adding feed:', error);
      // 詳細なエラーメッセージ
      if ((error as Error).message.includes('RSS')) {
        return res.status(400).json({ 
          message: 'The URL doesn\'t contain a valid RSS feed',
          detail: (error as Error).message
        });
      } else if ((error as Error).message.includes('timeout')) {
        return res.status(408).json({ 
          message: 'The feed server took too long to respond',
          detail: (error as Error).message
        });
      } else if ((error as Error).message.includes('URL')) {
        return res.status(400).json({ 
          message: 'Invalid URL format',
          detail: (error as Error).message 
        });
      } else if ((error as Error).message.includes('404')) {
        return res.status(404).json({ 
          message: 'The feed URL was not found',
          detail: (error as Error).message 
        });
      }
      return res.status(500).json({ 
        message: 'Failed to add feed. Please try again later.',
        detail: process.env.NODE_ENV === 'development' ? (error as Error).message : undefined
      });
    }
  }

  // その他のHTTPメソッドには405を返す
  return res.status(405).json({ message: 'Method not allowed' });
}

export default withAuth(handler);