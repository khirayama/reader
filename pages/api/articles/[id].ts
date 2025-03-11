import type { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth';
import { authOptions } from '../auth/[...nextauth]';
import { prisma } from '../../../lib/prisma';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const session = await getServerSession(req, res, authOptions);

  if (!session) {
    return res.status(401).json({ message: 'Unauthorized' });
  }

  const articleId = req.query.id as string;

  // 記事詳細の取得
  if (req.method === 'GET') {
    try {
      // 記事の存在確認とアクセス権限チェック
      const article = await prisma.article.findFirst({
        where: {
          id: articleId,
          feed: {
            userId: session.user.id as string,
          },
        },
        include: {
          feed: true,
          reads: {
            where: {
              userId: session.user.id as string,
            },
          },
        },
      });

      if (!article) {
        return res.status(404).json({ message: 'Article not found' });
      }

      return res.status(200).json(article);
    } catch (error) {
      console.error('Error fetching article:', error);
      return res.status(500).json({ message: 'Failed to fetch article' });
    }
  }

  // その他のHTTPメソッドには405を返す
  return res.status(405).json({ message: 'Method not allowed' });
}