import { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../auth/[...nextauth]';
import { parseOPML } from '../../../lib/opml';
import { prisma } from '../../../lib/prisma';

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
    const addedFeeds = [];
    const existingFeeds = [];
    
    for (const feed of feeds) {
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
          continue;
        }
        
        // 新しいフィードを追加
        const newFeed = await prisma.feed.create({
          data: {
            title: feed.title,
            url: feed.xmlUrl,
            description: feed.description || null,
            userId
          }
        });
        
        addedFeeds.push(newFeed.title);
      } catch (error) {
        console.error(`Error adding feed ${feed.title}:`, error);
      }
    }

    return res.status(200).json({ 
      success: true, 
      message: `Added ${addedFeeds.length} feeds, ${existingFeeds.length} already existed`,
      addedFeeds,
      existingFeeds
    });
  } catch (error) {
    console.error('Error importing OPML:', error);
    return res.status(500).json({ error: 'Failed to import OPML' });
  }
}