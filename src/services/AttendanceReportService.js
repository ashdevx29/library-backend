import Attendance from '../models/Attendance.js';
import Member from '../models/Member.js';
import Shift from '../models/Shift.js';

export const AttendanceReportService = {
  // Admin: Daily report for all members
  getDailyReport: async (date, shiftId, memberId) => {
    const target = date ? new Date(date) : new Date();
    target.setHours(0, 0, 0, 0);
    const next = new Date(target);
    next.setDate(next.getDate() + 1);

    const match = { date: { $gte: target, $lt: next } };
    if (shiftId) match.shiftId = shiftId;
    if (memberId) match.memberId = memberId;

    const attendance = await Attendance.find(match)
      .populate({ path: 'memberId', select: 'fullName mobile seatId', populate: { path: 'seatId', select: 'seatNumber' } })
      .populate('shiftId', 'shiftName startTime endTime')
      .populate('seatId', 'seatNumber')
      .sort({ checkInTime: 1 });

    const totalMembers = await Member.countDocuments({
      status: 'Active',
      ...(shiftId ? { shiftId } : {}),
      ...(memberId ? { _id: memberId } : {}),
    });

    const present = attendance.filter(a => a.status === 'Present').length;
    const late = attendance.filter(a => {
      if (!a.checkInTime || !a.shiftId) return false;
      const shiftStart = a.shiftId.startTime;
      const [h, m] = shiftStart.split(':').map(Number);
      const shiftStartMin = h * 60 + m;
      const checkInMin = a.checkInTime.getHours() * 60 + a.checkInTime.getMinutes();
      return checkInMin > shiftStartMin + 15;
    }).length;

    return {
      date: target.toISOString().split('T')[0],
      attendance,
      stats: {
        totalMembers,
        present,
        absent: totalMembers - present,
        late,
      },
    };
  },

  // Admin: Monthly report
  getMonthlyReport: async (month, year, shiftId, memberId) => {
    const m = parseInt(month) || new Date().getMonth() + 1;
    const y = parseInt(year) || new Date().getFullYear();
    const start = new Date(y, m - 1, 1);
    const end = new Date(y, m, 0, 23, 59, 59);

    const match = { date: { $gte: start, $lte: end } };
    if (shiftId) match.shiftId = shiftId;
    if (memberId) match.memberId = memberId;

    const attendance = await Attendance.find(match)
      .populate({ path: 'memberId', select: 'fullName mobile', populate: { path: 'seatId', select: 'seatNumber' } })
      .populate('shiftId', 'shiftName')
      .populate('seatId', 'seatNumber')
      .sort({ date: -1, checkInTime: 1 });

    // Aggregate by day
    const byDay = {};
    attendance.forEach(a => {
      const day = a.date.toISOString().split('T')[0];
      if (!byDay[day]) byDay[day] = { present: 0, late: 0, records: [] };
      byDay[day].present++;
      if (a.shiftId) {
        const [h, min] = a.shiftId.startTime.split(':').map(Number);
        const checkInMin = a.checkInTime.getHours() * 60 + a.checkInTime.getMinutes();
        if (checkInMin > h * 60 + min + 15) byDay[day].late++;
      }
      byDay[day].records.push(a);
    });

    const totalMembers = await Member.countDocuments({
      status: 'Active',
      ...(shiftId ? { shiftId } : {}),
      ...(memberId ? { _id: memberId } : {}),
    });

    const totalPresent = attendance.length;
    const totalLate = Object.values(byDay).reduce((s, d) => s + d.late, 0);
    const daysInMonth = end.getDate();

    return {
      month: m,
      year: y,
      totalMembers,
      daysInMonth,
      summary: {
        totalPresent,
        avgDailyPresent: Math.round(totalPresent / daysInMonth * 10) / 10,
        totalLate,
      },
      byDay,
      attendance,
    };
  },

  // Admin: Yearly report
  getYearlyReport: async (year, shiftId, memberId) => {
    const y = parseInt(year) || new Date().getFullYear();
    const start = new Date(y, 0, 1);
    const end = new Date(y, 11, 31, 23, 59, 59);

    const match = { date: { $gte: start, $lte: end } };
    if (shiftId) match.shiftId = shiftId;
    if (memberId) match.memberId = memberId;

    const attendance = await Attendance.find(match)
      .populate('memberId', 'fullName mobile')
      .populate('shiftId', 'shiftName')
      .sort({ date: -1 });

    const byMonth = {};
    for (let i = 1; i <= 12; i++) {
      const key = `${y}-${String(i).padStart(2, '0')}`;
      byMonth[key] = { month: i, present: 0, late: 0, days: 0 };
    }

    const daysSet = {};
    attendance.forEach(a => {
      const key = `${a.date.getFullYear()}-${String(a.date.getMonth() + 1).padStart(2, '0')}`;
      if (byMonth[key]) {
        byMonth[key].present++;
        const dayKey = a.date.toISOString().split('T')[0];
        daysSet[dayKey] = true;
      }
    });

    Object.keys(byMonth).forEach(k => {
      const dayKeys = Object.keys(daysSet).filter(d => d.startsWith(k));
      byMonth[k].days = dayKeys.length;
      byMonth[k].avgDaily = byMonth[k].days > 0 ? Math.round(byMonth[k].present / byMonth[k].days * 10) / 10 : 0;
    });

    const totalMembers = await Member.countDocuments({
      status: 'Active',
      ...(shiftId ? { shiftId } : {}),
      ...(memberId ? { _id: memberId } : {}),
    });

    return {
      year: y,
      totalMembers,
      totalPresent: attendance.length,
      byMonth: Object.values(byMonth),
    };
  },

  // User: own attendance reports
  getMyDailyReport: async (userId, date) => {
    const member = await Member.findOne({ userId });
    if (!member) return null;

    const target = date ? new Date(date) : new Date();
    target.setHours(0, 0, 0, 0);
    const next = new Date(target);
    next.setDate(next.getDate() + 1);

    const attendance = await Attendance.findOne({
      memberId: member._id,
      date: { $gte: target, $lt: next },
    })
      .populate('shiftId', 'shiftName startTime endTime')
      .populate('seatId', 'seatNumber');

    return { date: target.toISOString().split('T')[0], attendance };
  },

  getMyMonthlyReport: async (userId, month, year) => {
    const member = await Member.findOne({ userId });
    if (!member) return null;

    const m = parseInt(month) || new Date().getMonth() + 1;
    const y = parseInt(year) || new Date().getFullYear();
    const start = new Date(y, m - 1, 1);
    const end = new Date(y, m, 0, 23, 59, 59);

    const attendance = await Attendance.find({
      memberId: member._id,
      date: { $gte: start, $lte: end },
    })
      .populate('shiftId', 'shiftName')
      .populate('seatId', 'seatNumber')
      .sort({ date: -1 });

    const present = attendance.length;
    const late = attendance.filter(a => {
      if (!a.shiftId) return false;
      const [h, min] = a.shiftId.startTime.split(':').map(Number);
      const checkInMin = a.checkInTime.getHours() * 60 + a.checkInTime.getMinutes();
      return checkInMin > h * 60 + min + 15;
    }).length;
    const totalDuration = attendance.reduce((s, a) => s + (a.duration || 0), 0);

    return {
      month: m,
      year: y,
      stats: { present, late, totalDuration, avgDuration: present > 0 ? Math.round(totalDuration / present) : 0 },
      attendance,
    };
  },

  getMyYearlyReport: async (userId, year) => {
    const member = await Member.findOne({ userId });
    if (!member) return null;

    const y = parseInt(year) || new Date().getFullYear();
    const start = new Date(y, 0, 1);
    const end = new Date(y, 11, 31, 23, 59, 59);

    const attendance = await Attendance.find({
      memberId: member._id,
      date: { $gte: start, $lte: end },
    }).sort({ date: -1 });

    const byMonth = {};
    for (let i = 1; i <= 12; i++) byMonth[i] = { month: i, present: 0, late: 0, totalDuration: 0 };

    attendance.forEach(a => {
      const m = a.date.getMonth() + 1;
      byMonth[m].present++;
      byMonth[m].totalDuration += a.duration || 0;
    });

    return {
      year: y,
      totalPresent: attendance.length,
      byMonth: Object.values(byMonth),
    };
  },
};
