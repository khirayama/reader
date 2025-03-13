import { NextApiRequest, NextApiResponse } from 'next';
import { prisma } from '../../../lib/prisma';
import { fetchRssFeed } from '../../../lib/rss';
import { Feed, Prisma } from '@prisma/client';
import { Session } from 'next-auth';

// Vercel Cronジョブのための認証シークレット
const CRON_SECRET = process.env.CRON_SECRET;
// バッチサイズとリクエストの並列処理数
const BATCH_SIZE = 10;
const CONCURRENT_REQUESTS = 5;
// フィード取得のタイムアウト (ミリ秒)
const FEED_FETCH_TIMEOUT = 10000; // 10秒

// フィードを処理する関数の型定義
type ProcessFeedFunction = (feed: Feed) => Promise<number>;
type ProcessFeedsFunction = (feedsToProcess: Feed[]) => Promise<number[]>;

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

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  // 認証チェック
  // 1. 本番環境での CRON_SECRET の確認（バッチジョブ用）
  // 2. ユーザーセッションの確認（ブラウザリクエスト用）
  let userId: string | null = null;
  
  // Cronジョブのための認証
  if (process.env.NODE_ENV === 'production' && !req.query.userId) {
    const authHeader = req.headers.authorization;
    
    if (authHeader !== `Bearer ${CRON_SECRET}`) {
      return res.status(401).json({ error: 'Unauthorized cron access' });
    }
  } 
  // ユーザーリクエストのための認証
  else if (req.query.userId) {
    try {
      // NextAuth セッションを確認
      const authModule = await import('next-auth/next');
      const authOptions = require('../auth/[...nextauth]').authOptions;
      const session = await authModule.getServerSession(req, res, authOptions) as Session | null;
      
      if (!session || !session.user || !session.user.id) {
        return res.status(401).json({ error: 'Unauthorized user access' });
      }
      
      const sessionUserId = session.user.id;
      
      // 'current' は現在ログイン中のユーザーを表す特別な値
      if (req.query.userId === 'current') {
        userId = sessionUserId;
      } else if (req.query.userId === sessionUserId) {
        userId = sessionUserId;
      } else {
        return res.status(403).json({ error: 'Access forbidden to this user\'s feeds' });
      }
    } catch (error) {
      console.error('Session verification error:', error);
      return res.status(401).json({ error: 'Authentication failed' });
    }
  }

  try {
    // クエリパラメータからオプションを取得
    const batchIndex = Number(req.query.batchIndex) || 0;
    const batchSize = Number(req.query.batchSize) || BATCH_SIZE;
    const isPartialUpdate = req.query.partial === 'true';
    // フィードフェッチのタイムアウト設定（クエリパラメーターで上書き可能）
    const fetchTimeout = Number(req.query.timeout) || FEED_FETCH_TIMEOUT;

    // 検索条件を設定
    const whereClause: any = {};
    
    // 特定ユーザーのフィードのみ取得する場合
    if (userId) {
      whereClause.userId = userId;
    }
    
    // 特定のフィードIDが指定されている場合
    const specificFeedId = req.query.specificFeedId as string | undefined;
    if (specificFeedId) {
      console.log(`Looking for specific feed: ${specificFeedId}`);
      whereClause.id = specificFeedId;
    }
    
    // フィードの総数を取得
    const feedCount = await prisma.feed.count({
      where: whereClause
    });
    
    // バッチ処理のための範囲を計算
    const startTime = Date.now();
    let feeds: Feed[];
    
    if (specificFeedId) {
      // 特定のフィードだけを更新
      feeds = await prisma.feed.findMany({
        where: whereClause,
      });
      console.log(`Starting to refresh specific feed (ID: ${specificFeedId})${userId ? ` for user ${userId}` : ''}`);
    } else if (isPartialUpdate) {
      // 部分的な更新の場合、特定のバッチだけを取得
      feeds = await prisma.feed.findMany({
        where: whereClause,
        skip: batchIndex * batchSize,
        take: batchSize,
        orderBy: { updatedAt: 'asc' }, // 最も古く更新されたものから優先的に更新
      });
      
      console.log(`Starting to refresh batch ${batchIndex} (${feeds.length} feeds)${userId ? ` for user ${userId}` : ''}`);
    } else {
      // 全フィードの更新
      feeds = await prisma.feed.findMany({
        where: whereClause
      });
      console.log(`Starting to refresh all ${feeds.length} feeds${userId ? ` for user ${userId}` : ''}`);
    }

    let updatedCount = 0;
    let errorCount = 0;
    const totalBatches = Math.ceil(feedCount / batchSize);

    // フィードを並列処理するための関数
    const processFeed: ProcessFeedFunction = async (feed) => {
      try {
        // タイムアウト付きでRSSフィードを取得
        const rssFeed = await timeoutPromise(
          fetchTimeout, 
          fetchRssFeed(feed.url), 
          `Feed fetch timeout after ${fetchTimeout}ms: ${feed.url}`
        );
        
        let feedUpdatedCount = 0;
        
        // フィードのメタデータ更新（タイトルや説明が変わっている可能性があるため）
        await prisma.feed.update({
          where: { id: feed.id },
          data: {
            title: rssFeed.title || feed.title,
            description: rssFeed.description || feed.description,
            updatedAt: new Date(), // 更新日時を明示的に更新
          }
        });
        
        // 既存のURLを一括チェックするための配列を作成
        const urls = rssFeed.items.map(item => item.url).filter(Boolean);
        
        if (urls.length === 0) {
          console.log(`No valid URLs found in feed: ${feed.title} (${feed.url})`);
          return 0;
        }
        
        // 存在するURLを一括クエリ
        const existingArticles = await prisma.article.findMany({
          where: { url: { in: urls } },
          select: { url: true }
        });
        
        // 既存URLのセットを作成
        const existingUrls = new Set(existingArticles.map(article => article.url));
        
        // 新しい記事のみをフィルタリング
        const newItems = rssFeed.items.filter(item => item.url && !existingUrls.has(item.url));
        
        // 一括で新しい記事を作成
        if (newItems.length > 0) {
          await prisma.article.createMany({
            data: newItems.map(item => ({
              title: item.title,
              url: item.url,
              description: item.description || null,
              content: item.content || null,
              publishedAt: item.publishedAt,
              feedId: feed.id
            })),
            skipDuplicates: true,
          });
          
          feedUpdatedCount = newItems.length;
          updatedCount += feedUpdatedCount;
        }
        
        console.log(`Updated feed: ${feed.title} (${feed.url}) - Added ${feedUpdatedCount} new articles`);
        return feedUpdatedCount;
      } catch (error) {
        errorCount++;
        console.error(`Error updating feed ${feed.url}:`, error);
        // エラーがタイムアウトの場合、フィードを最終更新日時の更新だけ行う
        if ((error as Error).message?.includes('timeout')) {
          try {
            await prisma.feed.update({
              where: { id: feed.id },
              data: { updatedAt: new Date() }
            });
            console.log(`Updated timestamp for timed out feed: ${feed.url}`);
          } catch (updateError) {
            console.error(`Failed to update timestamp for feed ${feed.url}:`, updateError);
          }
        }
        return 0;
      }
    };

    // 並列処理で実行するためのバッチ処理
    const processFeeds: ProcessFeedsFunction = async (feedsToProcess) => {
      const results: number[] = [];
      
      // 指定した同時実行数で並列処理
      for (let i = 0; i < feedsToProcess.length; i += CONCURRENT_REQUESTS) {
        const batch = feedsToProcess.slice(i, i + CONCURRENT_REQUESTS);
        const batchPromises = batch.map(feed => processFeed(feed));
        
        // このバッチを並列処理 (allSettled を使用して1つの失敗が全体を停止させないようにする)
        const batchResults = await Promise.all(batchPromises);
        results.push(...batchResults);
      }
      
      return results;
    };

    // フィード処理を実行
    await processFeeds(feeds);

    const duration = (Date.now() - startTime) / 1000;
    console.log(`Finished refreshing feeds. Added ${updatedCount} new articles in ${duration.toFixed(2)} seconds. Failed feeds: ${errorCount}`);

    // 部分更新モードの場合、次のバッチのインデックスを計算
    const nextBatchIndex = isPartialUpdate ? (batchIndex + 1) % totalBatches : null;

    return res.status(200).json({
      success: true,
      message: `Updated ${updatedCount} articles across ${feeds.length} feeds (${errorCount} errors)${userId ? ` for user ${userId}` : ''}`,
      duration: `${duration.toFixed(2)} seconds`,
      batchInfo: isPartialUpdate ? {
        currentBatch: batchIndex,
        totalBatches,
        nextBatch: nextBatchIndex,
        progress: `${batchIndex + 1}/${totalBatches}`
      } : null,
      user: userId ? { id: userId } : null
    });
  } catch (error) {
    console.error('Error refreshing feeds:', error);
    return res.status(500).json({ error: 'Failed to refresh feeds' });
  }
}