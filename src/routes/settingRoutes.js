import express from 'express';
import { protect, authorize } from '../middleware/authMiddleware.js';
import { SettingController } from '../controllers/SettingController.js';

const router = express.Router();
router.get('/', protect, SettingController.get);
router.put('/', protect, SettingController.update);
router.get('/smtp', protect, SettingController.getSMTP);
router.put('/smtp', protect, SettingController.updateSMTP);

export default router;
