import Membership from '../models/Membership.js';
import Payment from '../models/Payment.js';
import Member from '../models/Member.js';
import RenewalRequest from '../models/RenewalRequest.js';

const PLAN_DAYS = { Monthly: 30, Quarterly: 90, HalfYearly: 180, Yearly: 365 };
const PLAN_LABELS = { Monthly: '1 Month', Quarterly: '3 Months', HalfYearly: '6 Months', Yearly: '12 Months' };

export const MembershipService = {
  // User: request renewal
  requestRenewal: async (userId, planType, amount, paymentMethod) => {
    const member = await Member.findOne({ userId });
    if (!member) throw new Error('Member not found');
    if (member.status !== 'Active') throw new Error('Account is not active');

    const existingPending = await RenewalRequest.findOne({ memberId: member._id, status: 'Pending' });
    if (existingPending) throw new Error('You already have a pending renewal request');

    const request = await RenewalRequest.create({
      memberId: member._id,
      planType,
      amount: amount || 0,
      paymentMethod: paymentMethod || 'Cash',
    });

    return request;
  },

  // Admin: get all pending renewal requests
  getPendingRenewals: async () => {
    return RenewalRequest.find({ status: 'Pending' })
      .populate({ path: 'memberId', select: 'fullName mobile membershipPlan membershipExpiryDate' })
      .sort({ requestedAt: -1 });
  },

  // Admin: get all renewal requests (all statuses)
  getAllRenewals: async (status) => {
    const query = status ? { status } : {};
    return RenewalRequest.find(query)
      .populate({ path: 'memberId', select: 'fullName mobile membershipPlan membershipExpiryDate' })
      .populate('reviewedBy', 'name')
      .sort({ createdAt: -1 });
  },

  // Admin: approve renewal
  approveRenewal: async (requestId, adminId) => {
    const request = await RenewalRequest.findById(requestId);
    if (!request) throw new Error('Renewal request not found');
    if (request.status !== 'Pending') throw new Error('Request already processed');

    const member = await Member.findById(request.memberId);
    if (!member) throw new Error('Member not found');

    // Calculate new expiry from current expiry or today
    const baseDate = member.membershipExpiryDate > new Date() ? member.membershipExpiryDate : new Date();
    const days = PLAN_DAYS[request.planType] || 30;
    const newExpiry = new Date(baseDate);
    newExpiry.setDate(newExpiry.getDate() + days);

    // Update member
    member.membershipPlan = request.planType;
    member.membershipExpiryDate = newExpiry;
    member.status = 'Active';
    await member.save();

    // Create membership record
    const membership = await Membership.create({
      memberId: member._id,
      planType: request.planType,
      startDate: baseDate,
      expiryDate: newExpiry,
      amount: request.amount,
      approvedBy: adminId,
    });

    // Create payment record
    const payment = await Payment.create({
      memberId: member._id,
      membershipId: membership._id,
      amount: request.amount,
      paymentMethod: request.paymentMethod,
      paymentDate: new Date(),
      status: 'Paid',
    });

    // Update request
    request.status = 'Approved';
    request.reviewedBy = adminId;
    request.reviewedAt = new Date();
    await request.save();

    return { request, member, membership, payment };
  },

  // Admin: reject renewal
  rejectRenewal: async (requestId, adminId, note) => {
    const request = await RenewalRequest.findById(requestId);
    if (!request) throw new Error('Renewal request not found');
    if (request.status !== 'Pending') throw new Error('Request already processed');

    request.status = 'Rejected';
    request.reviewedBy = adminId;
    request.reviewedAt = new Date();
    request.note = note || '';
    await request.save();

    return request;
  },

  // Admin: get all payments with filters
  getPayments: async (filters = {}) => {
    const query = {};
    if (filters.status) query.status = filters.status;
    if (filters.memberId) query.memberId = filters.memberId;
    if (filters.paymentMethod) query.paymentMethod = filters.paymentMethod;
    if (filters.startDate || filters.endDate) {
      query.paymentDate = {};
      if (filters.startDate) query.paymentDate.$gte = new Date(filters.startDate);
      if (filters.endDate) query.paymentDate.$lte = new Date(filters.endDate);
    }

    return Payment.find(query)
      .populate({ path: 'memberId', select: 'fullName mobile' })
      .populate('membershipId', 'planType startDate expiryDate')
      .sort({ paymentDate: -1 });
  },

  // Admin: get payment stats
  getPaymentStats: async () => {
    const today = new Date();
    const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);
    const yearStart = new Date(today.getFullYear(), 0, 1);

    const [totalRevenue, monthRevenue, yearRevenue, pendingCount, pendingDues, totalTx, recentPayments] = await Promise.all([
      Payment.aggregate([
        { $match: { status: 'Paid' } },
        { $group: { _id: null, total: { $sum: '$amount' } } },
      ]),
      Payment.aggregate([
        { $match: { status: 'Paid', paymentDate: { $gte: monthStart } } },
        { $group: { _id: null, total: { $sum: '$amount' } } },
      ]),
      Payment.aggregate([
        { $match: { status: 'Paid', paymentDate: { $gte: yearStart } } },
        { $group: { _id: null, total: { $sum: '$amount' } } },
      ]),
      RenewalRequest.countDocuments({ status: 'Pending' }),
      Payment.countDocuments({ status: 'Pending' }),
      Payment.countDocuments(),
      Payment.find({ status: 'Paid' })
        .populate({ path: 'memberId', select: 'fullName mobile' })
        .sort({ paymentDate: -1 })
        .limit(10),
    ]);

    return {
      totalRevenue: totalRevenue[0]?.total || 0,
      monthRevenue: monthRevenue[0]?.total || 0,
      yearRevenue: yearRevenue[0]?.total || 0,
      pendingRenewals: pendingCount,
      pendingDues,
      totalTransactions: totalTx,
      recentPayments,
    };
  },

  // User: get my membership details
  getMyMembership: async (userId) => {
    const member = await Member.findOne({ userId })
      .populate('seatId', 'seatNumber floor')
      .populate('shiftId', 'shiftName startTime endTime');
    if (!member) return null;

    const daysLeft = Math.max(Math.ceil((member.membershipExpiryDate - new Date()) / 86400000), 0);
    const isExpired = member.membershipExpiryDate < new Date();

    const [pendingRequest, membershipHistory, paymentHistory] = await Promise.all([
      RenewalRequest.findOne({ memberId: member._id, status: 'Pending' }),
      Membership.find({ memberId: member._id }).sort({ createdAt: -1 }).limit(5),
      Payment.find({ memberId: member._id }).sort({ paymentDate: -1 }).limit(5),
    ]);

    return {
      member,
      daysLeft,
      isExpired,
      pendingRequest,
      membershipHistory,
      paymentHistory,
      plans: Object.entries(PLAN_DAYS).map(([key, days]) => ({
        type: key,
        label: PLAN_LABELS[key],
        days,
      })),
    };
  },

  // Admin: get expired & expiring members
  getExpiredMembers: async (filter) => {
    const now = new Date();
    const thirtyDaysLater = new Date(now.getTime() + 30 * 86400000);

    const query = {};
    if (filter === 'expired') {
      query.membershipExpiryDate = { $lt: now };
    } else if (filter === 'expiring') {
      query.membershipExpiryDate = { $gte: now, $lte: thirtyDaysLater };
    } else {
      query.membershipExpiryDate = { $lte: thirtyDaysLater };
    }

    return Member.find(query)
      .populate('userId', 'name email mobile')
      .populate('seatId', 'seatNumber')
      .populate('shiftId', 'shiftName')
      .sort({ membershipExpiryDate: 1 });
  },

  // Admin: get plan-wise revenue & membership stats
  getPlanStats: async () => {
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

    const [revenueByPlan, membersByPlan, pendingCount, expiringCount, expiredCount] = await Promise.all([
      // Revenue grouped by plan type (from membership records)
      Membership.aggregate([
        { $match: {} },
        { $group: { _id: '$planType', totalRevenue: { $sum: '$amount' }, count: { $sum: 1 } } },
        { $sort: { totalRevenue: -1 } },
      ]),
      // Active members grouped by plan
      Member.aggregate([
        { $match: { status: 'Active' } },
        { $group: { _id: '$membershipPlan', count: { $sum: 1 } } },
      ]),
      RenewalRequest.countDocuments({ status: 'Pending' }),
      Member.countDocuments({
        status: 'Active',
        membershipExpiryDate: { $gte: now, $lte: new Date(now.getTime() + 7 * 86400000) },
      }),
      Member.countDocuments({ membershipExpiryDate: { $lt: now } }),
    ]);

    const planOrder = ['Monthly', 'Quarterly', 'HalfYearly', 'Yearly'];
    const revenueBreakdown = planOrder.map(type => ({
      plan: type,
      label: PLAN_LABELS[type] || type,
      days: PLAN_DAYS[type] || 30,
      totalRevenue: (revenueByPlan.find(r => r._id === type)?.totalRevenue || 0),
      renewalCount: (revenueByPlan.find(r => r._id === type)?.count || 0),
    }));

    const memberBreakdown = planOrder.map(type => ({
      plan: type,
      label: PLAN_LABELS[type] || type,
      count: (membersByPlan.find(m => m._id === type)?.count || 0),
    }));

    return {
      revenueBreakdown,
      memberBreakdown,
      pendingRenewals: pendingCount,
      expiringThisWeek: expiringCount,
      expiredMembers: expiredCount,
    };
  },
};
