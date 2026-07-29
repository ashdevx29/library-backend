import { AuthService } from '../services/AuthService.js';
import User from '../models/User.js';

export const adminLogin = async (req, res) => {
  try {
    const { identifier, password } = req.body;
    if (!identifier || !password) return res.status(400).json({ success: false, message: 'Identifier and password required' });
    
    const result = await AuthService.adminLogin(identifier, password, req.ip);
    res.status(200).json({ success: true, ...result });
  } catch (error) {
    res.status(401).json({ success: false, message: error.message });
  }
};

export const verifyOtp = async (req, res) => {
  try {
    const { userId, otp } = req.body;
    if (!userId || !otp) return res.status(400).json({ success: false, message: 'User ID and OTP required' });

    const { user, accessToken, refreshToken } = await AuthService.verifyOtp(userId, otp, req.ip);

    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
    });

    res.status(200).json({
      success: true,
      data: {
        _id: user._id, name: user.name, email: user.email, mobile: user.mobile, role: user.role, accessToken
      }
    });
  } catch (error) {
    res.status(401).json({ success: false, message: error.message });
  }
};

export const resendOtp = async (req, res) => {
  try {
    const { userId } = req.body;
    if (!userId) return res.status(400).json({ success: false, message: 'User ID required' });
    
    const result = await AuthService.resendOtp(userId);
    res.status(200).json({ success: true, ...result });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

export const userLogin = async (req, res) => {
  try {
    const { identifier, password } = req.body;
    if (!identifier || !password) return res.status(400).json({ success: false, message: 'Identifier and password required' });

    const { user, accessToken, refreshToken } = await AuthService.userLogin(identifier, password, req.ip);

    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
    });

    res.status(200).json({
      success: true,
      data: {
        _id: user._id, name: user.name, email: user.email, mobile: user.mobile, role: user.role, accessToken
      }
    });
  } catch (error) {
    res.status(401).json({ success: false, message: error.message });
  }
};

export const logoutUser = async (req, res) => {
  try {
    await AuthService.logout(req.user._id);
    res.cookie('refreshToken', '', { httpOnly: true, expires: new Date(0) });
    res.status(200).json({ success: true, message: 'Logged out successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const forgotPassword = async (req, res) => {
  try {
    const { identifier } = req.body;
    if (!identifier) return res.status(400).json({ success: false, message: 'Email or mobile required' });
    const result = await AuthService.forgotPassword(identifier);
    res.status(200).json({ success: true, ...result });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

export const resetPassword = async (req, res) => {
  try {
    const { token, password } = req.body;
    if (!token || !password) {
      return res.status(400).json({ success: false, message: 'Token and password required' });
    }
    const result = await AuthService.resetPassword(token, password);
    res.status(200).json({ success: true, ...result });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};
