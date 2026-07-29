import Attendance from '../models/Attendance.js';
import Payment from '../models/Payment.js';
import Expense from '../models/Expense.js';
import Member from '../models/Member.js';
import Seat from '../models/Seat.js';
import Shift from '../models/Shift.js';
import RenewalRequest from '../models/RenewalRequest.js';

export const AdminReportService = {
  // ─── Attendance Reports ───
  attendanceDaily: async (date, shiftId) => {
    const target = date ? new Date(date) : new Date();
    target.setHours(0, 0, 0, 0);
    const next = new Date(target); next.setDate(next.getDate() + 1);
    const match = { date: { $gte: target, $lt: next } };
    if (shiftId) match.shiftId = shiftId;

    const records = await Attendance.find(match)
      .populate({ path: 'memberId', select: 'fullName mobile' })
      .populate('shiftId', 'shiftName')
      .populate('seatId', 'seatNumber')
      .sort({ checkInTime: 1 });

    const totalMembers = await Member.countDocuments({ status: 'Active', ...(shiftId ? { shiftId } : {}) });
    const present = records.length;
    const late = records.filter(r => {
      if (!r.checkInTime || !r.shiftId) return false;
      const [h, m] = r.shiftId.startTime.split(':').map(Number);
      return r.checkInTime.getHours() * 60 + r.checkInTime.getMinutes() > h * 60 + m + 15;
    }).length;

    return { date: target.toISOString().split('T')[0], totalMembers, present, absent: totalMembers - present, late, records };
  },

  attendanceMonthly: async (month, year, shiftId) => {
    const m = parseInt(month) || new Date().getMonth() + 1;
    const y = parseInt(year) || new Date().getFullYear();
    const start = new Date(y, m - 1, 1);
    const end = new Date(y, m, 0, 23, 59, 59);
    const match = { date: { $gte: start, $lte: end } };
    if (shiftId) match.shiftId = shiftId;

    const records = await Attendance.find(match)
      .populate({ path: 'memberId', select: 'fullName mobile' })
      .populate('shiftId', 'shiftName')
      .sort({ date: -1 });

    const totalMembers = await Member.countDocuments({ status: 'Active' });
    const daysInMonth = end.getDate();
    const byDay = {};
    for (let d = 1; d <= daysInMonth; d++) byDay[d] = 0;
    records.forEach(r => { byDay[r.date.getDate()]++; });

    return { month: m, year: y, totalMembers, daysInMonth, totalPresent: records.length, avgDaily: Math.round(records.length / daysInMonth * 10) / 10, byDay: Object.entries(byDay).map(([d, c]) => ({ day: parseInt(d), count: c })), records };
  },

  attendanceYearly: async (year, shiftId) => {
    const y = parseInt(year) || new Date().getFullYear();
    const start = new Date(y, 0, 1);
    const end = new Date(y, 11, 31, 23, 59, 59);
    const match = { date: { $gte: start, $lte: end } };
    if (shiftId) match.shiftId = shiftId;

    const records = await Attendance.find(match).populate('memberId', 'fullName').populate('shiftId', 'shiftName').sort({ date: -1 });
    const totalMembers = await Member.countDocuments({ status: 'Active' });
    const byMonth = {};
    for (let i = 1; i <= 12; i++) byMonth[i] = { month: i, present: 0 };
    records.forEach(r => { const m = r.date.getMonth() + 1; byMonth[m].present++; });

    return { year: y, totalMembers, totalPresent: records.length, byMonth: Object.values(byMonth), records };
  },

  // ─── Fees Reports ───
  feesDaily: async (date) => {
    const target = date ? new Date(date) : new Date();
    target.setHours(0, 0, 0, 0);
    const next = new Date(target); next.setDate(next.getDate() + 1);

    const [paid, pending] = await Promise.all([
      Payment.find({ status: 'Paid', paymentDate: { $gte: target, $lt: next } }).populate({ path: 'memberId', select: 'fullName mobile' }).populate('membershipId', 'planType'),
      Payment.find({ status: 'Pending', paymentDate: { $gte: target, $lt: next } }).populate({ path: 'memberId', select: 'fullName mobile' }).populate('membershipId', 'planType'),
    ]);

    return {
      date: target.toISOString().split('T')[0],
      collection: paid.reduce((s, p) => s + p.amount, 0),
      paidCount: paid.length,
      pendingCount: pending.length,
      pendingAmount: pending.reduce((s, p) => s + p.amount, 0),
      paid, pending,
    };
  },

  feesMonthly: async (month, year) => {
    const m = parseInt(month) || new Date().getMonth() + 1;
    const y = parseInt(year) || new Date().getFullYear();
    const start = new Date(y, m - 1, 1);
    const end = new Date(y, m, 0, 23, 59, 59);

    const [paid, pending] = await Promise.all([
      Payment.find({ status: 'Paid', paymentDate: { $gte: start, $lte: end } }).populate({ path: 'memberId', select: 'fullName mobile' }).populate('membershipId', 'planType'),
      Payment.find({ status: 'Pending' }).populate({ path: 'memberId', select: 'fullName mobile' }).populate('membershipId', 'planType'),
    ]);

    const byDay = {};
    paid.forEach(p => {
      const d = p.paymentDate.getDate();
      byDay[d] = (byDay[d] || 0) + p.amount;
    });

    return {
      month: m, year: y,
      totalCollection: paid.reduce((s, p) => s + p.amount, 0),
      paidCount: paid.length,
      pendingCount: pending.length,
      pendingAmount: pending.reduce((s, p) => s + p.amount, 0),
      byDay: Object.entries(byDay).map(([d, amt]) => ({ day: parseInt(d), amount: amt })),
      paid, pending,
    };
  },

  feesPending: async () => {
    const pending = await Payment.find({ status: 'Pending' })
      .populate({ path: 'memberId', select: 'fullName mobile membershipExpiryDate' })
      .populate('membershipId', 'planType expiryDate')
      .sort({ paymentDate: -1 });

    const pendingRenewals = await RenewalRequest.find({ status: 'Pending' })
      .populate({ path: 'memberId', select: 'fullName mobile membershipExpiryDate' });

    return {
      pendingPayments: pending,
      pendingAmount: pending.reduce((s, p) => s + p.amount, 0),
      pendingRenewals,
      totalPending: pending.length + pendingRenewals.length,
    };
  },

  // ─── Membership Reports ───
  membershipOverview: async () => {
    const now = new Date();
    const weekLater = new Date(now); weekLater.setDate(weekLater.getDate() + 7);
    const monthLater = new Date(now); monthLater.setDate(monthLater.getDate() + 30);

    const [active, expiringWeek, expiringMonth, expired, total, byPlan] = await Promise.all([
      Member.countDocuments({ status: 'Active', membershipExpiryDate: { $gt: now } }),
      Member.countDocuments({ status: 'Active', membershipExpiryDate: { $gt: now, $lte: weekLater } }),
      Member.countDocuments({ status: 'Active', membershipExpiryDate: { $gt: now, $lte: monthLater } }),
      Member.countDocuments({ $or: [{ status: 'Inactive' }, { membershipExpiryDate: { $lte: now } }] }),
      Member.countDocuments(),
      Member.aggregate([{ $group: { _id: '$membershipPlan', count: { $sum: 1 } } }]),
    ]);

    const expiringDetails = await Member.find({
      status: 'Active',
      membershipExpiryDate: { $gt: now, $lte: monthLater },
    }).populate('seatId', 'seatNumber').populate('shiftId', 'shiftName').sort({ membershipExpiryDate: 1 });

    const expiredDetails = await Member.find({
      $or: [{ status: 'Inactive' }, { membershipExpiryDate: { $lte: now } }],
    }).populate('seatId', 'seatNumber').populate('shiftId', 'shiftName').sort({ membershipExpiryDate: 1 });

    return {
      total, active, expiringWeek, expiringMonth, expired,
      byPlan: Object.fromEntries(byPlan.map(p => [p._id, p.count])),
      expiringDetails, expiredDetails,
    };
  },

  // ─── Seat Reports ───
  seatOverview: async () => {
    const [total, byStatus, byFloor, byType] = await Promise.all([
      Seat.countDocuments(),
      Seat.aggregate([{ $group: { _id: '$status', count: { $sum: 1 } } }]),
      Seat.aggregate([{ $group: { _id: '$floor', total: { $sum: 1 }, occupied: { $sum: { $cond: [{ $eq: ['$status', 'Occupied'] }, 1, 0] } } }, }]),
      Seat.aggregate([{ $group: { _id: '$seatType', count: { $sum: 1 } } }]),
    ]);

    const statusMap = Object.fromEntries(byStatus.map(s => [s._id, s.count]));
    const occupied = statusMap['Occupied'] || 0;
    const available = statusMap['Available'] || 0;
    const reserved = statusMap['Reserved'] || 0;
    const inactive = statusMap['Inactive'] || 0;

    const occupiedSeats = await Seat.find({ status: 'Occupied' })
      .populate({ path: 'currentOccupant', select: 'fullName mobile' })
      .populate('shiftId', 'shiftName');

    return {
      total, occupied, available, reserved, inactive,
      occupancyPercent: total ? Math.round(occupied / total * 100) : 0,
      byFloor: byFloor.map(f => ({ floor: f._id, total: f.total, occupied: f.occupied, available: f.total - f.occupied })),
      byType: byType.map(t => ({ type: t._id || 'Standard', count: t.count })),
      occupiedSeats,
    };
  },
};
