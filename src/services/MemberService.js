import Member from '../models/Member.js';
import User from '../models/User.js';
import Membership from '../models/Membership.js';
import Attendance from '../models/Attendance.js';
import Payment from '../models/Payment.js';

const PLAN_DAYS = { Monthly: 30, Quarterly: 90, HalfYearly: 180, Yearly: 365 };

export const MemberService = {
  createMember: async (data, adminId) => {
    const session = await Member.startSession();
    session.startTransaction();
    try {
      const user = new User({
        role: 'Student',
        name: data.fullName,
        mobile: data.mobile,
        email: data.email,
        password: data.password || 'Student@123',
      });
      await user.save({ session });

      const joinDate = data.joiningDate ? new Date(data.joiningDate) : new Date();
      const days = PLAN_DAYS[data.membershipPlan] || 30;
      const expiry = new Date(joinDate);
      expiry.setDate(expiry.getDate() + days);

      const member = new Member({
        userId: user._id,
        fullName: data.fullName,
        mobile: data.mobile,
        email: data.email,
        address: data.address || '',
        aadhaarNumber: data.aadhaarNumber || '',
        photo: data.photo || '',
        seatId: data.seatId || null,
        shiftId: data.shiftId || null,
        joiningDate: joinDate,
        membershipPlan: data.membershipPlan,
        membershipExpiryDate: data.membershipExpiryDate || expiry,
      });
      await member.save({ session });

      const membership = new Membership({
        memberId: member._id,
        planType: data.membershipPlan,
        startDate: joinDate,
        expiryDate: data.membershipExpiryDate || expiry,
        amount: data.amount || 0,
        approvedBy: adminId,
      });
      await membership.save({ session });

      await session.commitTransaction();
      session.endSession();
      return member;
    } catch (error) {
      await session.abortTransaction();
      session.endSession();
      throw error;
    }
  },

  getAllMembers: async (filters = {}) => {
    const query = {};
    if (filters.status) query.status = filters.status;
    if (filters.plan) query.membershipPlan = filters.plan;
    if (filters.search) {
      query.$or = [
        { fullName: { $regex: filters.search, $options: 'i' } },
        { mobile: { $regex: filters.search, $options: 'i' } },
        { email: { $regex: filters.search, $options: 'i' } },
      ];
    }
    return await Member.find(query)
      .populate('seatId', 'seatNumber floor section')
      .populate('shiftId', 'shiftName startTime endTime')
      .sort({ createdAt: -1 });
  },

  getMemberById: async (id) => {
    const member = await Member.findById(id)
      .populate('userId', 'name email mobile status lastLogin')
      .populate('seatId', 'seatNumber floor section seatType status')
      .populate('shiftId', 'shiftName startTime endTime');
    if (!member) throw new Error('Member not found');
    return member;
  },

  updateMember: async (id, data) => {
    const member = await Member.findByIdAndUpdate(id, data, { new: true, runValidators: true })
      .populate('seatId', 'seatNumber floor section')
      .populate('shiftId', 'shiftName startTime endTime');
    if (!member) throw new Error('Member not found');
    if (data.fullName || data.mobile || data.email) {
      await User.findByIdAndUpdate(member.userId, {
        name: data.fullName || member.fullName,
        mobile: data.mobile || member.mobile,
        email: data.email || member.email,
      });
    }
    return member;
  },

  deleteMember: async (id) => {
    const member = await Member.findById(id);
    if (!member) throw new Error('Member not found');
    await User.findByIdAndDelete(member.userId);
    await Membership.deleteMany({ memberId: id });
    await Member.findByIdAndDelete(id);
    return true;
  },

  renewMembership: async (id, data) => {
    const member = await Member.findById(id);
    if (!member) throw new Error('Member not found');

    const baseDate = member.membershipExpiryDate > new Date() ? member.membershipExpiryDate : new Date();
    const days = PLAN_DAYS[data.planType || member.membershipPlan] || 30;
    const newExpiry = new Date(baseDate);
    newExpiry.setDate(newExpiry.getDate() + days);

    member.membershipPlan = data.planType || member.membershipPlan;
    member.membershipExpiryDate = newExpiry;
    member.status = 'Active';
    await member.save();

    const membership = new Membership({
      memberId: id,
      planType: member.membershipPlan,
      startDate: baseDate,
      expiryDate: newExpiry,
      amount: data.amount || 0,
      approvedBy: data.adminId,
    });
    await membership.save();

    if (data.paymentAmount) {
      await Payment.create({
        memberId: id,
        membershipId: membership._id,
        amount: data.paymentAmount,
        paymentMethod: data.paymentMethod || 'Cash',
        paymentDate: new Date(),
        status: 'Paid',
      });
    }

    return await Member.findById(id)
      .populate('seatId', 'seatNumber floor section')
      .populate('shiftId', 'shiftName startTime endTime');
  },

  memberStats: async () => {
    const [total, active, planCounts, expiringSoon] = await Promise.all([
      Member.countDocuments(),
      Member.countDocuments({ status: 'Active' }),
      Member.aggregate([{ $group: { _id: '$membershipPlan', count: { $sum: 1 } } }]),
      Member.countDocuments({
        status: 'Active',
        membershipExpiryDate: { $gte: new Date(), $lte: new Date(Date.now() + 7 * 86400000) },
      }),
    ]);
    const plans = Object.fromEntries(planCounts.map(p => [p._id, p.count]));
    return { total, active, inactive: total - active, expiringSoon, plans };
  },

  getMemberAttendance: async (id) => {
    const today = new Date();
    const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);
    const records = await Attendance.find({ memberId: id, date: { $gte: monthStart } }).sort('date');
    const present = records.filter(r => r.status === 'Present').length;
    const absent = records.filter(r => r.status === 'Absent').length;
    const total = present + absent;
    return { present, absent, percentage: total ? Math.round(present / total * 100) : 0, records };
  },

  getMemberPayments: async (id) => {
    return await Payment.find({ memberId: id }).sort({ paymentDate: -1 }).limit(10);
  },

  getMembershipHistory: async (id) => {
    return await Membership.find({ memberId: id }).sort({ createdAt: -1 });
  },
};
