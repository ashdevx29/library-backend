import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import BlacklistedToken from '../models/BlacklistedToken.js';
import ActivityLog from '../models/ActivityLog.js';
import generateTokens from '../utils/generateToken.js';

export const SecurityService = {
  blacklistToken: async (token, userId, type) => {
    try {
      const decoded = jwt.decode(token);
      const jti = decoded?.jti || token.slice(-32);
      const exp = decoded?.exp ? new Date(decoded.exp * 1000) : new Date(Date.now() + 86400000);
      await BlacklistedToken.create({ tokenId: jti, userId, type, expiresAt: exp });
    } catch { /* silently fail */ }
  },

  isTokenBlacklisted: async (token) => {
    try {
      const decoded = jwt.decode(token);
      if (!decoded?.jti) return false;
      const exists = await BlacklistedToken.findOne({ tokenId: decoded.jti });
      return !!exists;
    } catch { return false; }
  },

  refreshAccessToken: async (oldRefreshToken, ipAddress, userAgent) => {
    if (!oldRefreshToken) throw new Error('Refresh token required');

    let decoded;
    try {
      decoded = jwt.verify(oldRefreshToken, process.env.JWT_REFRESH_SECRET);
    } catch {
      throw new Error('Invalid or expired refresh token');
    }

    const blacklisted = await SecurityService.isTokenBlacklisted(oldRefreshToken);
    if (blacklisted) throw new Error('Token has been revoked');

    const user = await User.findById(decoded.id);
    if (!user) throw new Error('User not found');
    if (user.status !== 'Active') throw new Error('Account is not active');

    const newTokens = generateTokens(user._id, user.role);

    await SecurityService.blacklistToken(oldRefreshToken, user._id, 'refresh');

    user.refreshToken = newTokens.refreshToken;
    await user.save();

    await ActivityLog.create({
      userId: user._id,
      action: 'Token Refreshed',
      module: 'Auth',
      ipAddress,
      userAgent,
    });

    return {
      accessToken: newTokens.accessToken,
      refreshToken: newTokens.refreshToken,
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        mobile: user.mobile,
        role: user.role,
        permissions: await user.getAllPermissions(),
      },
    };
  },

  revokeAllUserTokens: async (userId) => {
    await BlacklistedToken.deleteMany({ userId });
    await User.findByIdAndUpdate(userId, { refreshToken: '' });
  },

  logFailedLogin: async (identifier, ipAddress, userAgent) => {
    await ActivityLog.create({
      userId: null,
      action: 'Failed Login',
      module: 'Auth',
      description: `Failed login attempt for ${identifier}`,
      ipAddress,
      userAgent,
      metadata: { identifier },
    });
  },

  logAccountLocked: async (userId, ipAddress) => {
    await ActivityLog.create({
      userId,
      action: 'Account Locked',
      module: 'Auth',
      description: 'Account locked due to too many failed attempts',
      ipAddress,
    });
  },
};
