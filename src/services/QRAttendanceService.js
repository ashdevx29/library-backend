import jwt from 'jsonwebtoken';
import QRCode from 'qrcode';
import Attendance from '../models/Attendance.js';
import AttendanceLog from '../models/AttendanceLog.js';
import Seat from '../models/Seat.js';
import SeatHistory from '../models/SeatHistory.js';
import Member from '../models/Member.js';
import User from '../models/User.js';
// fege
const QR_SECRET = process.env.JWT_SECRET + '-qr-attendance';
const QR_EXPIRY = '5m';

export const QRAttendanceService = {
  generateQR: async () => {
    const payload = {
      type: 'library-attendance',
      libId: 'main',
      iat: Math.floor(Date.now() / 1000),
    };

    const token = jwt.sign(payload, QR_SECRET, { expiresIn: QR_EXPIRY });

    const clientUrl = (process.env.CLIENT_URL || 'http://localhost:5173').replace(/\/+$/, '');
    const url = `${clientUrl}/student/attendance?qr=${token}`;
    const qrDataUrl = await QRCode.toDataURL(url, {
      width: 300,
      margin: 2,
      color: { dark: '#1E1E1E', light: '#FFFFFF' },
    });

    return {
      qrDataUrl,
      token,
      expiresIn: 300,
      generatedAt: new Date().toISOString(),
    };
  },

  verifyQR: async (token) => {
    try {
      const decoded = jwt.verify(token, QR_SECRET);
      if (decoded.type !== 'library-attendance') throw new Error('Invalid QR type');
      return { valid: true, decoded };
    } catch (error) {
      return { valid: false, error: error.message };
    }
  },

  clockIn: async (userId, token) => {
    const qrCheck = await QRAttendanceService.verifyQR(token);
    if (!qrCheck.valid) throw new Error('Invalid or expired QR code. Ask admin to regenerate.');

    const user = await User.findById(userId);
    if (!user) throw new Error('User not found');

    const member = await Member.findOne({ userId });
    if (!member) throw new Error('Member profile not found');
    if (member.status !== 'Active') throw new Error('Account is not active');

    if (!member.seatId) throw new Error('No seat assigned. Contact admin.');
    if (!member.shiftId) throw new Error('No shift assigned. Contact admin.');

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const existing = await Attendance.findOne({
      memberId: member._id,
      date: { $gte: today, $lt: tomorrow },
    });
    if (existing && existing.checkInTime) {
      throw new Error('Already clocked in today');
    }

    const attendance = await Attendance.findOneAndUpdate(
      { memberId: member._id, date: { $gte: today, $lt: tomorrow } },
      {
        $set: {
          checkInTime: new Date(),
          status: 'Present',
          shiftId: member.shiftId,
          seatId: member.seatId,
        },
      },
      { new: true, upsert: true }
    );

    await AttendanceLog.create({
      memberId: member._id,
      action: 'ClockIn',
      ipAddress: 'qr-scan',
      device: 'QR System',
    });

    await Seat.findByIdAndUpdate(member.seatId, {
      status: 'Occupied',
      currentOccupant: member._id,
      lastCheckIn: new Date(),
    });

    try {
      await SeatHistory.create({
        seatId: member.seatId,
        memberId: member._id,
        action: 'checkin',
        shiftId: member.shiftId,
      });
    } catch (_) {}

    return {
      attendance,
      message: `Clocked in at ${new Date().toLocaleTimeString('en-IN')}`,
    };
  },

  clockOut: async (userId, token) => {
    const qrCheck = await QRAttendanceService.verifyQR(token);
    if (!qrCheck.valid) throw new Error('Invalid or expired QR code. Ask admin to regenerate.');

    const user = await User.findById(userId);
    if (!user) throw new Error('User not found');

    const member = await Member.findOne({ userId });
    if (!member) throw new Error('Member profile not found');

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const attendance = await Attendance.findOne({
      memberId: member._id,
      date: { $gte: today, $lt: tomorrow },
    });

    if (!attendance || !attendance.checkInTime) {
      throw new Error('Not clocked in today');
    }
    if (attendance.checkOutTime) {
      throw new Error('Already clocked out today');
    }

    const now = new Date();
    attendance.checkOutTime = now;
    attendance.duration = Math.round((now - attendance.checkInTime) / 60000);
    await attendance.save();

    await AttendanceLog.create({
      memberId: member._id,
      action: 'ClockOut',
      ipAddress: 'qr-scan',
      device: 'QR System',
    });

    if (attendance.seatId) {
      await Seat.findByIdAndUpdate(attendance.seatId, {
        status: 'Available',
        currentOccupant: null,
        lastCheckOut: now,
      });

      try {
        await SeatHistory.create({
          seatId: attendance.seatId,
          memberId: member._id,
          action: 'checkout',
          shiftId: attendance.shiftId,
          duration: attendance.duration,
        });
      } catch (_) {}
    }

    return {
      attendance,
      duration: attendance.duration,
      message: `Clocked out at ${now.toLocaleTimeString('en-IN')}. Duration: ${attendance.duration} min`,
    };
  },

  getStatus: async (userId) => {
    const member = await Member.findOne({ userId });
    if (!member) return null;

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const attendance = await Attendance.findOne({
      memberId: member._id,
      date: { $gte: today, $lt: tomorrow },
    }).populate('seatId', 'seatNumber')
      .populate('shiftId', 'shiftName startTime endTime');

    return {
      hasClockedIn: !!attendance?.checkInTime,
      hasClockedOut: !!attendance?.checkOutTime,
      attendance: attendance || null,
    };
  },

  getHistory: async (userId, month, year) => {
    const member = await Member.findOne({ userId });
    if (!member) return [];

    const start = new Date(year, month - 1, 1);
    const end = new Date(year, month, 0, 23, 59, 59);

    return Attendance.find({
      memberId: member._id,
      date: { $gte: start, $lte: end },
    })
      .populate('seatId', 'seatNumber')
      .populate('shiftId', 'shiftName')
      .sort({ date: -1 });
  },
};
