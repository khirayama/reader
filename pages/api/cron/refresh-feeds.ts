import { NextApiRequest, NextApiResponse } from 'next';
import { prisma } from '../../../lib/prisma';
import { fetchRssFeed } from '../../../lib/rss';

// Vercel Cronジョブのための認証シークレット
const CRON_SECRET = process.env.CRON_SECRET;

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  // 本番環境での認証チェック
  if (process.env.NODE_ENV === 'production') {
    const authHeader = req.headers.authorization;
    
    if (authHeader !== `Bearer ${CRON_SECRET}`) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
  }

  try {
    // 全フィードを取得
    const feeds = await prisma.feed.findMany();
    let updatedCount = 0;
    const startTime = Date.now();

    console.log(`Starting to refresh ${feeds.length} feeds`);

    // 各フィードを更新
    for (const feed of feeds) {
      try {
        const rssFeed = await fetchRssFeed(feed.url);
        let feedUpdatedCount = 0;
        
        // フィードのメタデータ更新（タイトルや説明が変わっている可能性があるため）
        await prisma.feed.update({
          where: { id: feed.id },
          data: {
            title: rssFeed.title || feed.title,
            description: rssFeed.description || feed.description,
          }
        });
        
        // 新しい記事を追加
        for (const item of rssFeed.items) {
          // 記事が既に存在するか確認
          const existingArticle = await prisma.article.findUnique({
            where: { url: item.url }
          });

          if (!existingArticle) {
            await prisma.article.create({
              data: {
                title: item.title,
                url: item.url,
                description: item.description || null,
                content: item.content || null,
                publishedAt: item.publishedAt,
                feedId: feed.id
              }
            });
            feedUpdatedCount++;
            updatedCount++;
          }
        }
        
        console.log(`Updated feed: ${feed.title} (${feed.url}) - Added ${feedUpdatedCount} new articles`);
      } catch (error) {
        console.error(`Error updating feed ${feed.url}:`, error);
      }
    }

    const duration = (Date.now() - startTime) / 1000;
    console.log(`Finished refreshing feeds. Added ${updatedCount} new articles in ${duration.toFixed(2)} seconds`);

    return res.status(200).json({ 
      success: true, 
      message: `Updated ${updatedCount} articles across ${feeds.length} feeds`,
      duration: `${duration.toFixed(2)} seconds` 
    });
  } catch (error) {
    console.error('Error refreshing feeds:', error);
    return res.status(500).json({ error: 'Failed to refresh feeds' });
  }
}