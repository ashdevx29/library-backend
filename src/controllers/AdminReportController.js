import { AdminReportService } from '../services/AdminReportService.js';

export const AdminReportController = {
  attendanceDaily: async (req, res) => {
    try { res.json({ success: true, data: await AdminReportService.attendanceDaily(req.query.date, req.query.shiftId) }); }
    catch (e) { res.status(400).json({ success: false, message: e.message }); }
  },
  attendanceMonthly: async (req, res) => {
    try { res.json({ success: true, data: await AdminReportService.attendanceMonthly(req.query.month, req.query.year, req.query.shiftId) }); }
    catch (e) { res.status(400).json({ success: false, message: e.message }); }
  },
  attendanceYearly: async (req, res) => {
    try { res.json({ success: true, data: await AdminReportService.attendanceYearly(req.query.year, req.query.shiftId) }); }
    catch (e) { res.status(400).json({ success: false, message: e.message }); }
  },
  feesDaily: async (req, res) => {
    try { res.json({ success: true, data: await AdminReportService.feesDaily(req.query.date) }); }
    catch (e) { res.status(400).json({ success: false, message: e.message }); }
  },
  feesMonthly: async (req, res) => {
    try { res.json({ success: true, data: await AdminReportService.feesMonthly(req.query.month, req.query.year) }); }
    catch (e) { res.status(400).json({ success: false, message: e.message }); }
  },
  feesPending: async (req, res) => {
    try { res.json({ success: true, data: await AdminReportService.feesPending() }); }
    catch (e) { res.status(400).json({ success: false, message: e.message }); }
  },
  membershipOverview: async (req, res) => {
    try { res.json({ success: true, data: await AdminReportService.membershipOverview() }); }
    catch (e) { res.status(400).json({ success: false, message: e.message }); }
  },
  seatOverview: async (req, res) => {
    try { res.json({ success: true, data: await AdminReportService.seatOverview() }); }
    catch (e) { res.status(400).json({ success: false, message: e.message }); }
  },
};
