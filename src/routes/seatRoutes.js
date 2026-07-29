import express from 'express';
import {
  createSeat, getAllSeats, getSeatGrid, getAvailableSeats,
  getSeatById, updateSeat, deleteSeat, updateSeatStatus,
  assignSeat, unassignSeat, transferSeat,
  seatStats, seatHistory, seatUsageStats,
} from '../controllers/SeatController.js';
import { protect, authorize } from '../middleware/authMiddleware.js';

const router = express.Router();
router.use(protect);

const admin = authorize('Super Admin', 'Branch Admin');
const staff = authorize('Super Admin', 'Branch Admin', 'Staff');

router.get('/stats', seatStats);
router.get('/grid', getSeatGrid);
router.get('/available', getAvailableSeats);
router.get('/', getAllSeats);
router.get('/:id', getSeatById);
router.get('/:id/history', seatHistory);
router.get('/:id/usage', seatUsageStats);

router.post('/', admin, createSeat);
router.post('/:id/assign', staff, assignSeat);
router.post('/:id/transfer', staff, transferSeat);
router.post('/:id/unassign', staff, unassignSeat);

router.put('/:id', admin, updateSeat);
router.patch('/:id/status', staff, updateSeatStatus);
router.delete('/:id', admin, deleteSeat);

export default router;
