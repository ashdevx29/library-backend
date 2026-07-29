import express from 'express';
import { protect, authorize } from '../middleware/authMiddleware.js';
import { AdminReportController } from '../controllers/AdminReportController.js';

const router = express.Router();

router.get('/attendance/daily', protect, AdminReportController.attendanceDaily);
router.get('/attendance/monthly', protect, AdminReportController.attendanceMonthly);
router.get('/attendance/yearly', protect, AdminReportController.attendanceYearly);

router.get('/fees/daily', protect, AdminReportController.feesDaily);
router.get('/fees/monthly', protect, AdminReportController.feesMonthly);
router.get('/fees/pending', protect, AdminReportController.feesPending);

router.get('/membership', protect, AdminReportController.membershipOverview);
router.get('/seats', protect, AdminReportController.seatOverview);

export default router;
