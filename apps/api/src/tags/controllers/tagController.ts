import type { Request, Response } from 'express'
import { TagService } from '../services/tagService'
import {
  assignTagToFeedSchema,
  createTagSchema,
  tagQuerySchema,
  updateTagSchema,
} from '../validators/tagSchemas'

export class TagController {
  // GET /api/tags
  static async getTags(req: Request, res: Response) {
    try {
      const userId = req.user!.id
      const { search, limit = 50, offset = 0 } = tagQuerySchema.parse(req.query)

      const result = await TagService.getUserTags(userId, search, limit, offset)

      res.json({
        success: true,
        data: result,
      })
    } catch (error) {
      res.status(400).json({
        success: false,
        error: error instanceof Error ? error.message : 'タグの取得に失敗しました',
      })
    }
  }

  // GET /api/tags/:tagId
  static async getTag(req: Request, res: Response) {
    try {
      const userId = req.user!.id
      const { tagId } = req.params

      const tag = await TagService.getTagById(userId, tagId)

      res.json({
        success: true,
        data: { tag },
      })
    } catch (error) {
      res.status(404).json({
        success: false,
        error: error instanceof Error ? error.message : 'タグが見つかりません',
      })
    }
  }

  // POST /api/tags
  static async createTag(req: Request, res: Response) {
    try {
      const userId = req.user!.id
      const data = createTagSchema.parse(req.body)

      const tag = await TagService.createTag(userId, data)

      res.status(201).json({
        success: true,
        data: { tag },
      })
    } catch (error) {
      res.status(400).json({
        success: false,
        error: error instanceof Error ? error.message : 'タグの作成に失敗しました',
      })
    }
  }

  // PUT /api/tags/:tagId
  static async updateTag(req: Request, res: Response) {
    try {
      const userId = req.user!.id
      const { tagId } = req.params
      const data = updateTagSchema.parse(req.body)

      const tag = await TagService.updateTag(userId, tagId, data)

      res.json({
        success: true,
        data: { tag },
      })
    } catch (error) {
      res.status(400).json({
        success: false,
        error: error instanceof Error ? error.message : 'タグの更新に失敗しました',
      })
    }
  }

  // DELETE /api/tags/:tagId
  static async deleteTag(req: Request, res: Response) {
    try {
      const userId = req.user!.id
      const { tagId } = req.params

      await TagService.deleteTag(userId, tagId)

      res.json({
        success: true,
        message: 'タグを削除しました',
      })
    } catch (error) {
      res.status(400).json({
        success: false,
        error: error instanceof Error ? error.message : 'タグの削除に失敗しました',
      })
    }
  }

  // POST /api/feeds/:feedId/tags
  static async assignTagToFeed(req: Request, res: Response) {
    try {
      const userId = req.user!.id
      const { feedId } = req.params
      const data = assignTagToFeedSchema.parse(req.body)

      const feedTag = await TagService.assignTagToFeed(userId, feedId, data)

      res.status(201).json({
        success: true,
        data: { feedTag },
      })
    } catch (error) {
      res.status(400).json({
        success: false,
        error: error instanceof Error ? error.message : 'タグの割り当てに失敗しました',
      })
    }
  }

  // DELETE /api/feeds/:feedId/tags/:tagId
  static async removeTagFromFeed(req: Request, res: Response) {
    try {
      const userId = req.user!.id
      const { feedId, tagId } = req.params

      await TagService.removeTagFromFeed(userId, feedId, tagId)

      res.json({
        success: true,
        message: 'タグを削除しました',
      })
    } catch (error) {
      res.status(400).json({
        success: false,
        error: error instanceof Error ? error.message : 'タグの削除に失敗しました',
      })
    }
  }

  // GET /api/tags/:tagId/feeds
  static async getFeedsByTag(req: Request, res: Response) {
    try {
      const userId = req.user!.id
      const { tagId } = req.params
      const { limit = 50, offset = 0 } = tagQuerySchema.parse(req.query)

      const result = await TagService.getFeedsByTag(userId, tagId, limit, offset)

      res.json({
        success: true,
        data: result,
      })
    } catch (error) {
      res.status(400).json({
        success: false,
        error: error instanceof Error ? error.message : 'フィードの取得に失敗しました',
      })
    }
  }
}
