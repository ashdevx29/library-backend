import express from 'express';
import { clockIn, clockOut } from '../controllers/AttendanceController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

router.post('/clock-in', protect, clockIn);
router.post('/clock-out', protect, clockOut);

export default router;
