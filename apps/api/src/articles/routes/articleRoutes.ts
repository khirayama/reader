import { Router } from 'express';
import { FeedController } from '../../feeds/controllers/feedController';
import { requireAuth } from '../../auth/middleware/requireAuth';

const router = Router();

// 全てのルートで認証を必須とする
router.use(requireAuth);

// 記事管理
router.get('/', FeedController.getAllArticles); // GET /api/articles - 全記事取得（ユーザーの全フィードから）

export { router as articleRouter };