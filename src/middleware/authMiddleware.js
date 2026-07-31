import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import { SecurityService } from '../services/SecurityService.js';
// gdgd
export const protect = async (req, res, next) => {
  let token;

  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    try {
      token = req.headers.authorization.split(' ')[1];

      const blacklisted = await SecurityService.isTokenBlacklisted(token);
      if (blacklisted) return res.status(401).json({ success: false, message: 'Token has been revoked' });

      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      if (decoded.type !== 'access') return res.status(401).json({ success: false, message: 'Invalid token type' });

      const user = await User.findById(decoded.id).select('-password').populate('roleId', 'name permissions');
      if (!user) return res.status(401).json({ success: false, message: 'User not found' });
      if (user.status !== 'Active') return res.status(401).json({ success: false, message: 'Account is not active' });

      req.user = user;
      req.user.allPermissions = await user.getAllPermissions();
      req.tokenId = decoded.jti;
      next();
    } catch (error) {
      if (error.name === 'TokenExpiredError') return res.status(401).json({ success: false, message: 'Token expired' });
      res.status(401).json({ success: false, message: 'Not authorized, token failed' });
    }
  } else {
    res.status(401).json({ success: false, message: 'Not authorized, no token' });
  }
};

export const authorize = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ success: false, message: `Role ${req.user.role} is not authorized` });
    }
    next();
  };
};

export const requirePermission = (...permissions) => {
  return (req, res, next) => {
    const userPerms = req.user.allPermissions || [];
    if (userPerms.includes('*')) return next();
    const hasAll = permissions.every(p => userPerms.includes(p));
    if (!hasAll) return res.status(403).json({ success: false, message: `Missing permissions: ${permissions.join(', ')}` });
    next();
  };
};

export const requireAnyPermission = (...permissions) => {
  return (req, res, next) => {
    const userPerms = req.user.allPermissions || [];
    if (userPerms.includes('*')) return next();
    const hasAny = permissions.some(p => userPerms.includes(p));
    if (!hasAny) return res.status(403).json({ success: false, message: `Requires one of: ${permissions.join(', ')}` });
    next();
  };
};
