import express from 'express';
import { protect, authorize } from '../middleware/authMiddleware.js';
import { ExportController } from '../controllers/ExportController.js';
// etre
const router = express.Router();
router.use(protect);
router.use(authorize('Super Admin', 'Branch Admin', 'Staff'));

router.get('/entities', ExportController.getExportableEntities);
router.get('/:entity', ExportController.exportData);

export default router;
