import mongoose from 'mongoose';
import Member from '../models/Member.js';
import Attendance from '../models/Attendance.js';
import Payment from '../models/Payment.js';
import Expense from '../models/Expense.js';
import Seat from '../models/Seat.js';
// wrer
const range = (days) => {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  if (days) d.setDate(d.getDate() - days);
  return d;
};

const monthRange = (offset = 0) => {
  const d = new Date();
  d.setDate(1);
  d.setHours(0, 0, 0, 0);
  d.setMonth(d.getMonth() + offset);
  const end = new Date(d);
  end.setMonth(end.getMonth() + 1);
  return { start: d, end };
};

const weekRange = () => {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  d.setDate(diff);
  const end = new Date(d);
  end.setDate(end.getDate() + 7);
  return { start: d, end };
};

export const AnalyticsService = {
  async summary() {
    const today = range();
    const tomorrow = range();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const week = weekRange();
    const month = monthRange();

    const [
      totalMembers, activeMembers, expiredMembers,
      todayPay, weekPay, monthPay, yearPay,
      pendingFees,
      presentToday, totalMembersForAtt,
      totalSeats, occupiedSeats,
      totalRevenue, totalExpenses,
    ] = await Promise.all([
      Member.countDocuments(),
      Member.countDocuments({ status: 'Active', membershipExpiryDate: { $gte: new Date() } }),
      Member.countDocuments({ $or: [{ status: 'Inactive' }, { membershipExpiryDate: { $lt: new Date() } }] }),
      Payment.aggregate([{ $match: { paymentDate: { $gte: today, $lt: tomorrow }, status: 'Paid' } }, { $group: { _id: null, total: { $sum: '$amount' } } }]),
      Payment.aggregate([{ $match: { paymentDate: { $gte: week.start, $lt: week.end }, status: 'Paid' } }, { $group: { _id: null, total: { $sum: '$amount' } } }]),
      Payment.aggregate([{ $match: { paymentDate: { $gte: month.start, $lt: month.end }, status: 'Paid' } }, { $group: { _id: null, total: { $sum: '$amount' } } }]),
      Payment.aggregate([{ $match: { paymentDate: { $gte: new Date(new Date().getFullYear(), 0, 1) }, status: 'Paid' } }, { $group: { _id: null, total: { $sum: '$amount' } } }]),
      Payment.aggregate([{ $match: { status: 'Pending' } }, { $group: { _id: null, total: { $sum: '$amount' } } }]),
      Attendance.countDocuments({ date: { $gte: today, $lt: tomorrow }, status: 'Present' }),
      Member.countDocuments({ status: 'Active' }),
      Seat.countDocuments(),
      Seat.countDocuments({ status: 'Occupied' }),
      Payment.aggregate([{ $match: { status: 'Paid' } }, { $group: { _id: null, total: { $sum: '$amount' } } }]),
      Expense.aggregate([{}, { $group: { _id: null, total: { $sum: '$amount' } } }]),
    ]);

    const revenue = totalRevenue[0]?.total || 0;
    const expenses = totalExpenses[0]?.total || 0;
    const attPct = totalMembersForAtt > 0 ? Math.round((presentToday / totalMembersForAtt) * 100) : 0;
    const seatPct = totalSeats > 0 ? Math.round((occupiedSeats / totalSeats) * 100) : 0;

    return {
      todayCollection: todayPay[0]?.total || 0,
      weeklyCollection: weekPay[0]?.total || 0,
      monthlyCollection: monthPay[0]?.total || 0,
      yearlyCollection: yearPay[0]?.total || 0,
      activeMembers,
      expiredMembers,
      pendingFees: pendingFees[0]?.total || 0,
      attendancePercentage: attPct,
      seatUtilization: seatPct,
      revenue,
      expenses,
      profit: revenue - expenses,
      totalMembers,
      totalSeats,
      occupiedSeats,
      presentToday,
    };
  },

  async revenueExpense(months = 12) {
    const start = new Date();
    start.setHours(0, 0, 0, 0);
    start.setMonth(start.getMonth() - months + 1);
    start.setDate(1);

    const [revenueRows, expenseRows] = await Promise.all([
      Payment.aggregate([
        { $match: { paymentDate: { $gte: start }, status: 'Paid' } },
        { $group: { _id: { year: { $year: '$paymentDate' }, month: { $month: '$paymentDate' } }, amount: { $sum: '$amount' } } },
      ]),
      Expense.aggregate([
        { $match: { expenseDate: { $gte: start } } },
        { $group: { _id: { year: { $year: '$expenseDate' }, month: { $month: '$expenseDate' } }, amount: { $sum: '$amount' } } },
      ]),
    ]);

    const revMap = new Map(revenueRows.map(r => [`${r._id.year}-${r._id.month}`, r.amount]));
    const expMap = new Map(expenseRows.map(r => [`${r._id.year}-${r._id.month}`, r.amount]));

    return Array.from({ length: months }, (_, i) => {
      const d = new Date(start.getFullYear(), start.getMonth() + i, 1);
      const key = `${d.getFullYear()}-${d.getMonth() + 1}`;
      const revenue = revMap.get(key) || 0;
      const expenses = expMap.get(key) || 0;
      return {
        month: d.toLocaleString('en', { month: 'short' }),
        year: d.getFullYear(),
        revenue,
        expenses,
        profit: revenue - expenses,
      };
    });
  },

  async attendanceTrend(months = 6) {
    const start = new Date();
    start.setHours(0, 0, 0, 0);
    start.setMonth(start.getMonth() - months + 1);
    start.setDate(1);

    const rows = await Attendance.aggregate([
      { $match: { date: { $gte: start } } },
      {
        $group: {
          _id: { year: { $year: '$date' }, month: { $month: '$date' } },
          present: { $sum: { $cond: [{ $eq: ['$status', 'Present'] }, 1, 0] } },
          absent: { $sum: { $cond: [{ $eq: ['$status', 'Absent'] }, 1, 0] } },
        },
      },
    ]);

    const map = new Map(rows.map(r => [`${r._id.year}-${r._id.month}`, r]));
    return Array.from({ length: months }, (_, i) => {
      const d = new Date(start.getFullYear(), start.getMonth() + i, 1);
      const key = `${d.getFullYear()}-${d.getMonth() + 1}`;
      const r = map.get(key);
      const present = r?.present || 0;
      const absent = r?.absent || 0;
      const total = present + absent;
      return {
        month: d.toLocaleString('en', { month: 'short' }),
        present,
        absent,
        percentage: total > 0 ? Math.round((present / total) * 100) : 0,
      };
    });
  },

  async planDistribution() {
    const rows = await Member.aggregate([
      { $group: { _id: '$membershipPlan', value: { $sum: 1 } } },
      { $project: { _id: 0, name: '$_id', value: 1 } },
    ]);
    return rows;
  },

  async seatDistribution() {
    const rows = await Seat.aggregate([
      { $group: { _id: '$seatType', value: { $sum: 1 } } },
      { $project: { _id: 0, name: '$_id', value: 1 } },
    ]);
    return rows;
  },

  async dailyAttendanceMatrix(year, month) {
    const y = year || new Date().getFullYear();
    const m = month || new Date().getMonth() + 1;
    const start = new Date(y, m - 1, 1);
    const end = new Date(y, m, 1);

    const rows = await Attendance.aggregate([
      { $match: { date: { $gte: start, $lt: end } } },
      {
        $group: {
          _id: { day: { $dayOfMonth: '$date' }, status: '$status' },
          count: { $sum: 1 },
        },
      },
    ]);

    const daysInMonth = new Date(y, m, 0).getDate();
    const grid = [];
    for (let day = 1; day <= daysInMonth; day++) {
      const dayOfWeek = new Date(y, m - 1, day).getDay();
      const present = rows.find(r => r._id.day === day && r._id.status === 'Present')?.count || 0;
      const absent = rows.find(r => r._id.day === day && r._id.status === 'Absent')?.count || 0;
      grid.push({ day, dayOfWeek, present, absent, total: present + absent });
    }
    return { year: y, month: m, daysInMonth, grid };
  },

  async calendarYear(year) {
    const y = year || new Date().getFullYear();
    const start = new Date(y, 0, 1);
    const end = new Date(y + 1, 0, 1);

    const rows = await Attendance.aggregate([
      { $match: { date: { $gte: start, $lt: end } } },
      {
        $group: {
          _id: { year: { $year: '$date' }, month: { $month: '$date' }, day: { $dayOfMonth: '$date' } },
          present: { $sum: { $cond: [{ $eq: ['$status', 'Present'] }, 1, 0] } },
          absent: { $sum: { $cond: [{ $eq: ['$status', 'Absent'] }, 1, 0] } },
        },
      },
    ]);

    const map = {};
    rows.forEach(r => {
      const key = `${r._id.year}-${String(r._id.month).padStart(2, '0')}-${String(r._id.day).padStart(2, '0')}`;
      map[key] = { present: r.present, absent: r.absent, total: r.present + r.absent };
    });

    const months = [];
    for (let m = 0; m < 12; m++) {
      const daysInMonth = new Date(y, m + 1, 0).getDate();
      const days = [];
      for (let d = 1; d <= daysInMonth; d++) {
        const key = `${y}-${String(m + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
        const data = map[key] || { present: 0, absent: 0, total: 0 };
        days.push({ date: key, day: d, ...data, dayOfWeek: new Date(y, m, d).getDay() });
      }
      months.push({ month: m + 1, name: new Date(y, m).toLocaleString('en', { month: 'long' }), days });
    }
    return { year: y, months };
  },
};
