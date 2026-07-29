import express from 'express';
import { protect, authorize } from '../middleware/authMiddleware.js';
import { NotificationController } from '../controllers/NotificationController.js';

const router = express.Router();

router.get('/stats', protect, NotificationController.getStats);
router.get('/my', protect, NotificationController.getForMember);
router.get('/', protect, NotificationController.getAll);
router.get('/:id', protect, NotificationController.getById);
router.post('/', protect, NotificationController.create);
router.put('/:id', protect, NotificationController.update);
router.post('/:id/send', protect, NotificationController.send);
router.delete('/:id', protect, NotificationController.delete);

export default router;
