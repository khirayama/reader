import { Router } from 'express';
import { FeedController } from '../controllers/feedController';
import { TagController } from '../../tags/controllers/tagController';
import { requireAuth } from '../../auth/middleware/requireAuth';
import { validate } from '../../middleware/validate';
import { assignTagToFeedSchema } from '../../tags/validators/tagSchemas';

const router = Router();

// 全てのルートで認証を必須とする
router.use(requireAuth);

// フィード管理
router.post('/', FeedController.createFeed); // POST /api/feeds - フィード作成
router.get('/', FeedController.getFeeds); // GET /api/feeds - フィード一覧取得
router.get('/:feedId', FeedController.getFeedById); // GET /api/feeds/:feedId - フィード詳細取得
router.put('/:feedId', FeedController.updateFeed); // PUT /api/feeds/:feedId - フィード更新
router.delete('/:feedId', FeedController.deleteFeed); // DELETE /api/feeds/:feedId - フィード削除

// フィードの記事管理
router.get('/:feedId/articles', FeedController.getFeedArticles); // GET /api/feeds/:feedId/articles - フィード記事取得

// フィード更新
router.post('/:feedId/refresh', FeedController.refreshFeed); // POST /api/feeds/:feedId/refresh - フィード手動更新
router.post('/refresh-all', FeedController.refreshAllFeeds); // POST /api/feeds/refresh-all - 全フィード更新

// フィードタグ管理
router.post('/:feedId/tags', validate(assignTagToFeedSchema), TagController.assignTagToFeed); // POST /api/feeds/:feedId/tags - タグ割り当て
router.delete('/:feedId/tags/:tagId', TagController.removeTagFromFeed); // DELETE /api/feeds/:feedId/tags/:tagId - タグ削除

export { router as feedRouter };