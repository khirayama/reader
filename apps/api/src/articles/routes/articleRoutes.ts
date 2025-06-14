import { Router } from 'express'
import { z } from 'zod'
import { requireAuth } from '../../auth/middleware/requireAuth'
import { FeedService } from '../../feeds/services/feedService'
import { ArticleService } from '../services/articleService'

const router = Router()

// 記事検索のクエリスキーマ
const GetArticlesQuerySchema = z.object({
  page: z
    .string()
    .optional()
    .transform((val) => (val ? Number.parseInt(val, 10) : 1)),
  limit: z
    .string()
    .optional()
    .transform((val) => (val ? Math.min(Number.parseInt(val, 10), 100) : 20)),
  search: z.string().optional(),
  tagId: z.string().optional(),
  feedId: z.string().optional(),
})

// ブックマーク記事一覧取得（具体的なルートを先に定義）
router.get('/bookmarks/list', requireAuth, async (req, res) => {
  try {
    const query = GetArticlesQuerySchema.parse(req.query)
    const userId = req.user!.id

    const result = await ArticleService.getUserBookmarks(userId, query.page, query.limit)

    res.json({
      success: true,
      data: result,
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'ブックマークの取得に失敗しました',
    })
  }
})

// 全ての記事取得
router.get('/', requireAuth, async (req, res) => {
  try {
    const query = GetArticlesQuerySchema.parse(req.query)
    const userId = req.user!.id

    const result = await ArticleService.getAllUserArticles(
      userId,
      query.page,
      query.limit,
      query.search,
      query.tagId,
      query.feedId
    )

    res.json({
      success: true,
      data: result,
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : '記事の取得に失敗しました',
    })
  }
})

// 記事詳細取得
router.get('/:articleId', requireAuth, async (req, res) => {
  try {
    const { articleId } = req.params
    const userId = req.user!.id

    const article = await ArticleService.getArticleById(articleId, userId)

    res.json({
      success: true,
      data: article,
    })
  } catch (error) {
    const statusCode =
      error instanceof Error && error.message.includes('権限がありません') ? 403 : 404
    res.status(statusCode).json({
      success: false,
      error: error instanceof Error ? error.message : '記事の取得に失敗しました',
    })
  }
})

// 記事を既読にする
router.put('/:articleId/read', requireAuth, async (req, res) => {
  try {
    const { articleId } = req.params
    const userId = req.user!.id

    await ArticleService.markAsRead(articleId, userId)

    res.json({
      success: true,
      message: '記事を既読にしました',
    })
  } catch (error) {
    const statusCode =
      error instanceof Error && error.message.includes('権限がありません') ? 403 : 404
    res.status(statusCode).json({
      success: false,
      error: error instanceof Error ? error.message : '記事の更新に失敗しました',
    })
  }
})

// 記事を未読にする
router.put('/:articleId/unread', requireAuth, async (req, res) => {
  try {
    const { articleId } = req.params
    const userId = req.user!.id

    await ArticleService.markAsUnread(articleId, userId)

    res.json({
      success: true,
      message: '記事を未読にしました',
    })
  } catch (error) {
    const statusCode =
      error instanceof Error && error.message.includes('権限がありません') ? 403 : 404
    res.status(statusCode).json({
      success: false,
      error: error instanceof Error ? error.message : '記事の更新に失敗しました',
    })
  }
})

// 記事をブックマークに追加
router.post('/:articleId/bookmark', requireAuth, async (req, res) => {
  try {
    const { articleId } = req.params
    const userId = req.user!.id

    await ArticleService.addBookmark(articleId, userId)

    res.json({
      success: true,
      message: '記事をブックマークに追加しました',
    })
  } catch (error) {
    const statusCode =
      error instanceof Error && error.message.includes('権限がありません')
        ? 403
        : error instanceof Error && error.message.includes('既にブックマーク')
          ? 409
          : 404
    res.status(statusCode).json({
      success: false,
      error: error instanceof Error ? error.message : 'ブックマークの追加に失敗しました',
    })
  }
})

// 記事のブックマークを削除
router.delete('/:articleId/bookmark', requireAuth, async (req, res) => {
  try {
    const { articleId } = req.params
    const userId = req.user!.id

    await ArticleService.removeBookmark(articleId, userId)

    res.json({
      success: true,
      message: 'ブックマークを削除しました',
    })
  } catch (error) {
    const statusCode =
      error instanceof Error && error.message.includes('権限がありません') ? 403 : 404
    res.status(statusCode).json({
      success: false,
      error: error instanceof Error ? error.message : 'ブックマークの削除に失敗しました',
    })
  }
})

export { router as articleRouter }
