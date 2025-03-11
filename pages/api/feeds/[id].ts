import type { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth';
import { authOptions } from '../auth/[...nextauth]';
import { prisma } from '../../../lib/prisma';
import { fetchRssFeed } from '../../../lib/rss';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const session = await getServerSession(req, res, authOptions);

  if (!session) {
    return res.status(401).json({ message: 'Unauthorized' });
  }

  const feedId = req.query.id as string;

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

      return res.status(200).json(feed);
    } catch (error) {
      console.error('Error fetching feed:', error);
      return res.status(500).json({ message: 'Failed to fetch feed' });
    }
  }

  // フィードの更新（新しい記事の取得）
  if (req.method === 'PUT') {
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

      // RSSフィードを再取得
      const feedData = await fetchRssFeed(feed.url);

      // フィード情報を更新
      await prisma.feed.update({
        where: {
          id: feedId,
        },
        data: {
          title: feedData.title,
          description: feedData.description,
          updatedAt: new Date(),
        },
      });

      // 新しい記事を追加
      const newArticles = [];
      for (const item of feedData.items) {
        // URL重複チェック
        const existingArticle = await prisma.article.findUnique({
          where: { url: item.url },
        });

        // 重複がない場合のみ保存
        if (!existingArticle) {
          const article = await prisma.article.create({
            data: {
              title: item.title,
              url: item.url,
              description: item.description,
              content: item.content,
              publishedAt: item.publishedAt,
              feedId: feed.id,
            },
          });
          newArticles.push(article);
        }
      }

      return res.status(200).json({ 
        feed, 
        newArticles,
        message: `Feed updated with ${newArticles.length} new articles` 
      });
    } catch (error) {
      console.error('Error updating feed:', error);
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