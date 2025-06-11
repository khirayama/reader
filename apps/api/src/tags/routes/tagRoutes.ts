import { Router } from 'express';
import { TagController } from '../controllers/tagController';
import { requireAuth } from '../../auth/middleware/requireAuth';
import { validate } from '../../middleware/validate';
import {
  createTagSchema,
  updateTagSchema,
  assignTagToFeedSchema,
  tagQuerySchema
} from '../validators/tagSchemas';

const router = Router();

// All tag routes require authentication
router.use(requireAuth);

// Tag CRUD routes
router.get('/', validate(tagQuerySchema), TagController.getTags);
router.post('/', validate(createTagSchema), TagController.createTag);
router.get('/:tagId', TagController.getTag);
router.put('/:tagId', validate(updateTagSchema), TagController.updateTag);
router.delete('/:tagId', TagController.deleteTag);

// Tag-specific feed routes
router.get('/:tagId/feeds', validate(tagQuerySchema), TagController.getFeedsByTag);

export { router as tagRoutes };