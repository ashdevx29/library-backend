import express from 'express';
import {
  createMember, getAllMembers, getMemberById, updateMember,
  deleteMember, renewMembership, memberStats,
  getMemberAttendance, getMemberPayments, getMembershipHistory,
} from '../controllers/MemberController.js';
import { protect, authorize } from '../middleware/authMiddleware.js';

const router = express.Router();
router.use(protect);

const admin = authorize('Super Admin', 'Branch Admin', 'Staff');

router.get('/stats', admin, memberStats);
router.get('/', admin, getAllMembers);
router.get('/:id', admin, getMemberById);
router.get('/:id/attendance', admin, getMemberAttendance);
router.get('/:id/payments', admin, getMemberPayments);
router.get('/:id/membership-history', admin, getMembershipHistory);

router.post('/', admin, createMember);
router.put('/:id', admin, updateMember);
router.post('/:id/renew', admin, renewMembership);
router.delete('/:id', authorize('Super Admin', 'Branch Admin'), deleteMember);

export default router;
