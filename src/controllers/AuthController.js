import { AuthService } from '../services/AuthService.js';
import { SecurityService } from '../services/SecurityService.js';

const COOKIE_OPTIONS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'strict',
  path: '/api/auth',



  
  maxAge: 7 * 24 * 60 * 60 * 1000,
};

// ujgugyugu

const setRefreshCookie = (res, token) => res.cookie('refreshToken', token, COOKIE_OPTIONS);
const clearRefreshCookie = (res) => res.cookie('refreshToken', '', { ...COOKIE_OPTIONS, maxAge: 0 });

const clientInfo = (req) => ({
  ipAddress: req.ip || req.connection?.remoteAddress,
  userAgent: req.headers['user-agent'] || '',
});

export const adminLogin = async (req, res) => {
  try {
    const { identifier, password } = req.body;
    const { ipAddress, userAgent } = clientInfo(req);
    const result = await AuthService.adminLogin(identifier, password, ipAddress, userAgent);
    res.status(200).json({ success: true, ...result });
  } catch (error) {
    res.status(401).json({ success: false, message: error.message });
  }
};

export const verifyOtp = async (req, res) => {
  try {
    const { userId, otp } = req.body;
    const { ipAddress, userAgent } = clientInfo(req);
    const { user, accessToken, refreshToken } = await AuthService.verifyOtp(userId, otp, ipAddress, userAgent);
    setRefreshCookie(res, refreshToken);
    res.status(200).json({
      success: true,
      data: { _id: user._id, name: user.name, email: user.email, mobile: user.mobile, role: user.role, accessToken },
    });
  } catch (error) {
    res.status(401).json({ success: false, message: error.message });
  }
};

export const resendOtp = async (req, res) => {
  try {
    const { userId } = req.body;
    const result = await AuthService.resendOtp(userId);
    res.status(200).json({ success: true, ...result });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

export const userLogin = async (req, res) => {
  try {
    const { identifier, password } = req.body;
    const { ipAddress, userAgent } = clientInfo(req);
    const { user, accessToken, refreshToken } = await AuthService.userLogin(identifier, password, ipAddress, userAgent);
    setRefreshCookie(res, refreshToken);
    res.status(200).json({
      success: true,
      data: { _id: user._id, name: user.name, email: user.email, mobile: user.mobile, role: user.role, accessToken },
    });
  } catch (error) {
    res.status(401).json({ success: false, message: error.message });
  }
};

export const refreshToken = async (req, res) => {
  try {
    const token = req.cookies?.refreshToken || req.body?.refreshToken;
    if (!token) return res.status(401).json({ success: false, message: 'Refresh token required' });
    const { ipAddress, userAgent } = clientInfo(req);
    const result = await SecurityService.refreshAccessToken(token, ipAddress, userAgent);
    setRefreshCookie(res, result.refreshToken);
    res.status(200).json({
      success: true,
      data: { ...result.user, accessToken: result.accessToken },
    });
  } catch (error) {
    clearRefreshCookie(res);
    res.status(401).json({ success: false, message: error.message });
  }
};

export const logoutUser = async (req, res) => {
  try {
    const token = req.headers.authorization?.startsWith('Bearer')
      ? req.headers.authorization.split(' ')[1] : null;
    const { ipAddress } = clientInfo(req);
    await AuthService.logout(req.user._id, token, ipAddress);
    clearRefreshCookie(res);
    res.status(200).json({ success: true, message: 'Logged out successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const forgotPassword = async (req, res) => {
  try {
    const { identifier } = req.body;
    const { ipAddress } = clientInfo(req);
    const result = await AuthService.forgotPassword(identifier, ipAddress);
    res.status(200).json({ success: true, ...result });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

export const resetPassword = async (req, res) => {
  try {
    const { token, password } = req.body;
    const { ipAddress } = clientInfo(req);
    const result = await AuthService.resetPassword(token, password, ipAddress);
    clearRefreshCookie(res);
    res.status(200).json({ success: true, ...result });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};