import Announcement from '../models/Announcement.js';

export const AnnouncementService = {
  create: async (data) => Announcement.create(data),

  getAll: async (filters = {}) => {
    const query = {};
    if (filters.status) query.status = filters.status;
    return Announcement.find(query).sort({ createdAt: -1 });
  },

  getById: async (id) => {
    const a = await Announcement.findById(id);
    if (!a) throw new Error('Announcement not found');
    return a;
  },

  update: async (id, data) => {
    const a = await Announcement.findByIdAndUpdate(id, data, { new: true, runValidators: true });
    if (!a) throw new Error('Announcement not found');
    return a;
  },

  delete: async (id) => {
    const a = await Announcement.findByIdAndDelete(id);
    if (!a) throw new Error('Announcement not found');
    return true;
  },

  getActive: async () => {
    const now = new Date();
    return Announcement.find({ status: 'Active', startDate: { $lte: now }, endDate: { $gte: now } }).sort({ createdAt: -1 });
  },
};
