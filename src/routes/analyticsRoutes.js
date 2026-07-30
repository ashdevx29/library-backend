import express from 'express';
import { protect, authorize } from '../middleware/authMiddleware.js';
import { AnalyticsController } from '../controllers/AnalyticsController.js';

const router = express.Router();
router.use(protect);
router.use(authorize('Super Admin', 'Branch Admin', 'Staff'));

router.get('/summary', AnalyticsController.summary);
router.get('/revenue-expense', AnalyticsController.revenueExpense);
router.get('/attendance-trend', AnalyticsController.attendanceTrend);
router.get('/plan-distribution', AnalyticsController.planDistribution);
router.get('/seat-distribution', AnalyticsController.seatDistribution);
router.get('/daily-matrix', AnalyticsController.dailyMatrix);
router.get('/calendar-year', AnalyticsController.calendarYear);

export default router;
