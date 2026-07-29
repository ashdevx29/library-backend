import express from 'express';
import { protect } from '../middleware/authMiddleware.js';
import { MemberCardController } from '../controllers/MemberCardController.js';

const router = express.Router();
router.get('/:id/card', protect, MemberCardController.generateCard);
router.get('/:id/card-data', protect, MemberCardController.getCardData);

export default router;
