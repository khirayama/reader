import type { Article, ArticleBookmark, ArticleReadStatus } from '@prisma/client'
import { prisma } from '../../lib/prisma'

export class ArticleService {
  // 記事詳細取得
  static async getArticleById(articleId: string, userId: string) {
    const article = await prisma.article.findUnique({
      where: { id: articleId },
      include: {
        feed: {
          select: {
            id: true,
            title: true,
            favicon: true,
            userId: true,
          },
        },
        readStatus: {
          where: { userId },
          select: { isRead: true, readAt: true },
        },
        bookmarks: {
          where: { userId },
          select: { id: true },
        },
      },
    })

    if (!article) {
      throw new Error('記事が見つかりません')
    }

    // ユーザーがフィードの所有者でない場合はアクセス拒否
    if (article.feed.userId !== userId) {
      throw new Error('この記事にアクセスする権限がありません')
    }

    return {
      ...article,
      isRead: article.readStatus.length > 0 ? article.readStatus[0].isRead : false,
      readAt: article.readStatus.length > 0 ? article.readStatus[0].readAt : null,
      isBookmarked: article.bookmarks.length > 0,
    }
  }

  // 記事を既読にする
  static async markAsRead(articleId: string, userId: string): Promise<void> {
    // 記事の存在確認とアクセス権限チェック
    const article = await prisma.article.findUnique({
      where: { id: articleId },
      include: {
        feed: {
          select: { userId: true },
        },
      },
    })

    if (!article) {
      throw new Error('記事が見つかりません')
    }

    if (article.feed.userId !== userId) {
      throw new Error('この記事にアクセスする権限がありません')
    }

    // 既読状態を作成または更新
    await prisma.articleReadStatus.upsert({
      where: {
        userId_articleId: {
          userId,
          articleId,
        },
      },
      update: {
        isRead: true,
        readAt: new Date(),
      },
      create: {
        userId,
        articleId,
        isRead: true,
        readAt: new Date(),
      },
    })
  }

  // 記事を未読にする
  static async markAsUnread(articleId: string, userId: string): Promise<void> {
    // 記事の存在確認とアクセス権限チェック
    const article = await prisma.article.findUnique({
      where: { id: articleId },
      include: {
        feed: {
          select: { userId: true },
        },
      },
    })

    if (!article) {
      throw new Error('記事が見つかりません')
    }

    if (article.feed.userId !== userId) {
      throw new Error('この記事にアクセスする権限がありません')
    }

    // 既読状態を作成または更新
    await prisma.articleReadStatus.upsert({
      where: {
        userId_articleId: {
          userId,
          articleId,
        },
      },
      update: {
        isRead: false,
        readAt: null,
      },
      create: {
        userId,
        articleId,
        isRead: false,
      },
    })
  }

  // 記事をブックマークに追加
  static async addBookmark(articleId: string, userId: string): Promise<void> {
    // 記事の存在確認とアクセス権限チェック
    const article = await prisma.article.findUnique({
      where: { id: articleId },
      include: {
        feed: {
          select: { userId: true },
        },
      },
    })

    if (!article) {
      throw new Error('記事が見つかりません')
    }

    if (article.feed.userId !== userId) {
      throw new Error('この記事にアクセスする権限がありません')
    }

    // 既にブックマークされているかチェック
    const existingBookmark = await prisma.articleBookmark.findUnique({
      where: {
        userId_articleId: {
          userId,
          articleId,
        },
      },
    })

    if (existingBookmark) {
      throw new Error('この記事は既にブックマークされています')
    }

    // ブックマークを作成
    await prisma.articleBookmark.create({
      data: {
        userId,
        articleId,
      },
    })
  }

  // 記事のブックマークを削除
  static async removeBookmark(articleId: string, userId: string): Promise<void> {
    // 記事の存在確認とアクセス権限チェック
    const article = await prisma.article.findUnique({
      where: { id: articleId },
      include: {
        feed: {
          select: { userId: true },
        },
      },
    })

    if (!article) {
      throw new Error('記事が見つかりません')
    }

    if (article.feed.userId !== userId) {
      throw new Error('この記事にアクセスする権限がありません')
    }

    // ブックマークを削除
    const deleted = await prisma.articleBookmark.deleteMany({
      where: {
        userId,
        articleId,
      },
    })

    if (deleted.count === 0) {
      throw new Error('この記事はブックマークされていません')
    }
  }

  // ユーザーのブックマーク記事を取得
  static async getUserBookmarks(userId: string, page = 1, limit = 20) {
    const skip = (page - 1) * limit

    const [bookmarks, total] = await Promise.all([
      prisma.articleBookmark.findMany({
        where: { userId },
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          article: {
            include: {
              feed: {
                select: {
                  id: true,
                  title: true,
                  favicon: true,
                },
              },
              readStatus: {
                where: { userId },
                select: { isRead: true, readAt: true },
              },
            },
          },
        },
      }),
      prisma.articleBookmark.count({ where: { userId } }),
    ])

    const articles = bookmarks.map((bookmark) => ({
      ...bookmark.article,
      isRead:
        bookmark.article.readStatus.length > 0 ? bookmark.article.readStatus[0].isRead : false,
      readAt: bookmark.article.readStatus.length > 0 ? bookmark.article.readStatus[0].readAt : null,
      isBookmarked: true,
      bookmarkedAt: bookmark.createdAt,
    }))

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
    }
  }

  // ユーザーの全記事を取得（タグフィルタリング対応）
  static async getAllUserArticles(
    userId: string,
    page = 1,
    limit = 20,
    search?: string,
    tagId?: string,
    feedId?: string
  ) {
    const skip = (page - 1) * limit

    const where = {
      feed: { userId },
      ...(search && {
        OR: [{ title: { contains: search } }, { description: { contains: search } }],
      }),
      ...(feedId && {
        feedId,
      }),
      ...(tagId && {
        feed: {
          userId,
          feedTags: {
            some: {
              tagId,
            },
          },
        },
      }),
    }

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
              feedTags: {
                include: {
                  tag: true,
                },
              },
            },
          },
          readStatus: {
            where: { userId },
            select: { isRead: true, readAt: true },
          },
          bookmarks: {
            where: { userId },
            select: { id: true },
          },
        },
      }),
      prisma.article.count({ where }),
    ])

    const articlesWithStatus = articles.map((article) => ({
      ...article,
      feed: {
        ...article.feed,
        tags: article.feed.feedTags.map((ft) => ft.tag),
        feedTags: undefined,
      },
      isRead: article.readStatus.length > 0 ? article.readStatus[0].isRead : false,
      readAt: article.readStatus.length > 0 ? article.readStatus[0].readAt : null,
      isBookmarked: article.bookmarks.length > 0,
      readStatus: undefined,
      bookmarks: undefined,
    }))

    return {
      articles: articlesWithStatus,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
        hasNext: skip + limit < total,
        hasPrev: page > 1,
      },
    }
  }
}
