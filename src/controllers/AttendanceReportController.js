import { AttendanceReportService } from '../services/AttendanceReportService.js';

export const AttendanceReportController = {
  // Admin reports
  getDailyReport: async (req, res) => {
    try {
      const { date, shiftId, memberId } = req.query;
      const data = await AttendanceReportService.getDailyReport(date, shiftId, memberId);
      res.json({ success: true, data });
    } catch (error) {
      res.status(400).json({ success: false, message: error.message });
    }
  },

  getMonthlyReport: async (req, res) => {
    try {
      const { month, year, shiftId, memberId } = req.query;
      const data = await AttendanceReportService.getMonthlyReport(month, year, shiftId, memberId);
      res.json({ success: true, data });
    } catch (error) {
      res.status(400).json({ success: false, message: error.message });
    }
  },

  getYearlyReport: async (req, res) => {
    try {
      const { year, shiftId, memberId } = req.query;
      const data = await AttendanceReportService.getYearlyReport(year, shiftId, memberId);
      res.json({ success: true, data });
    } catch (error) {
      res.status(400).json({ success: false, message: error.message });
    }
  },

  // User reports (own data only)
  getMyDailyReport: async (req, res) => {
    try {
      const { date } = req.query;
      const data = await AttendanceReportService.getMyDailyReport(req.user._id, date);
      res.json({ success: true, data });
    } catch (error) {
      res.status(400).json({ success: false, message: error.message });
    }
  },

  getMyMonthlyReport: async (req, res) => {
    try {
      const { month, year } = req.query;
      const data = await AttendanceReportService.getMyMonthlyReport(req.user._id, month, year);
      res.json({ success: true, data });
    } catch (error) {
      res.status(400).json({ success: false, message: error.message });
    }
  },

  getMyYearlyReport: async (req, res) => {
    try {
      const { year } = req.query;
      const data = await AttendanceReportService.getMyYearlyReport(req.user._id, year);
      res.json({ success: true, data });
    } catch (error) {
      res.status(400).json({ success: false, message: error.message });
    }
  },
};
