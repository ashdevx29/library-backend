import express from 'express';
import { protect } from '../middleware/authMiddleware.js';
import { AttendanceReportController } from '../controllers/AttendanceReportController.js';

const router = express.Router();

// Admin routes
router.get('/reports/daily', protect, AttendanceReportController.getDailyReport);
router.get('/reports/monthly', protect, AttendanceReportController.getMonthlyReport);
router.get('/reports/yearly', protect, AttendanceReportController.getYearlyReport);

// User routes (own data)
router.get('/reports/my-daily', protect, AttendanceReportController.getMyDailyReport);
router.get('/reports/my-monthly', protect, AttendanceReportController.getMyMonthlyReport);
router.get('/reports/my-yearly', protect, AttendanceReportController.getMyYearlyReport);

export default router;
