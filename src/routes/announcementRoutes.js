import express from 'express';
import { protect } from '../middleware/authMiddleware.js';
import { AnnouncementController } from '../controllers/AnnouncementController.js';

const router = express.Router();
router.get('/active', AnnouncementController.getActive);
router.get('/', protect, AnnouncementController.getAll);
router.get('/:id', protect, AnnouncementController.getById);
router.post('/', protect, AnnouncementController.create);
router.put('/:id', protect, AnnouncementController.update);
router.delete('/:id', protect, AnnouncementController.delete);

export default router;
