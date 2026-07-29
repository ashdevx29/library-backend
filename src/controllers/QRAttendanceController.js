import { QRAttendanceService } from '../services/QRAttendanceService.js';

export const QRAttendanceController = {
  generateQR: async (req, res) => {
    try {
      const data = await QRAttendanceService.generateQR();
      res.json({ success: true, data });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  },

  clockIn: async (req, res) => {
    try {
      const { qrToken } = req.body;
      if (!qrToken) return res.status(400).json({ success: false, message: 'QR token required' });

      const data = await QRAttendanceService.clockIn(req.user._id, qrToken);
      res.json({ success: true, data });
    } catch (error) {
      res.status(400).json({ success: false, message: error.message });
    }
  },

  clockOut: async (req, res) => {
    try {
      const { qrToken } = req.body;
      if (!qrToken) return res.status(400).json({ success: false, message: 'QR token required' });

      const data = await QRAttendanceService.clockOut(req.user._id, qrToken);
      res.json({ success: true, data });
    } catch (error) {
      res.status(400).json({ success: false, message: error.message });
    }
  },

  getStatus: async (req, res) => {
    try {
      const data = await QRAttendanceService.getStatus(req.user._id);
      res.json({ success: true, data });
    } catch (error) {
      res.status(400).json({ success: false, message: error.message });
    }
  },

  getHistory: async (req, res) => {
    try {
      const { month, year } = req.query;
      const data = await QRAttendanceService.getHistory(
        req.user._id,
        parseInt(month) || new Date().getMonth() + 1,
        parseInt(year) || new Date().getFullYear()
      );
      res.json({ success: true, data });
    } catch (error) {
      res.status(400).json({ success: false, message: error.message });
    }
  },
};
