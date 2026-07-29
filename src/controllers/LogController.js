import { LogService } from '../services/LogService.js';

export const LogController = {
  getActivityLogs: async (req, res) => {
    try { res.json({ success: true, data: await LogService.getActivityLogs(req.query) }); }
    catch (e) { res.status(400).json({ success: false, message: e.message }); }
  },
  getAuditLogs: async (req, res) => {
    try { res.json({ success: true, data: await LogService.getAuditLogs(req.query) }); }
    catch (e) { res.status(400).json({ success: false, message: e.message }); }
  },
  getStats: async (req, res) => {
    try { res.json({ success: true, data: await LogService.getStats() }); }
    catch (e) { res.status(400).json({ success: false, message: e.message }); }
  },
  clearOld: async (req, res) => {
    try { res.json({ success: true, data: await LogService.clearOld(parseInt(req.body.days) || 90) }); }
    catch (e) { res.status(400).json({ success: false, message: e.message }); }
  },
};
