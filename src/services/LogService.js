import ActivityLog from '../models/ActivityLog.js';
import AuditLog from '../models/AuditLog.js';

export const LogService = {
  logActivity: async (userId, action, module, description) => {
    return ActivityLog.create({ userId, action, module, description });
  },

  logAudit: async (userId, module, oldData, newData) => {
    return AuditLog.create({ userId, module, oldData, newData });
  },

  getActivityLogs: async (filters = {}) => {
    const query = {};
    if (filters.module) query.module = filters.module;
    if (filters.userId) query.userId = filters.userId;
    if (filters.startDate || filters.endDate) {
      query.timestamp = {};
      if (filters.startDate) query.timestamp.$gte = new Date(filters.startDate);
      if (filters.endDate) query.timestamp.$lte = new Date(filters.endDate);
    }
    return ActivityLog.find(query).populate('userId', 'name email role').sort({ timestamp: -1 }).limit(filters.limit || 200);
  },

  getAuditLogs: async (filters = {}) => {
    const query = {};
    if (filters.module) query.module = filters.module;
    if (filters.userId) query.userId = filters.userId;
    if (filters.startDate || filters.endDate) {
      query.createdAt = {};
      if (filters.startDate) query.createdAt.$gte = new Date(filters.startDate);
      if (filters.endDate) query.createdAt.$lte = new Date(filters.endDate);
    }
    return AuditLog.find(query).populate('userId', 'name email role').sort({ createdAt: -1 }).limit(filters.limit || 200);
  },

  getStats: async () => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const [totalActivity, todayActivity, totalAudit, modules] = await Promise.all([
      ActivityLog.countDocuments(),
      ActivityLog.countDocuments({ timestamp: { $gte: today } }),
      AuditLog.countDocuments(),
      ActivityLog.aggregate([{ $group: { _id: '$module', count: { $sum: 1 } } }]),
    ]);
    return { totalActivity, todayActivity, totalAudit, modules: Object.fromEntries(modules.map(m => [m._id, m.count])) };
  },

  clearOld: async (days = 90) => {
    const cutoff = new Date(); cutoff.setDate(cutoff.getDate() - days);
    const activity = await ActivityLog.deleteMany({ timestamp: { $lt: cutoff } });
    const audit = await AuditLog.deleteMany({ createdAt: { $lt: cutoff } });
    return { activityDeleted: activity.deletedCount, auditDeleted: audit.deletedCount };
  },
};
