import express from 'express';
import { protect, authorize } from '../middleware/authMiddleware.js';
import { MembershipController } from '../controllers/MembershipController.js';

const router = express.Router();

// User routes
router.post('/renewal/request', protect, MembershipController.requestRenewal);
router.get('/my-membership', protect, MembershipController.getMyMembership);

// Admin routes
router.get('/renewals/pending', protect, authorize('Super Admin', 'Branch Admin', 'Staff'), MembershipController.getPendingRenewals);
router.get('/renewals', protect, authorize('Super Admin', 'Branch Admin', 'Staff'), MembershipController.getAllRenewals);
router.post('/renewals/:id/approve', protect, authorize('Super Admin', 'Branch Admin', 'Staff'), MembershipController.approveRenewal);
router.post('/renewals/:id/reject', protect, authorize('Super Admin', 'Branch Admin', 'Staff'), MembershipController.rejectRenewal);
router.get('/payments', protect, authorize('Super Admin', 'Branch Admin', 'Staff'), MembershipController.getPayments);
router.get('/payments/stats', protect, authorize('Super Admin', 'Branch Admin', 'Staff'), MembershipController.getPaymentStats);
router.get('/expired', protect, authorize('Super Admin', 'Branch Admin', 'Staff'), MembershipController.getExpiredMembers);
router.get('/plan-stats', protect, authorize('Super Admin', 'Branch Admin', 'Staff'), MembershipController.getPlanStats);

export default router;
