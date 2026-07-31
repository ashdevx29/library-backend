import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import Otp from '../models/Otp.js';
import ActivityLog from '../models/ActivityLog.js';
import generateTokens from '../utils/generateToken.js';
import { SecurityService } from './SecurityService.js';
import { sendEmail } from '../utils/sendEmail.js';
// ee
const FAILED_LOGIN_THRESHOLD = 10;
const LOCKOUT_DURATION = 30 * 60 * 1000;

const log = (userId, action, module, ipAddress, userAgent, description, metadata) =>
  ActivityLog.create({ userId, action, module, ipAddress, userAgent, description, metadata });

const findUser = async (identifier, roles) => {
  const query = identifier.includes('@') ? { email: identifier.toLowerCase() } : { mobile: identifier };
  if (roles) query.role = { $in: Array.isArray(roles) ? roles : [roles] };
  return User.findOne(query);
};

export const AuthService = {
  adminLogin: async (identifier, password, ipAddress, userAgent) => {
    const user = await findUser(identifier, ['Super Admin', 'Branch Admin', 'Staff']);
    if (!user) throw new Error('Admin not found');
    if (user.status !== 'Active') throw new Error(`Account is ${user.status}`);

    const isMatch = await user.matchPassword(password);
    if (!isMatch) {
      await SecurityService.logFailedLogin(identifier, ipAddress, userAgent);
      throw new Error('Invalid credentials');
    }

    const otpCode = Otp.generateOtp();
    const otpHash = Otp.hashOtp(otpCode);

    await Otp.deleteMany({ userId: user._id });
    await Otp.create({
      userId: user._id,
      otpHash,
      expiresAt: new Date(Date.now() + 5 * 60 * 1000),
      attemptCount: 0,
      ipAddress,
    });

    await log(user._id, 'Admin Login Init', 'Auth', ipAddress, userAgent);

    if (user.email) {
      sendEmail({
        to: user.email,
        subject: 'Your Library ERP Login OTP',
        html: `<div style="font-family:sans-serif;max-width:480px;margin:auto;padding:24px;border:1px solid #eee;border-radius:12px">
          <h2 style="color:#f97316">Library ERP</h2>
          <p>Hi <strong>${user.name}</strong>,</p>
          <p>Your One-Time Password (OTP) for admin login is:</p>
          <div style="background:#f5f5f5;border-radius:8px;padding:16px;text-align:center;font-size:32px;letter-spacing:8px;font-weight:bold;color:#1e1e1e;margin:16px 0">${otpCode}</div>
          <p style="color:#666;font-size:13px">This OTP is valid for 5 minutes. Do not share it with anyone.</p>
        </div>`,
      }).catch(() => {});
    }
    console.log(`[DEV] OTP for ${user.email || user.mobile} is ${otpCode}`);

    return { message: 'OTP sent successfully', userId: user._id };
  },

  verifyOtp: async (userId, otpCode, ipAddress, userAgent) => {
    const otpRecord = await Otp.findOne({ userId, isVerified: false });

    if (!otpRecord) throw new Error('OTP not found or expired');
    if (otpRecord.expiresAt < new Date()) throw new Error('OTP Expired');
    if (otpRecord.attemptCount >= 5) throw new Error('Max attempts reached. Request a new OTP.');

    const otpHash = Otp.hashOtp(otpCode);
    if (otpRecord.otpHash !== otpHash) {
      otpRecord.attemptCount += 1;
      await otpRecord.save();
      throw new Error('Wrong OTP');
    }

    otpRecord.isVerified = true;
    await otpRecord.save();

    const user = await User.findById(userId);
    if (!user) throw new Error('User not found');

    const { accessToken, refreshToken } = generateTokens(user._id, user.role);
    user.refreshToken = refreshToken;
    user.lastLogin = new Date();
    await user.save();

    await Otp.deleteMany({ userId });
    await log(user._id, 'OTP Verified & Logged In', 'Auth', ipAddress, userAgent);

    return {
      user: {
        _id: user._id, name: user.name, email: user.email,
        mobile: user.mobile, role: user.role,
        permissions: await user.getAllPermissions(),
      },
      accessToken, refreshToken,
    };
  },

  resendOtp: async (userId) => {
    const otpRecord = await Otp.findOne({ userId, isVerified: false });
    if (otpRecord && (Date.now() - otpRecord.createdAt) < 60000) {
      throw new Error('Please wait 60 seconds before requesting a new OTP');
    }

    const otpCode = Otp.generateOtp();
    const otpHash = Otp.hashOtp(otpCode);

    await Otp.deleteMany({ userId });
    await Otp.create({
      userId,
      otpHash,
      expiresAt: new Date(Date.now() + 5 * 60 * 1000),
      attemptCount: 0,
    });

    const user = await User.findById(userId);
    if (user?.email) {
      sendEmail({
        to: user.email,
        subject: 'Your Library ERP Login OTP (Resend)',
        html: `<div style="font-family:sans-serif;max-width:480px;margin:auto;padding:24px;border:1px solid #eee;border-radius:12px">
          <h2 style="color:#f97316">Library ERP</h2>
          <p>Hi <strong>${user.name}</strong>,</p>
          <p>Your new One-Time Password (OTP) for admin login is:</p>
          <div style="background:#f5f5f5;border-radius:8px;padding:16px;text-align:center;font-size:32px;letter-spacing:8px;font-weight:bold;color:#1e1e1e;margin:16px 0">${otpCode}</div>
          <p style="color:#666;font-size:13px">This OTP is valid for 5 minutes. Do not share it with anyone.</p>
        </div>`,
      }).catch(() => {});
    }
    console.log(`[DEV] Resent OTP for UserID ${userId} is ${otpCode}`);
    return { message: 'OTP resent successfully' };
  },

  userLogin: async (identifier, password, ipAddress, userAgent) => {
    const user = await findUser(identifier, 'Student');
    if (!user) throw new Error('User not found');
    if (user.status !== 'Active') throw new Error(`Account is ${user.status}`);

    const isMatch = await user.matchPassword(password);
    if (!isMatch) {
      await SecurityService.logFailedLogin(identifier, ipAddress, userAgent);
      throw new Error('Invalid password');
    }

    const { accessToken, refreshToken } = generateTokens(user._id, user.role);
    user.refreshToken = refreshToken;
    user.lastLogin = new Date();
    await user.save();

    await log(user._id, 'User Logged In', 'Auth', ipAddress, userAgent);

    return {
      user: {
        _id: user._id, name: user.name, email: user.email,
        mobile: user.mobile, role: user.role,
        permissions: await user.getAllPermissions(),
      },
      accessToken, refreshToken,
    };
  },

  logout: async (userId, accessToken, ipAddress) => {
    const user = await User.findById(userId);
    if (!user) return true;

    if (user.refreshToken) {
      await SecurityService.blacklistToken(user.refreshToken, userId, 'refresh');
    }
    if (accessToken) {
      await SecurityService.blacklistToken(accessToken, userId, 'access');
    }

    user.refreshToken = '';
    await user.save();
    await log(userId, 'Logout', 'Auth', ipAddress);
    return true;
  },

  forgotPassword: async (identifier, ipAddress) => {
    const user = await findUser(identifier);
    if (!user) throw new Error('Account not found');

    const resetToken = jwt.sign(
      { id: user._id, purpose: 'password-reset' },
      process.env.JWT_SECRET,
      { expiresIn: '15m' }
    );

    const resetUrl = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/admin/reset-password?token=${resetToken}`;
    console.log(`[DEV] Password reset link for ${user.email || user.mobile}: ${resetUrl}`);

    await log(user._id, 'Forgot Password', 'Auth', ipAddress, null, 'Password reset link generated');

    return {
      message: 'Password reset link sent. Check your email.',
      resetUrl: process.env.NODE_ENV === 'production' ? undefined : resetUrl,
    };
  },

  resetPassword: async (token, password, ipAddress) => {
    if (!token) throw new Error('Reset token is required');
    if (!password || password.length < 8) throw new Error('Password must be at least 8 characters');
    if (!/[A-Z]/.test(password)) throw new Error('Password must contain at least one uppercase letter');
    if (!/[a-z]/.test(password)) throw new Error('Password must contain at least one lowercase letter');
    if (!/[0-9]/.test(password)) throw new Error('Password must contain at least one number');

    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET);
    } catch {
      throw new Error('Invalid or expired reset token');
    }

    if (decoded.purpose !== 'password-reset') throw new Error('Invalid reset token');

    const user = await User.findById(decoded.id);
    if (!user) throw new Error('User not found');

    user.password = password;
    await user.save();

    await SecurityService.revokeAllUserTokens(user._id);
    await log(user._id, 'Password Reset', 'Auth', ipAddress, null, 'Password updated via reset link');

    return { message: 'Password reset successfully' };
  },
};
