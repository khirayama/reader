import type { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth';
import { authOptions } from '../auth/[...nextauth]';
import { prisma } from '../../../lib/prisma';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const session = await getServerSession(req, res, authOptions);

  if (!session) {
    return res.status(401).json({ message: 'Unauthorized' });
  }

  if (req.method === 'GET') {
    try {
      // クエリパラメータの取得
      const limit = Number(req.query.limit) || 20;
      const page = Number(req.query.page) || 1;
      const skip = (page - 1) * limit;
      const feedId = req.query.feedId as string | undefined;
      const search = req.query.search as string | undefined;

      // 検索条件の構築
      const where: any = {
        feed: {
          userId: session.user.id as string,
        },
      };

      // 特定のフィードの記事のみ取得
      if (feedId) {
        console.log(`Filtering articles by feedId: ${feedId}`);
        where.feedId = feedId;
      }
      
      console.log('WHERE clause:', JSON.stringify(where));


      // 検索クエリがある場合
      if (search) {
        where.OR = [
          { title: { contains: search, mode: 'insensitive' } },
          { description: { contains: search, mode: 'insensitive' } },
        ];
      }

      // 記事の総数を取得
      const totalCount = await prisma.article.count({ where });

      // 記事を取得
      const articles = await prisma.article.findMany({
        where,
        include: {
          feed: {
            select: {
              id: true,
              title: true,
              url: true,
            },
          },
        },
        orderBy: [
          { publishedAt: 'desc' },
          { createdAt: 'desc' },
        ],
        skip,
        take: limit,
      });

      console.log(`Found ${articles.length} articles, total count: ${totalCount}`);
      
      // 結果を返す
      return res.status(200).json({
        articles,
        pagination: {
          total: totalCount,
          page,
          limit,
          pages: Math.ceil(totalCount / limit),
        },
      });
    } catch (error) {
      console.error('Error fetching articles:', error);
      return res.status(500).json({ message: 'Failed to fetch articles' });
    }
  }

  return res.status(405).json({ message: 'Method not allowed' });
}