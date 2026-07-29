import Shift from '../models/Shift.js';

export const ShiftService = {
  createShift: async (data) => {
    const existing = await Shift.findOne({ shiftCode: data.shiftCode });
    if (existing) throw new Error('Shift code already exists');

    const shift = new Shift(data);
    return await shift.save();
  },

  getAllShifts: async (filters = {}) => {
    const query = {};
    if (filters.status) query.status = filters.status;
    return await Shift.find(query).sort({ startTime: 1 });
  },

  getShiftById: async (id) => {
    const shift = await Shift.findById(id);
    if (!shift) throw new Error('Shift not found');
    return shift;
  },

  updateShift: async (id, data) => {
    if (data.shiftCode) {
      const existing = await Shift.findOne({ shiftCode: data.shiftCode, _id: { $ne: id } });
      if (existing) throw new Error('Shift code already exists');
    }

    const shift = await Shift.findByIdAndUpdate(id, data, { new: true, runValidators: true });
    if (!shift) throw new Error('Shift not found');
    return shift;
  },

  deleteShift: async (id) => {
    const shift = await Shift.findByIdAndDelete(id);
    if (!shift) throw new Error('Shift not found');
    return true;
  },

  seedDefaults: async () => {
    const defaults = [
      { shiftName: 'Morning', shiftCode: 'MOR', startTime: '06:00', endTime: '12:00', description: 'Morning study shift', status: 'Active' },
      { shiftName: 'Afternoon', shiftCode: 'AFT', startTime: '12:00', endTime: '17:00', description: 'Afternoon study shift', status: 'Active' },
      { shiftName: 'Evening', shiftCode: 'EVE', startTime: '17:00', endTime: '21:00', description: 'Evening study shift', status: 'Active' },
      { shiftName: 'Night', shiftCode: 'NGT', startTime: '21:00', endTime: '23:59', description: 'Night study shift', status: 'Active' },
    ];

    for (const item of defaults) {
      const exists = await Shift.findOne({ shiftCode: item.shiftCode });
      if (!exists) await Shift.create(item);
    }

    return defaults;
  },
};
