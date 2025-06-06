import { Router } from 'express';
import { FeedController } from '../controllers/feedController';
import { requireAuth } from '../../auth/middleware/requireAuth';

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

export { router as feedRouter };