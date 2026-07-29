import express from 'express';
import { protect } from '../middleware/authMiddleware.js';
import { BackupController } from '../controllers/BackupController.js';

const router = express.Router();
router.get('/', protect, BackupController.getBackups);
router.post('/create', protect, BackupController.createBackup);
router.post('/restore/:filename', protect, BackupController.restoreBackup);
router.delete('/:filename', protect, BackupController.deleteBackup);

export default router;
