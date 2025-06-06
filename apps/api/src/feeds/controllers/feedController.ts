import type { Request, Response } from 'express';
import { FeedService } from '../services/feedService';
import { createFeedSchema, updateFeedSchema, getFeedsQuerySchema } from '../validators/feedSchemas';
import type { AuthenticatedRequest } from '../../types/express';

export class FeedController {
  // フィード作成
  static async createFeed(req: AuthenticatedRequest, res: Response) {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({ error: '認証が必要です' });
      }

      // バリデーション
      const validatedData = createFeedSchema.parse(req.body);

      const feed = await FeedService.createFeed(userId, validatedData);

      res.status(201).json({
        message: 'フィードが作成されました',
        feed,
      });
    } catch (error: any) {
      console.error('Feed creation error:', error);

      if (error.name === 'ZodError') {
        return res.status(400).json({
          error: 'バリデーションエラー',
          details: error.errors,
        });
      }

      if (error.message === 'このフィードは既に登録されています') {
        return res.status(409).json({
          error: error.message,
        });
      }

      res.status(500).json({
        error: 'フィードの作成中にエラーが発生しました',
      });
    }
  }

  // フィード一覧取得
  static async getFeeds(req: AuthenticatedRequest, res: Response) {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({ error: '認証が必要です' });
      }

      // クエリパラメータのバリデーション
      const query = getFeedsQuerySchema.parse(req.query);

      const result = await FeedService.getUserFeeds(userId, query);

      res.json(result);
    } catch (error: any) {
      console.error('Get feeds error:', error);

      if (error.name === 'ZodError') {
        return res.status(400).json({
          error: 'バリデーションエラー',
          details: error.errors,
        });
      }

      res.status(500).json({
        error: 'フィード一覧の取得中にエラーが発生しました',
      });
    }
  }

  // フィード詳細取得
  static async getFeedById(req: AuthenticatedRequest, res: Response) {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({ error: '認証が必要です' });
      }

      const { feedId } = req.params;

      const feed = await FeedService.getFeedById(feedId, userId);

      if (!feed) {
        return res.status(404).json({
          error: 'フィードが見つかりません',
        });
      }

      res.json(feed);
    } catch (error: any) {
      console.error('Get feed by ID error:', error);

      res.status(500).json({
        error: 'フィード詳細の取得中にエラーが発生しました',
      });
    }
  }

  // フィード更新
  static async updateFeed(req: AuthenticatedRequest, res: Response) {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({ error: '認証が必要です' });
      }

      const { feedId } = req.params;

      // バリデーション
      const validatedData = updateFeedSchema.parse(req.body);

      const updatedFeed = await FeedService.updateFeed(feedId, userId, validatedData);

      res.json({
        message: 'フィードが更新されました',
        feed: updatedFeed,
      });
    } catch (error: any) {
      console.error('Update feed error:', error);

      if (error.name === 'ZodError') {
        return res.status(400).json({
          error: 'バリデーションエラー',
          details: error.errors,
        });
      }

      if (error.message === 'フィードが見つかりません') {
        return res.status(404).json({
          error: error.message,
        });
      }

      res.status(500).json({
        error: 'フィードの更新中にエラーが発生しました',
      });
    }
  }

  // フィード削除
  static async deleteFeed(req: AuthenticatedRequest, res: Response) {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({ error: '認証が必要です' });
      }

      const { feedId } = req.params;

      await FeedService.deleteFeed(feedId, userId);

      res.json({
        message: 'フィードが削除されました',
      });
    } catch (error: any) {
      console.error('Delete feed error:', error);

      if (error.message === 'フィードが見つかりません') {
        return res.status(404).json({
          error: error.message,
        });
      }

      res.status(500).json({
        error: 'フィードの削除中にエラーが発生しました',
      });
    }
  }

  // フィードの記事取得
  static async getFeedArticles(req: AuthenticatedRequest, res: Response) {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({ error: '認証が必要です' });
      }

      const { feedId } = req.params;
      const page = Number.parseInt(req.query.page as string) || 1;
      const limit = Number.parseInt(req.query.limit as string) || 20;

      const result = await FeedService.getFeedArticles(feedId, userId, page, limit);

      res.json(result);
    } catch (error: any) {
      console.error('Get feed articles error:', error);

      if (error.message === 'フィードが見つかりません') {
        return res.status(404).json({
          error: error.message,
        });
      }

      res.status(500).json({
        error: 'フィード記事の取得中にエラーが発生しました',
      });
    }
  }

  // 全記事取得（ユーザーの全フィードから）
  static async getAllArticles(req: AuthenticatedRequest, res: Response) {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({ error: '認証が必要です' });
      }

      const page = Number.parseInt(req.query.page as string) || 1;
      const limit = Number.parseInt(req.query.limit as string) || 20;
      const search = req.query.search as string;

      const result = await FeedService.getAllUserArticles(userId, page, limit, search);

      res.json(result);
    } catch (error: any) {
      console.error('Get all articles error:', error);

      res.status(500).json({
        error: '記事一覧の取得中にエラーが発生しました',
      });
    }
  }

  // フィード手動更新
  static async refreshFeed(req: AuthenticatedRequest, res: Response) {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({ error: '認証が必要です' });
      }

      const { feedId } = req.params;

      const updatedFeed = await FeedService.refreshFeed(feedId, userId);

      res.json({
        success: true,
        message: 'フィードを更新しました',
        feed: updatedFeed,
      });
    } catch (error: any) {
      console.error('Refresh feed error:', error);

      if (error.message === 'フィードが見つかりません') {
        return res.status(404).json({
          success: false,
          error: error.message,
        });
      }

      res.status(500).json({
        success: false,
        error: 'フィードの更新中にエラーが発生しました',
      });
    }
  }

  // 全フィード更新
  static async refreshAllFeeds(req: AuthenticatedRequest, res: Response) {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({ error: '認証が必要です' });
      }

      const result = await FeedService.refreshAllUserFeeds(userId);

      res.json({
        success: true,
        message: `${result.success}個のフィードを更新しました`,
        result,
      });
    } catch (error: any) {
      console.error('Refresh all feeds error:', error);

      res.status(500).json({
        success: false,
        error: '全フィードの更新中にエラーが発生しました',
      });
    }
  }
}