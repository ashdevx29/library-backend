import express from 'express';
import { protect, authorize } from '../middleware/authMiddleware.js';
import { ExpenseController } from '../controllers/ExpenseController.js';

const router = express.Router();

router.get('/categories', protect, ExpenseController.getCategories);
router.get('/stats', protect, ExpenseController.getStats);
router.get('/reports/daily', protect, ExpenseController.getDailyReport);
router.get('/reports/monthly', protect, ExpenseController.getMonthlyReport);
router.get('/reports/yearly', protect, ExpenseController.getYearlyReport);
//  jhihii
router.get('/', protect, ExpenseController.getAll);
router.get('/:id', protect, ExpenseController.getById);
router.post('/', protect, authorize('Super Admin', 'Branch Admin', 'Staff'), ExpenseController.create);
router.put('/:id', protect, authorize('Super Admin', 'Branch Admin', 'Staff'), ExpenseController.update);
router.delete('/:id', protect, authorize('Super Admin', 'Branch Admin'), ExpenseController.delete);

export default router;
