import type { Request, Response } from 'express'
import type { AuthenticatedRequest } from '../../types/express'
import { FeedService } from '../services/feedService'
import { createFeedSchema, getFeedsQuerySchema, updateFeedSchema } from '../validators/feedSchemas'

export class FeedController {
  // フィード作成
  static async createFeed(req: AuthenticatedRequest, res: Response) {
    try {
      const userId = req.user?.id
      if (!userId) {
        return res.status(401).json({ error: '認証が必要です' })
      }

      // バリデーション
      const validatedData = createFeedSchema.parse(req.body)

      const feed = await FeedService.createFeed(userId, validatedData)

      return res.status(201).json({
        message: 'フィードが作成されました',
        feed,
      })
    } catch (error: any) {
      console.error('Feed creation error:', error)

      if (error.name === 'ZodError') {
        return res.status(400).json({
          error: 'バリデーションエラー',
          details: error.errors,
        })
      }

      if (error.message === 'このフィードは既に登録されています') {
        return res.status(409).json({
          error: error.message,
        })
      }

      return res.status(500).json({
        error: 'フィードの作成中にエラーが発生しました',
        details: error.message,
      })
    }
  }

  // フィード一覧取得
  static async getFeeds(req: AuthenticatedRequest, res: Response) {
    try {
      const userId = req.user?.id
      if (!userId) {
        return res.status(401).json({ error: '認証が必要です' })
      }

      // クエリパラメータのバリデーション
      const query = getFeedsQuerySchema.parse(req.query)

      const result = await FeedService.getUserFeeds(userId, query)

      return res.json({
        success: true,
        data: result,
      })
    } catch (error: any) {
      console.error('Get feeds error:', error)

      if (error.name === 'ZodError') {
        return res.status(400).json({
          error: 'バリデーションエラー',
          details: error.errors,
        })
      }

      return res.status(500).json({
        error: 'フィード一覧の取得中にエラーが発生しました',
      })
    }
  }

  // フィード詳細取得
  static async getFeedById(req: AuthenticatedRequest, res: Response) {
    try {
      const userId = req.user?.id
      if (!userId) {
        return res.status(401).json({ error: '認証が必要です' })
      }

      const { feedId } = req.params

      const feed = await FeedService.getFeedById(feedId, userId)

      if (!feed) {
        return res.status(404).json({
          error: 'フィードが見つかりません',
        })
      }

      return res.json({
        success: true,
        data: feed,
      })
    } catch (error: any) {
      console.error('Get feed by ID error:', error)

      return res.status(500).json({
        error: 'フィード詳細の取得中にエラーが発生しました',
      })
    }
  }

  // フィード更新
  static async updateFeed(req: AuthenticatedRequest, res: Response) {
    try {
      const userId = req.user?.id
      if (!userId) {
        return res.status(401).json({ error: '認証が必要です' })
      }

      const { feedId } = req.params

      // バリデーション
      const validatedData = updateFeedSchema.parse(req.body)

      const updatedFeed = await FeedService.updateFeed(feedId, userId, validatedData)

      return res.json({
        message: 'フィードが更新されました',
        feed: updatedFeed,
      })
    } catch (error: any) {
      console.error('Update feed error:', error)

      if (error.name === 'ZodError') {
        return res.status(400).json({
          error: 'バリデーションエラー',
          details: error.errors,
        })
      }

      if (error.message === 'フィードが見つかりません') {
        return res.status(404).json({
          error: error.message,
        })
      }

      return res.status(500).json({
        error: 'フィードの更新中にエラーが発生しました',
      })
    }
  }

