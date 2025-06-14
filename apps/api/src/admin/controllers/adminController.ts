import type { Request, Response } from 'express'
import { FeedService } from '../../feeds/services/feedService'
import { prisma } from '../../lib/prisma'

export const refreshAllFeeds = async (req: Request, res: Response) => {
  try {
    // 全てのアクティブなフィードを取得
    const feeds = await prisma.feed.findMany({
      where: {
        user: {
          deletedAt: null, // アクティブなユーザーのみ
        },
      },
      select: {
        id: true,
        url: true,
        userId: true,
      },
    })

    const totalFeeds = feeds.length
    let successCount = 0
    let errorCount = 0
    const errors: { feedId: string; url: string; error: string }[] = []

    // バッチ処理でフィードを更新
    const batchSize = 10
    for (let i = 0; i < feeds.length; i += batchSize) {
      const batch = feeds.slice(i, i + batchSize)

      await Promise.all(
        batch.map(async (feed: { id: string; url: string; userId: string }) => {
          try {
            await FeedService.refreshFeed(feed.id, feed.userId)
            successCount++
          } catch (error) {
            errorCount++
            errors.push({
              feedId: feed.id,
              url: feed.url,
              error: error instanceof Error ? error.message : 'Unknown error',
            })
          }
        })
      )

      // レート制限を考慮して少し待機
      if (i + batchSize < feeds.length) {
        await new Promise((resolve) => setTimeout(resolve, 1000))
      }
    }

    // 更新履歴を記録
    await prisma.cronLog.create({
      data: {
        jobName: 'refresh-all-feeds',
        status: errorCount === 0 ? 'success' : 'partial',
        totalFeeds,
        successCount,
        errorCount,
        errors: errors.length > 0 ? JSON.stringify(errors) : null,
        executedAt: new Date(),
      },
    })

    res.json({
      success: true,
      totalFeeds,
      successCount,
      errorCount,
      errors: errors.slice(0, 10), // 最初の10件のエラーのみ返す
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    console.error('Failed to refresh all feeds:', error)
    res.status(500).json({
      error: 'Failed to refresh feeds',
      details: error instanceof Error ? error.message : 'Unknown error',
    })
  }
}

export const getCronLogs = async (req: Request, res: Response) => {
  try {
    const { limit = 100, offset = 0 } = req.query

    const logs = await prisma.cronLog.findMany({
      take: Number(limit),
      skip: Number(offset),
      orderBy: {
        executedAt: 'desc',
      },
    })

    const total = await prisma.cronLog.count()

    res.json({
      logs,
      total,
      limit: Number(limit),
      offset: Number(offset),
    })
  } catch (error) {
    console.error('Failed to fetch cron logs:', error)
    res.status(500).json({
      error: 'Failed to fetch cron logs',
      details: error instanceof Error ? error.message : 'Unknown error',
    })
  }
}
