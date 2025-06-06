import { prisma } from '../../lib/prisma';
import type { CreateFeedRequest, UpdateFeedRequest, GetFeedsQuery } from '../validators/feedSchemas';
import type { Feed, Article } from '@prisma/client';

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

    // 新しいフィードを作成（初期状態）
    const feed = await prisma.feed.create({
      data: {
        url: data.url,
        title: data.url, // 初期値としてURLを設定、後でRSSパース時に更新
        userId,
      },
    });

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