  // フィード削除
  static async deleteFeed(req: AuthenticatedRequest, res: Response) {
    try {
      const userId = req.user?.id
      if (!userId) {
        return res.status(401).json({ error: '認証が必要です' })
      }

      const { feedId } = req.params

      await FeedService.deleteFeed(feedId, userId)

      return res.json({
        message: 'フィードが削除されました',
      })
    } catch (error: any) {
      console.error('Delete feed error:', error)

      if (error.message === 'フィードが見つかりません') {
        return res.status(404).json({
          error: error.message,
        })
      }

      return res.status(500).json({
        error: 'フィードの削除中にエラーが発生しました',
      })
    }
  }

  // フィードの記事取得
  static async getFeedArticles(req: AuthenticatedRequest, res: Response) {
    try {
      const userId = req.user?.id
      if (!userId) {
        return res.status(401).json({ error: '認証が必要です' })
      }

      const { feedId } = req.params
      const page = Number.parseInt(req.query.page as string) || 1
      const limit = Number.parseInt(req.query.limit as string) || 20

      const result = await FeedService.getFeedArticles(feedId, userId, page, limit)

      return res.json({
        success: true,
        data: result,
      })
    } catch (error: any) {
      console.error('Get feed articles error:', error)

      if (error.message === 'フィードが見つかりません') {
        return res.status(404).json({
          error: error.message,
        })
      }

      return res.status(500).json({
        error: 'フィード記事の取得中にエラーが発生しました',
      })
    }
  }

  // フィード手動更新
  static async refreshFeed(req: AuthenticatedRequest, res: Response) {
    try {
      const userId = req.user?.id
      if (!userId) {
        console.warn('[FeedController] 認証エラー: userIdが不明')
        return res.status(401).json({ error: '認証が必要です' })
      }

      const { feedId } = req.params
      console.log(`[FeedController] フィード更新リクエスト: feedId=${feedId}, userId=${userId}`)

      const updatedFeed = await FeedService.refreshFeed(feedId, userId)

      console.log(`[FeedController] フィード更新成功: ${updatedFeed.title}`)
      return res.json({
        success: true,
        message: 'フィードを更新しました',
        feed: updatedFeed,
      })
    } catch (error: any) {
      console.error('[FeedController] フィード更新エラー:', error)

      // フィードが見つからないエラー
      if (error.message === 'フィードが見つかりません') {
        return res.status(404).json({
          success: false,
          error: error.message,
        })
      }

      // RSS関連のエラーを特定して適切なステータスコードを返す
      if (
        error.message?.includes('タイムアウト') ||
        error.message?.includes('アクセスできません') ||
        error.message?.includes('有効なRSS/Atomフィードではありません')
      ) {
        return res.status(400).json({
          success: false,
          error: `フィードの取得に失敗しました: ${error.message}`,
        })
      }

      // データベースエラー
      if (error.message?.includes('Prisma') || error.message?.includes('database')) {
        console.error('[FeedController] データベースエラー:', error)
        return res.status(503).json({
          success: false,
          error: 'データベースエラーが発生しました。しばらくしてから再度お試しください。',
        })
      }

      // その他のエラー
      return res.status(500).json({
        success: false,
        error: 'フィードの更新中に予期しないエラーが発生しました',
        details: error.message,
      })
    }
  }

  // 全フィード更新
  static async refreshAllFeeds(req: AuthenticatedRequest, res: Response) {
    try {
      const userId = req.user?.id
      if (!userId) {
        console.warn('[FeedController] 全フィード更新で認証エラー: userIdが不明')
        return res.status(401).json({ error: '認証が必要です' })
      }

      console.log(`[FeedController] 全フィード更新リクエスト: userId=${userId}`)
      await FeedService.refreshAllUserFeeds(userId)

      console.log(`[FeedController] 全フィード更新完了: userId=${userId}`)
      return res.json({
        success: true,
        message: 'フィードの更新を完了しました',
      })
    } catch (error: any) {
      console.error('[FeedController] 全フィード更新エラー:', error)

      return res.status(500).json({
        success: false,
        error: '全フィードの更新中にエラーが発生しました',
        details: error.message,
      })
    }
  }
}
