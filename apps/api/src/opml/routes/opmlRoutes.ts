import { Router } from "express";
import multer from "multer";
import { requireAuth } from "../../auth/middleware/requireAuth";
import { opmlController } from "../controllers/opmlController";
import { validate } from "../../middleware/validate";
import { exportOpmlSchema, importOpmlSchema } from "../validators/opmlSchemas";
import { opmlLimiter, opmlTimeout } from "../../middleware/security";

const router = Router();
const upload = multer({ 
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
});

router.get(
  "/export",
  requireAuth,
  validate(exportOpmlSchema),
  opmlController.exportOpml
);

router.post(
  "/import",
  requireAuth,
  opmlLimiter,
  opmlTimeout,
  upload.single("file"),
  opmlController.importOpml
);

export default router;