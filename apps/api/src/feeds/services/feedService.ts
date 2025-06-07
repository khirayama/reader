import { prisma } from '../../lib/prisma';
import type { CreateFeedRequest, UpdateFeedRequest, GetFeedsQuery } from '../validators/feedSchemas';
import type { Feed, Article } from '@prisma/client';
import { RSSService } from './rssService';

export class FeedService {
  // フィード作成
  static async createFeed(userId: string, data: CreateFeedRequest): Promise<Feed> {
    // 既に同じURLのフィードが登録されているかチェック
    const existingFeed = await prisma.feed.findUnique({
      where: {
        userId_url: {
          userId,
          url: data.url,
        },
      },
    });

    if (existingFeed) {
      throw new Error('このフィードは既に登録されています');
    }

    // RSS フィードを解析
    const parsedFeed = await RSSService.parseFeed(data.url);
    
    // favicon を取得
    const favicon = await RSSService.getFaviconUrl(parsedFeed.siteUrl);

    // フィードをデータベースに保存
    const feed = await prisma.feed.create({
      data: {
        url: data.url,
        title: data.title || parsedFeed.title,
        description: parsedFeed.description,
        siteUrl: parsedFeed.siteUrl,
        favicon,
        userId,
        lastFetchedAt: new Date(),
      },
    });

    // 記事をデータベースに保存
    if (parsedFeed.items.length > 0) {
      // 既存の記事URLを取得して重複チェック
      const existingArticles = await prisma.article.findMany({
        where: { feedId: feed.id },
        select: { url: true },
      });
      
      const existingUrls = new Set(existingArticles.map((article: { url: string }) => article.url));
      
      // 新規記事のみをフィルタリング
      const newArticles = parsedFeed.items
        .filter(item => !existingUrls.has(item.url))
        .map((item) => ({
          title: item.title,
          url: item.url,
          description: item.description,
          publishedAt: item.publishedAt,
          feedId: feed.id,
        }));
      
      // 新規記事が存在する場合のみ保存
      if (newArticles.length > 0) {
        await prisma.article.createMany({
          data: newArticles,
        });
      }
    }

    return feed;
  }

