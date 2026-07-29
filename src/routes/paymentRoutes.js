import express from 'express';
import { protect, authorize } from '../middleware/authMiddleware.js';
import { PaymentController } from '../controllers/PaymentController.js';

const router = express.Router();

// Admin routes
router.post('/', protect, authorize('Super Admin', 'Branch Admin', 'Staff'), PaymentController.createPayment);
router.get('/', protect, authorize('Super Admin', 'Branch Admin', 'Staff'), PaymentController.getPayments);
router.get('/stats', protect, authorize('Super Admin', 'Branch Admin', 'Staff'), PaymentController.getPaymentStats);
router.get('/pending-dues', protect, authorize('Super Admin', 'Branch Admin', 'Staff'), PaymentController.getPendingDues);
router.get('/:id', protect, authorize('Super Admin', 'Branch Admin', 'Staff'), PaymentController.getPaymentById);
router.post('/:id/mark-paid', protect, authorize('Super Admin', 'Branch Admin', 'Staff'), PaymentController.markPaid);
router.post('/:id/mark-failed', protect, authorize('Super Admin', 'Branch Admin', 'Staff'), PaymentController.markFailed);
router.get('/:id/receipt', protect, PaymentController.downloadReceipt);
router.get('/:id/invoice', protect, PaymentController.downloadInvoice);

// User routes
router.get('/user/my-payments', protect, PaymentController.getUserPayments);
router.get('/user/my-renewals', protect, PaymentController.getUserRenewals);

export default router;
