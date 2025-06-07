import { Router } from 'express';
import { refreshAllFeeds, getCronLogs } from '../controllers/adminController';
import { requireAdmin } from '../middleware/requireAdmin';

const router = Router();

// 全て管理者認証が必要
router.use(requireAdmin);

// 全フィードを更新
router.post('/refresh-all-feeds', refreshAllFeeds);

// Cronジョブのログを取得
router.get('/cron-logs', getCronLogs);

export { router as adminRouter };