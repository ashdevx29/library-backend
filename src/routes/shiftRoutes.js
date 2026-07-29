import express from 'express';
import {
  createShift,
  getAllShifts,
  getShiftById,
  updateShift,
  deleteShift,
} from '../controllers/ShiftController.js';
import { protect, authorize } from '../middleware/authMiddleware.js';

const router = express.Router();

router.use(protect);

router.get('/', getAllShifts);
router.get('/:id', getShiftById);
router.post('/', authorize('Super Admin', 'Branch Admin'), createShift);
router.put('/:id', authorize('Super Admin', 'Branch Admin'), updateShift);
router.delete('/:id', authorize('Super Admin', 'Branch Admin'), deleteShift);

export default router;
