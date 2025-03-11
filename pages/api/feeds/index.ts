import type { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth';
import { z } from 'zod';
import { authOptions } from '../auth/[...nextauth]';
import { prisma } from '../../../lib/prisma';
import { fetchRssFeed } from '../../../lib/rss';

// バリデーションスキーマ
const createFeedSchema = z.object({
  url: z.string().url('Please enter a valid URL'),
});

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const session = await getServerSession(req, res, authOptions);

  if (!session) {
    return res.status(401).json({ message: 'Unauthorized' });
  }

  // フィード一覧を取得
  if (req.method === 'GET') {
    try {
      const feeds = await prisma.feed.findMany({
        where: {
          userId: session.user.id as string,
        },
        orderBy: {
          createdAt: 'desc',
        },
      });

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
          userId: session.user.id as string,
          url: url,
        },
      });

      if (existingFeed) {
        return res.status(400).json({ message: 'This feed already exists' });
      }

      // RSSフィードを取得して解析
      const feedData = await fetchRssFeed(url);

      // フィードをデータベースに保存
      const feed = await prisma.feed.create({
        data: {
          title: feedData.title,
          url: feedData.url,
          description: feedData.description,
          userId: session.user.id as string,
        },
      });

      // 記事も保存
      await Promise.all(
        feedData.items.map(async (item) => {
          // URL重複チェック
          const existingArticle = await prisma.article.findUnique({
            where: { url: item.url },
          });

          // 重複がない場合のみ保存
          if (!existingArticle) {
            await prisma.article.create({
              data: {
                title: item.title,
                url: item.url,
                description: item.description,
                content: item.content,
                publishedAt: item.publishedAt,
                feedId: feed.id,
              },
            });
          }
        })
      );

      return res.status(201).json(feed);
    } catch (error) {
      console.error('Error adding feed:', error);
      if ((error as Error).message === 'Invalid RSS feed') {
        return res.status(400).json({ message: 'The URL doesn\'t contain a valid RSS feed' });
      }
      return res.status(500).json({ message: 'Failed to add feed' });
    }
  }

  // その他のHTTPメソッドには405を返す
  return res.status(405).json({ message: 'Method not allowed' });
}