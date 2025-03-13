import type { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth';
import { authOptions } from '../auth/[...nextauth]';
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

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const session = await getServerSession(req, res, authOptions);

  if (!session) {
    return res.status(401).json({ message: 'Unauthorized' });
  }

  const feedId = req.query.id as string;
  const fetchTimeout = Number(req.query.timeout) || FEED_FETCH_TIMEOUT;

  // フィード詳細の取得
  if (req.method === 'GET') {
    try {
      // フィードの存在確認とアクセス権限チェック
      const feed = await prisma.feed.findFirst({
        where: {
          id: feedId,
          userId: session.user.id as string,
        },
        include: {
          articles: {
            orderBy: {
              publishedAt: 'desc',
            },
          },
        },
      });

      if (!feed) {
        return res.status(404).json({ message: 'Feed not found' });
      }

      // フィードが1時間以上更新されていない場合、バックグラウンドで更新処理を実行
      const lastUpdated = new Date(feed.updatedAt);
      const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
      
      if (lastUpdated < oneHourAgo) {
        // バックグラウンドで更新処理を開始（結果は待たない）
        fetch(`${req.headers.origin}/api/feeds/${feedId}?background=true`, {
          method: 'PUT',
          headers: {
            'Authorization': req.headers.authorization || '',
            'Content-Type': 'application/json'
          }
        }).catch(err => {
          console.error('Background feed refresh failed:', err);
        });
        
        console.log(`Started background refresh for feed: ${feed.title}`);
      }

      return res.status(200).json(feed);
    } catch (error) {
      console.error('Error fetching feed:', error);
      return res.status(500).json({ message: 'Failed to fetch feed' });
    }
  }

  // フィードの更新（新しい記事の取得）
  if (req.method === 'PUT') {
    const startTime = Date.now();
    const isBackground = req.query.background === 'true';
    
    try {
      // フィードの存在確認とアクセス権限チェック
      const feed = await prisma.feed.findFirst({
        where: {
          id: feedId,
          userId: session.user.id as string,
        },
      });

      if (!feed) {
        return res.status(404).json({ message: 'Feed not found' });
      }

      // RSSフィードを再取得（タイムアウト付き）
      const feedData = await timeoutPromise(
        fetchTimeout,
        fetchRssFeed(feed.url),
        `Feed fetch timeout after ${fetchTimeout}ms: ${feed.url}`
      );

      // フィード情報を更新
      await prisma.feed.update({
        where: {
          id: feedId,
        },
        data: {
          title: feedData.title || feed.title,
          description: feedData.description || feed.description,
          updatedAt: new Date(),
        },
      });

      // 既存のURLを一括チェックするための配列を作成
      const urls = feedData.items.map(item => item.url).filter(Boolean);
      
      if (urls.length === 0) {
        console.log(`No valid URLs found in feed: ${feed.title} (${feed.url})`);
        return res.status(200).json({ 
          feed, 
          newArticles: [],
          message: 'No valid articles found in feed' 
        });
      }
      
      // 存在するURLを一括クエリ
      const existingArticles = await prisma.article.findMany({
        where: { url: { in: urls } },
        select: { url: true }
      });
      
      // 既存URLのセットを作成
      const existingUrls = new Set(existingArticles.map(article => article.url));
      
      // 新しい記事のみをフィルタリング
      const newItems = feedData.items.filter(item => item.url && !existingUrls.has(item.url));
      
      // 型定義を追加
      interface Article {
        id: string;
        title: string;
        url: string;
        description: string | null;
        content: string | null;
        publishedAt: Date;
        createdAt: Date;
        updatedAt: Date;
        feedId: string;
      }
      
      let newArticles: Article[] = [];
      
      // 一括で新しい記事を作成
      if (newItems.length > 0) {
        const createData = newItems.map(item => ({
          title: item.title,
          url: item.url,
          description: item.description || null,
          content: item.content || null,
          publishedAt: item.publishedAt,
          feedId: feed.id
        }));
        
        // createMany を使用して一括作成
        await prisma.article.createMany({
          data: createData,
          skipDuplicates: true,
        });
        
        // フロントエンドに返すために新しい記事を取得
        newArticles = await prisma.article.findMany({
          where: {
            url: { in: newItems.map(item => item.url) },
            feedId: feed.id
          }
        });
      }

      const duration = (Date.now() - startTime) / 1000;
      console.log(`Feed updated: ${feed.title} - Added ${newArticles.length} articles in ${duration.toFixed(2)} seconds`);

      return res.status(200).json({ 
        feed, 
        newArticles,
        message: `Feed updated with ${newArticles.length} new articles` 
      });
    } catch (error) {
      console.error('Error updating feed:', error);
      
      // バックグラウンド更新の場合はエラーを抑制して単に更新日時だけ更新
      if (isBackground) {
        try {
          await prisma.feed.update({
            where: { id: feedId },
            data: { updatedAt: new Date() }
          });
          console.log(`Updated timestamp for failed background refresh: ${feedId}`);
        } catch (updateError) {
          console.error('Failed to update timestamp:', updateError);
        }
        
        // バックグラウンド更新はクライアントが待機していないので200を返す
        return res.status(200).json({ 
          message: 'Background refresh failed, but timestamp updated',
          error: (error as Error).message
        });
      }
      
      return res.status(500).json({ message: 'Failed to update feed' });
    }
  }

  // フィードの削除
  if (req.method === 'DELETE') {
    try {
      // フィードの存在確認とアクセス権限チェック
      const feed = await prisma.feed.findFirst({
        where: {
          id: feedId,
          userId: session.user.id as string,
        },
      });

      if (!feed) {
        return res.status(404).json({ message: 'Feed not found' });
      }

      // フィード削除（関連する記事も自動的に削除される）
      await prisma.feed.delete({
        where: {
          id: feedId,
        },
      });

      return res.status(200).json({ message: 'Feed deleted successfully' });
    } catch (error) {
      console.error('Error deleting feed:', error);
      return res.status(500).json({ message: 'Failed to delete feed' });
    }
  }

  // その他のHTTPメソッドには405を返す
  return res.status(405).json({ message: 'Method not allowed' });
}