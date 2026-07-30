import express from 'express';
import { body } from 'express-validator';
import { protect } from '../middleware/authMiddleware.js';
import { authLimiter, otpLimiter } from '../middleware/securityMiddleware.js';
import { validate } from '../helpers/apiResponse.js';
import {
  adminLogin, verifyOtp, resendOtp, userLogin, logoutUser,
  forgotPassword, resetPassword, refreshToken,
} from '../controllers/AuthController.js';

const router = express.Router();

router.post('/admin/login', authLimiter, [
  body('identifier').trim().notEmpty().withMessage('Email or mobile is required'),
  body('password').notEmpty().withMessage('Password is required'),
], validate, adminLogin);

router.post('/admin/verify-otp', otpLimiter, [
  body('userId').isMongoId().withMessage('Invalid user ID'),
  body('otp').isLength({ min: 6, max: 6 }).isNumeric().withMessage('OTP must be 6 digits'),
], validate, verifyOtp);

router.post('/admin/resend-otp', otpLimiter, [
  body('userId').isMongoId().withMessage('Invalid user ID'),
], validate, resendOtp);

router.post('/admin/forgot-password', authLimiter, [
  body('identifier').trim().notEmpty().withMessage('Email or mobile is required'),
], validate, forgotPassword);

router.post('/admin/reset-password', authLimiter, [
  body('token').notEmpty().withMessage('Reset token is required'),
  body('password').isLength({ min: 8 }).withMessage('Password must be at least 8 characters'),
], validate, resetPassword);

router.post('/user/login', authLimiter, [
  body('identifier').trim().notEmpty().withMessage('Email or mobile is required'),
  body('password').notEmpty().withMessage('Password is required'),
], validate, userLogin);

router.post('/refresh-token', refreshToken);

router.post('/logout', protect, logoutUser);

export default router;
