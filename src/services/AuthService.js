import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import Otp from '../models/Otp.js';
import ActivityLog from '../models/ActivityLog.js';
import generateTokens from '../utils/generateToken.js';

const generateSixDigitOtp = () => Math.floor(100000 + Math.random() * 900000).toString();

export const AuthService = {
  // Admin Login - Step 1: Validate and send OTP
  adminLogin: async (identifier, password, ipAddress) => {
    const query = identifier.includes('@') ? { email: identifier } : { mobile: identifier };
    const user = await User.findOne({ ...query, role: { $in: ['Super Admin', 'Branch Admin', 'Staff'] } });

    if (!user) throw new Error('Admin not found');
    if (user.status !== 'Active') throw new Error(`Account is ${user.status}`);

    const isMatch = await user.matchPassword(password);
    if (!isMatch) throw new Error('Invalid credentials');

    // Generate OTP
    const otpCode = generateSixDigitOtp();
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 Minutes

    // Delete existing OTPs for user
    await Otp.deleteMany({ userId: user._id });

    // Save new OTP
    const otpRecord = new Otp({
      userId: user._id,
      otp: otpCode, // In production, hash this
      expiresAt,
      attemptCount: 0
    });
    await otpRecord.save();

    // Log activity
    await ActivityLog.create({ userId: user._id, action: 'Admin Login Init', module: 'Auth', description: `IP: ${ipAddress}` });

    // Simulate sending OTP (In production, use Twilio/AWS SNS/SendGrid)
    console.log(`[DEV] OTP for ${user.email || user.mobile} is ${otpCode}`);

    return { message: 'OTP sent successfully', userId: user._id };
  },

  // Admin Login - Step 2: Verify OTP and Login
  verifyOtp: async (userId, otpCode, ipAddress) => {
    const otpRecord = await Otp.findOne({ userId });
    
    if (!otpRecord) throw new Error('OTP not found or expired');
    if (otpRecord.expiresAt < new Date()) throw new Error('OTP Expired');
    if (otpRecord.attemptCount >= 5) throw new Error('Max attempts reached. Request a new OTP.');
    
    if (otpRecord.otp !== otpCode) {
      otpRecord.attemptCount += 1;
      await otpRecord.save();
      throw new Error('Wrong OTP');
    }

    otpRecord.isVerified = true;
    await otpRecord.save();

    const user = await User.findById(userId);
    const { accessToken, refreshToken } = generateTokens(user._id, user.role);
    
    user.refreshToken = refreshToken;
    user.lastLogin = new Date();
    await user.save();

    // Cleanup OTP
    await Otp.deleteMany({ userId });

    await ActivityLog.create({ userId: user._id, action: 'OTP Verified & Logged In', module: 'Auth', description: `IP: ${ipAddress}` });

    return {
      user: { _id: user._id, name: user.name, email: user.email, mobile: user.mobile, role: user.role, permissions: await user.getAllPermissions() },
      accessToken, refreshToken
    };
  },

  // Resend OTP
  resendOtp: async (userId) => {
    const otpRecord = await Otp.findOne({ userId });
    
    if (otpRecord && (new Date() - otpRecord.createdAt) < 60000) {
      throw new Error('Please wait 60 seconds before requesting a new OTP');
    }

    const otpCode = generateSixDigitOtp();
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000);

    await Otp.deleteMany({ userId });

    await Otp.create({
      userId,
      otp: otpCode,
      expiresAt,
      attemptCount: 0
    });

    console.log(`[DEV] Resent OTP for UserID ${userId} is ${otpCode}`);
    return { message: 'OTP resent successfully' };
  },

  // User Direct Login
  userLogin: async (identifier, password, ipAddress) => {
    const query = identifier.includes('@') ? { email: identifier } : { mobile: identifier };
    const user = await User.findOne({ ...query, role: 'Student' });

    if (!user) throw new Error('User not found');
    if (user.status !== 'Active') throw new Error(`Account is ${user.status}`);

    const isMatch = await user.matchPassword(password);
    if (!isMatch) throw new Error('Invalid password');

    const { accessToken, refreshToken } = generateTokens(user._id, user.role);
    
    user.refreshToken = refreshToken;
    user.lastLogin = new Date();
    await user.save();

    await ActivityLog.create({ userId: user._id, action: 'User Logged In', module: 'Auth', description: `IP: ${ipAddress}` });

    return {
      user: { _id: user._id, name: user.name, email: user.email, mobile: user.mobile, role: user.role, permissions: await user.getAllPermissions() },
      accessToken, refreshToken
    };
  },

  logout: async (userId) => {
    const user = await User.findById(userId);
    if (user) {
      user.refreshToken = '';
      await user.save();
      await ActivityLog.create({ userId: user._id, action: 'Logout', module: 'Auth' });
    }
    return true;
  },

  forgotPassword: async (identifier) => {
    const query = identifier.includes('@') ? { email: identifier } : { mobile: identifier };
    const user = await User.findOne(query);
    if (!user) throw new Error('Account not found');

    const resetToken = jwt.sign(
      { id: user._id, purpose: 'password-reset' },
      process.env.JWT_SECRET,
      { expiresIn: '15m' }
    );

    const resetUrl = `http://localhost:5173/admin/reset-password?token=${resetToken}`;
    console.log(`[DEV] Password reset link for ${user.email || user.mobile}: ${resetUrl}`);

    await ActivityLog.create({
      userId: user._id,
      action: 'Forgot Password',
      module: 'Auth',
      description: 'Password reset link generated',
    });

    return {
      message: 'Password reset link sent. Check your email (dev: see server console).',
      resetUrl: process.env.NODE_ENV === 'production' ? undefined : resetUrl,
    };
  },

  resetPassword: async (token, password) => {
    if (!token) throw new Error('Reset token is required');
    if (!password || password.length < 8) throw new Error('Password must be at least 8 characters');

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

    await ActivityLog.create({
      userId: user._id,
      action: 'Password Reset',
      module: 'Auth',
      description: 'Password updated via reset link',
    });

    return { message: 'Password reset successfully' };
  },
};
