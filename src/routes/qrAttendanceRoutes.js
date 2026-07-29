import express from 'express';
import { protect } from '../middleware/authMiddleware.js';
import { QRAttendanceController } from '../controllers/QRAttendanceController.js';

const router = express.Router();

router.get('/qr/generate', protect, QRAttendanceController.generateQR);
router.post('/qr/clock-in', protect, QRAttendanceController.clockIn);
router.post('/qr/clock-out', protect, QRAttendanceController.clockOut);
router.get('/status', protect, QRAttendanceController.getStatus);
router.get('/history', protect, QRAttendanceController.getHistory);

export default router;
