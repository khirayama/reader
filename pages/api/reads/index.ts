import type { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth';
import { z } from 'zod';
import { authOptions } from '../auth/[...nextauth]';
import { prisma } from '../../../lib/prisma';

// バリデーションスキーマ
const readSchema = z.object({
  articleId: z.string(),
});

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const session = await getServerSession(req, res, authOptions);

  if (!session) {
    return res.status(401).json({ message: 'Unauthorized' });
  }

  // 既読記事の登録
  if (req.method === 'POST') {
    try {
      // リクエストボディのバリデーション
      const validationResult = readSchema.safeParse(req.body);
      if (!validationResult.success) {
        return res.status(400).json({ 
          message: 'Invalid input', 
          errors: validationResult.error.errors 
        });
      }

      const { articleId } = validationResult.data;

      // 記事の存在確認とアクセス権限チェック
      const article = await prisma.article.findFirst({
        where: {
          id: articleId,
          feed: {
            userId: session.user.id as string,
          },
        },
      });

      if (!article) {
        return res.status(404).json({ message: 'Article not found' });
      }

      // 既存の既読情報を確認
      const existingRead = await prisma.read.findUnique({
        where: {
          userId_articleId: {
            userId: session.user.id as string,
            articleId,
          },
        },
      });

      // 既に既読の場合はそのまま返す
      if (existingRead) {
        return res.status(200).json(existingRead);
      }

      // 既読情報を作成
      const read = await prisma.read.create({
        data: {
          userId: session.user.id as string,
          articleId,
        },
      });

      return res.status(201).json(read);
    } catch (error) {
      console.error('Error marking article as read:', error);
      return res.status(500).json({ message: 'Failed to mark article as read' });
    }
  }

  // 既読記事の削除（未読に戻す）
  if (req.method === 'DELETE') {
    try {
      const articleId = req.query.articleId as string;
      
      if (!articleId) {
        return res.status(400).json({ message: 'Article ID is required' });
      }

      // 記事の存在確認とアクセス権限チェック
      const article = await prisma.article.findFirst({
        where: {
          id: articleId,
          feed: {
            userId: session.user.id as string,
          },
        },
      });

      if (!article) {
        return res.status(404).json({ message: 'Article not found' });
      }

      // 既読情報を削除
      await prisma.read.delete({
        where: {
          userId_articleId: {
            userId: session.user.id as string,
            articleId,
          },
        },
      });

      return res.status(200).json({ message: 'Article marked as unread' });
    } catch (error) {
      console.error('Error marking article as unread:', error);
      return res.status(500).json({ message: 'Failed to mark article as unread' });
    }
  }

  // その他のHTTPメソッドには405を返す
  return res.status(405).json({ message: 'Method not allowed' });
}