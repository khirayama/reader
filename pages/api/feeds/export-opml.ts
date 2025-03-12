import { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../auth/[...nextauth]';
import { generateOPML } from '../../../lib/opml';
import { prisma } from '../../../lib/prisma';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  // GETリクエストのみを受け付ける
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // セッションを取得し、認証を確認
    const session = await getServerSession(req, res, authOptions);
    
    if (!session || !session.user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const userId = session.user.id;
    
    // ユーザーのフィードを取得
    const feeds = await prisma.feed.findMany({
      where: {
        userId
      }
    });
    
    // OPMLを生成
    const opmlContent = generateOPML(feeds, `${session.user.email}'s RSS Feeds`);
    
    // Content-Dispositionヘッダーを設定してダウンロードを促す
    res.setHeader('Content-Type', 'text/xml');
    res.setHeader('Content-Disposition', 'attachment; filename="feeds.opml"');
    
    // OPMLコンテンツを返す
    return res.status(200).send(opmlContent);
  } catch (error) {
    console.error('Error exporting OPML:', error);
    return res.status(500).json({ error: 'Failed to export OPML' });
  }
}