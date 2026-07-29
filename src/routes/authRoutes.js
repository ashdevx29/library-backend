import express from 'express';
import { 
  adminLogin, 
  verifyOtp, 
  resendOtp, 
  userLogin, 
  logoutUser,
  forgotPassword,
  resetPassword
} from '../controllers/AuthController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

router.post('/admin/login', adminLogin);
router.post('/admin/verify-otp', verifyOtp);
router.post('/admin/resend-otp', resendOtp);
router.post('/admin/forgot-password', forgotPassword);
router.post('/admin/reset-password', resetPassword);

router.post('/user/login', userLogin);
router.post('/logout', protect, logoutUser);
router.post('/refresh-token', (req, res) => res.status(200).json({ message: 'Refresh token endpoint' })); // Placeholder

export default router;
