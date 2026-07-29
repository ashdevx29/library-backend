import Notification from '../models/Notification.js';
import Member from '../models/Member.js';

export const NotificationService = {
  create: async (data, userId) => {
    return Notification.create({ ...data, sentBy: userId });
  },

  getAll: async (filters = {}) => {
    const query = {};
    if (filters.type) query.type = filters.type;
    if (filters.status) query.status = filters.status;
    return Notification.find(query)
      .populate('sentBy', 'name email')
      .populate('sentTo', 'fullName mobile')
      .populate('targetMembers', 'fullName mobile')
      .sort({ createdAt: -1 });
  },

  getById: async (id) => {
    const n = await Notification.findById(id)
      .populate('sentBy', 'name email')
      .populate('sentTo', 'fullName mobile membershipExpiryDate')
      .populate('targetMembers', 'fullName mobile membershipExpiryDate');
    if (!n) throw new Error('Notification not found');
    return n;
  },

  send: async (id) => {
    const n = await Notification.findById(id);
    if (!n) throw new Error('Notification not found');
    if (n.status === 'Sent') throw new Error('Notification already sent');

    let recipients = [];
    if (n.targetMembers && n.targetMembers.length > 0) {
      recipients = n.targetMembers;
    } else {
      const match = { status: 'Active' };
      if (n.targetRole === 'Student') match.role = 'Student';
      else if (n.targetRole === 'Staff') match.role = 'Staff';
      const members = await Member.find(match).select('_id');
      recipients = members.map(m => m._id);
    }

    n.sentTo = recipients;
    n.status = 'Sent';
    n.sentAt = new Date();
    await n.save();
    return n;
  },

  getForMember: async (memberId) => {
    return Notification.find({
      status: 'Sent',
      $or: [
        { targetMembers: { $in: [memberId] } },
        { targetMembers: { $size: 0 }, targetRole: 'All' },
        { targetMembers: { $size: 0 }, targetRole: 'Student' },
      ],
    })
      .populate('sentBy', 'name')
      .sort({ sentAt: -1 });
  },

  markRead: async (id) => {
    return Notification.findByIdAndUpdate(id, { $addToSet: { readBy: id } }, { new: true });
  },

  delete: async (id) => {
    const n = await Notification.findByIdAndDelete(id);
    if (!n) throw new Error('Notification not found');
    return true;
  },

  update: async (id, data) => {
    const n = await Notification.findByIdAndUpdate(id, data, { new: true, runValidators: true });
    if (!n) throw new Error('Notification not found');
    return n;
  },

  getStats: async () => {
    const [total, sent, draft, byType] = await Promise.all([
      Notification.countDocuments(),
      Notification.countDocuments({ status: 'Sent' }),
      Notification.countDocuments({ status: 'Draft' }),
      Notification.aggregate([{ $group: { _id: '$type', count: { $sum: 1 } } }]),
    ]);
    return { total, sent, draft, byType: Object.fromEntries(byType.map(t => [t._id, t.count])) };
  },
};