  // ユーザーのフィード一覧取得
  static async getUserFeeds(userId: string, query: GetFeedsQuery) {
    const { page, limit, search } = query;
    const skip = (page - 1) * limit;

    const where = {
      userId,
      ...(search && {
        OR: [
          { title: { contains: search, mode: 'insensitive' as const } },
          { description: { contains: search, mode: 'insensitive' as const } },
        ],
      }),
    };

    const [feeds, total] = await Promise.all([
      prisma.feed.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          _count: {
            select: { articles: true },
          },
        },
      }),
      prisma.feed.count({ where }),
    ]);

    return {
      feeds,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
        hasNext: skip + limit < total,
        hasPrev: page > 1,
      },
    };
  }

  // フィード詳細取得
  static async getFeedById(feedId: string, userId: string): Promise<Feed | null> {
    const feed = await prisma.feed.findFirst({
      where: {
        id: feedId,
        userId,
      },
      include: {
        _count: {
          select: { articles: true },
        },
      },
    });

    return feed;
  }

  // フィード更新
  static async updateFeed(
    feedId: string,
    userId: string,
    data: UpdateFeedRequest
  ): Promise<Feed> {
    // フィードの存在確認と所有者チェック
    const existingFeed = await prisma.feed.findFirst({
      where: {
        id: feedId,
        userId,
      },
    });

    if (!existingFeed) {
      throw new Error('フィードが見つかりません');
    }

    const updatedFeed = await prisma.feed.update({
      where: { id: feedId },
      data: {
        ...data,
        updatedAt: new Date(),
      },
    });

    return updatedFeed;
  }

  // フィード削除
  static async deleteFeed(feedId: string, userId: string): Promise<void> {
    // フィードの存在確認と所有者チェック
    const existingFeed = await prisma.feed.findFirst({
      where: {
        id: feedId,
        userId,
      },
    });

    if (!existingFeed) {
      throw new Error('フィードが見つかりません');
    }

    // カスケード削除で関連する記事も削除される
    await prisma.feed.delete({
      where: { id: feedId },
    });
  }

  // フィードを更新
  static async refreshFeed(feedId: string, userId: string): Promise<Feed> {
    console.log(`[FeedService] フィード更新開始: feedId=${feedId}, userId=${userId}`);
    
    try {
      // フィードの存在確認と所有者チェック
      const feed = await prisma.feed.findFirst({
        where: {
          id: feedId,
          userId,
        },
      });

      if (!feed) {
        console.warn(`[FeedService] フィードが見つかりません: feedId=${feedId}`);
        throw new Error('フィードが見つかりません');
      }

      console.log(`[FeedService] フィード情報: ${feed.title} (${feed.url})`);

      // RSS フィードを再解析
      const parsedFeed = await RSSService.parseFeed(feed.url);
      console.log(`[FeedService] フィード解析完了: ${parsedFeed.items.length}件の記事`);
      
      // トランザクションでフィード更新と記事追加を原子的に実行
      const result = await prisma.$transaction(async (tx: any) => {
        // フィード情報を更新
        const updatedFeed = await tx.feed.update({
          where: { id: feedId },
          data: {
            title: parsedFeed.title,
            description: parsedFeed.description,
            siteUrl: parsedFeed.siteUrl,
            lastFetchedAt: new Date(),
          },
        });

        // 新しい記事を追加
        if (parsedFeed.items.length > 0) {
          // 既存の記事URLを取得して重複チェック
          const existingArticles = await tx.article.findMany({
            where: { feedId: feed.id },
            select: { url: true },
          });
          
          const existingUrls = new Set(existingArticles.map((article: { url: string }) => article.url));
          
          // 新規記事のみをフィルタリング
          const newArticles = parsedFeed.items
            .filter(item => !existingUrls.has(item.url))
            .map((item) => ({
              title: item.title?.substring(0, 500) || 'タイトルなし', // タイトルの長さ制限
              url: item.url,
              description: item.description?.substring(0, 2000) || null, // 説明の長さ制限
              publishedAt: item.publishedAt,
              feedId: feed.id,
            }));
          
          console.log(`[FeedService] ${newArticles.length}件の新規記事をデータベースに追加中...`);
          
          if (newArticles.length > 0) {
            await tx.article.createMany({
              data: newArticles,
            });
          }
          
          console.log(`[FeedService] 記事の追加完了`);
        }

        return updatedFeed;
      });

      console.log(`[FeedService] フィード更新成功: ${result.title}`);
      return result;
      
    } catch (error) {
      console.error(`[FeedService] フィード更新エラー: feedId=${feedId}`, error);
      
      // エラーの再スロー（メッセージをそのまま伝播）
      throw error;
    }
  }

  // 全フィードを更新
  static async refreshAllUserFeeds(userId: string): Promise<void> {
    console.log(`[FeedService] 全フィード更新開始: userId=${userId}`);
    
    try {
      const feeds = await prisma.feed.findMany({
        where: { userId },
        select: { id: true, title: true, url: true },
      });

      console.log(`[FeedService] ${feeds.length}件のフィードを更新中...`);

      const results = {
        success: 0,
        failed: 0,
        errors: [] as string[],
      };

      for (const feed of feeds) {
        try {
          console.log(`[FeedService] フィード更新中: ${feed.title} (${feed.id})`);
          await this.refreshFeed(feed.id, userId);
          results.success++;
        } catch (error) {
          results.failed++;
          const errorMessage = error instanceof Error ? error.message : '不明なエラー';
          results.errors.push(`${feed.title}: ${errorMessage}`);
          console.error(`[FeedService] フィード更新失敗 ${feed.id} (${feed.title}):`, error);
        }
      }

      console.log(`[FeedService] 全フィード更新完了: 成功=${results.success}, 失敗=${results.failed}`);
      
      if (results.errors.length > 0) {
        console.warn(`[FeedService] 更新エラーの詳細:`, results.errors);
      }
    } catch (error) {
      console.error(`[FeedService] 全フィード更新で予期しないエラー:`, error);
      throw error;
    }
  }

  // フィードの記事取得
  static async getFeedArticles(
    feedId: string,
    userId: string,
    page: number = 1,
    limit: number = 20
  ) {
    // フィードの存在確認と所有者チェック
    const feed = await prisma.feed.findFirst({
      where: {
        id: feedId,
        userId,
      },
    });

    if (!feed) {
      throw new Error('フィードが見つかりません');
    }

    const skip = (page - 1) * limit;

    const [articles, total] = await Promise.all([
      prisma.article.findMany({
        where: { feedId },
        skip,
        take: limit,
        orderBy: { publishedAt: 'desc' },
      }),
      prisma.article.count({ where: { feedId } }),
    ]);

    return {
      articles,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
        hasNext: skip + limit < total,
        hasPrev: page > 1,
      },
    };
  }

  // 全ての記事を取得（ユーザーの全フィードから）
  static async getAllUserArticles(
    userId: string,
    page: number = 1,
    limit: number = 20,
    search?: string
  ) {
    const skip = (page - 1) * limit;

    const where = {
      feed: { userId },
      ...(search && {
        OR: [
          { title: { contains: search, mode: 'insensitive' as const } },
          { description: { contains: search, mode: 'insensitive' as const } },
        ],
      }),
    };

    const [articles, total] = await Promise.all([
      prisma.article.findMany({
        where,
        skip,
        take: limit,
        orderBy: { publishedAt: 'desc' },
        include: {
          feed: {
            select: {
              id: true,
              title: true,
              favicon: true,
            },
          },
        },
      }),
      prisma.article.count({ where }),
    ]);

    return {
      articles,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
        hasNext: skip + limit < total,
        hasPrev: page > 1,
      },
    };
  }

}
export const feedService = FeedService;
