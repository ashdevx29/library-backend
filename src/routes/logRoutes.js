import express from 'express';
import { protect } from '../middleware/authMiddleware.js';
import { LogController } from '../controllers/LogController.js';

const router = express.Router();
router.get('/stats', protect, LogController.getStats);
router.get('/activity', protect, LogController.getActivityLogs);
router.get('/audit', protect, LogController.getAuditLogs);
router.post('/clear', protect, LogController.clearOld);

export default router;
