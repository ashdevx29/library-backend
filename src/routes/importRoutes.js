import express from 'express';
import multer from 'multer';
import { protect, authorize } from '../middleware/authMiddleware.js';
import { ImportController } from '../controllers/ImportController.js';
// rgret
const router = express.Router();
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 5 * 1024 * 1024 } });

router.use(protect);
router.use(authorize('Super Admin', 'Branch Admin'));

router.get('/entities', ImportController.getImportableEntities);
router.post('/:entity', upload.single('file'), ImportController.importData);

export default router;
