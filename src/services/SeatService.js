import Seat from '../models/Seat.js';
import SeatHistory from '../models/SeatHistory.js';
import Member from '../models/Member.js';
import Attendance from '../models/Attendance.js';

let ioInstance = null;

export const setSeatIo = (io) => { ioInstance = io; };

const emitSeatUpdate = (seat) => {
  if (ioInstance) ioInstance.emit('seat:updated', seat);
};

const logHistory = async (data) => {
  try { await SeatHistory.create(data); } catch (_) {}
};

export const SeatService = {
  createSeat: async (data, userId) => {
    const existing = await Seat.findOne({ seatNumber: data.seatNumber });
    if (existing) throw new Error('Seat number already exists');
    const seat = await Seat.create({ ...data, createdBy: userId });
    const populated = await Seat.findById(seat._id)
      .populate('currentOccupant', 'fullName mobile')
      .populate('currentShift', 'shiftName startTime endTime');
    emitSeatUpdate(populated);
    return populated;
  },

  getAllSeats: async (filters = {}) => {
    const query = {};
    if (filters.status) query.status = filters.status;
    if (filters.floor) query.floor = filters.floor;
    if (filters.section) query.section = filters.section;
    if (filters.seatType) query.seatType = filters.seatType;
    if (filters.shift) query.currentShift = filters.shift;
    if (filters.search) {
      query.$or = [
        { seatNumber: { $regex: filters.search, $options: 'i' } },
      ];
    }
    return await Seat.find(query)
      .populate('currentOccupant', 'fullName mobile membershipStatus')
      .populate('currentShift', 'shiftName startTime endTime')
      .sort({ seatNumber: 1 });
  },

  getSeatGrid: async () => {
    return await Seat.find({ status: { $ne: 'Inactive' } })
      .populate('currentOccupant', 'fullName mobile')
      .populate('currentShift', 'shiftName startTime endTime')
      .sort({ floor: 1, section: 1, seatNumber: 1 });
  },

  getAvailableSeats: async (shiftId) => {
    const query = { status: 'Available' };
    if (shiftId) query.$or = [{ currentShift: null }, { currentShift: shiftId }];
    return await Seat.find(query)
      .populate('currentShift', 'shiftName startTime endTime')
      .sort({ seatNumber: 1 });
  },

  getSeatById: async (id) => {
    const seat = await Seat.findById(id)
      .populate('currentOccupant', 'fullName mobile email membershipStatus membershipExpiryDate')
      .populate('currentShift', 'shiftName startTime endTime');
    if (!seat) throw new Error('Seat not found');
    return seat;
  },

  updateSeat: async (id, data, userId) => {
    if (data.seatNumber) {
      const existing = await Seat.findOne({ seatNumber: data.seatNumber, _id: { $ne: id } });
      if (existing) throw new Error('Seat number already exists');
    }
    const old = await Seat.findById(id);
    const seat = await Seat.findByIdAndUpdate(id, { ...data, updatedBy: userId }, { new: true, runValidators: true })
      .populate('currentOccupant', 'fullName mobile')
      .populate('currentShift', 'shiftName startTime endTime');
    if (!seat) throw new Error('Seat not found');
    if (old.status !== seat.status) {
      await logHistory({ seatId: id, action: 'status_change', oldStatus: old.status, newStatus: seat.status, performedBy: userId });
    }
    emitSeatUpdate(seat);
    return seat;
  },

  deleteSeat: async (id) => {
    const seat = await Seat.findByIdAndDelete(id);
    if (!seat) throw new Error('Seat not found');
    if (ioInstance) ioInstance.emit('seat:deleted', { id });
    return true;
  },

  updateStatus: async (id, status, userId) => {
    const allowed = ['Available', 'Occupied', 'Reserved', 'Maintenance', 'Inactive'];
    if (!allowed.includes(status)) throw new Error('Invalid seat status');
    const old = await Seat.findById(id);
    const update = { status, updatedBy: userId };
    if (status === 'Available' || status === 'Maintenance' || status === 'Inactive') {
      update.currentOccupant = null;
      update.currentShift = null;
    }
    const seat = await Seat.findByIdAndUpdate(id, update, { new: true })
      .populate('currentOccupant', 'fullName mobile')
      .populate('currentShift', 'shiftName startTime endTime');
    if (!seat) throw new Error('Seat not found');
    await logHistory({ seatId: id, action: 'status_change', oldStatus: old.status, newStatus: status, performedBy: userId });
    emitSeatUpdate(seat);
    return seat;
  },

  assignSeat: async (seatId, memberId, shiftId, userId) => {
    const seat = await Seat.findById(seatId);
    if (!seat) throw new Error('Seat not found');
    if (seat.status === 'Maintenance') throw new Error('Seat is under maintenance');
    if (seat.status === 'Inactive') throw new Error('Seat is inactive');

    const existingMember = await Seat.findOne({ currentOccupant: memberId, _id: { $ne: seatId }, status: 'Occupied' });
    if (existingMember) throw new Error('This member is already assigned to seat ' + existingMember.seatNumber);

    const oldOccupant = seat.currentOccupant;
    seat.currentOccupant = memberId;
    seat.currentShift = shiftId;
    seat.status = 'Occupied';
    seat.updatedBy = userId;
    await seat.save();

    await Member.findByIdAndUpdate(memberId, { seatId, shiftId });

    await logHistory({ seatId, memberId, action: 'assign', shiftId, performedBy: userId });

    const populated = await Seat.findById(seatId)
      .populate('currentOccupant', 'fullName mobile')
      .populate('currentShift', 'shiftName startTime endTime');

    emitSeatUpdate(populated);
    return populated;
  },

  unassignSeat: async (seatId, userId) => {
    const seat = await Seat.findById(seatId);
    if (!seat) throw new Error('Seat not found');
    const memberId = seat.currentOccupant;
    seat.currentOccupant = null;
    seat.currentShift = null;
    seat.status = 'Available';
    seat.updatedBy = userId;
    await seat.save();

    if (memberId) {
      await Member.findByIdAndUpdate(memberId, { $unset: { seatId: 1, shiftId: 1 } });
      await logHistory({ seatId, memberId, action: 'unassign', performedBy: userId });
    }

    const populated = await Seat.findById(seatId)
      .populate('currentOccupant', 'fullName mobile')
      .populate('currentShift', 'shiftName startTime endTime');

    emitSeatUpdate(populated);
    return populated;
  },

  transferSeat: async (fromSeatId, toSeatId, memberId, shiftId, userId) => {
    const fromSeat = await Seat.findById(fromSeatId);
    if (!fromSeat) throw new Error('Source seat not found');
    const toSeat = await Seat.findById(toSeatId);
    if (!toSeat) throw new Error('Target seat not found');
    if (toSeat.status === 'Maintenance') throw new Error('Target seat is under maintenance');
    if (toSeat.status === 'Inactive') throw new Error('Target seat is inactive');
    if (toSeat.status === 'Occupied') throw new Error('Target seat is already occupied');

    fromSeat.currentOccupant = null;
    fromSeat.currentShift = null;
    fromSeat.status = 'Available';
    fromSeat.updatedBy = userId;
    await fromSeat.save();

    toSeat.currentOccupant = memberId;
    toSeat.currentShift = shiftId;
    toSeat.status = 'Occupied';
    toSeat.updatedBy = userId;
    await toSeat.save();

    await Member.findByIdAndUpdate(memberId, { seatId: toSeatId, shiftId });

    await logHistory({ seatId: fromSeatId, memberId, action: 'transfer', fromSeat: fromSeatId, toSeat: toSeatId, shiftId, performedBy: userId });

    const populatedFrom = await Seat.findById(fromSeatId)
      .populate('currentOccupant', 'fullName mobile')
      .populate('currentShift', 'shiftName startTime endTime');
    const populatedTo = await Seat.findById(toSeatId)
      .populate('currentOccupant', 'fullName mobile')
      .populate('currentShift', 'shiftName startTime endTime');

    emitSeatUpdate(populatedFrom);
    emitSeatUpdate(populatedTo);
    return { from: populatedFrom, to: populatedTo };
  },

  seatStats: async () => {
    const [statusCounts, total, typeCounts] = await Promise.all([
      Seat.aggregate([{ $group: { _id: '$status', count: { $sum: 1 } } }]),
      Seat.countDocuments(),
      Seat.aggregate([{ $group: { _id: '$seatType', count: { $sum: 1 } } }]),
    ]);
    const statusMap = Object.fromEntries(statusCounts.map(s => [s._id, s.count]));
    const typeMap = Object.fromEntries(typeCounts.map(t => [t._id, t.count]));
    const occupied = statusMap.Occupied || 0;
    return {
      total,
      available: statusMap.Available || 0,
      occupied,
      reserved: statusMap.Reserved || 0,
      maintenance: statusMap.Maintenance || 0,
      inactive: statusMap.Inactive || 0,
      occupancyPercentage: total ? Math.round((occupied / total) * 100) : 0,
      byType: typeMap,
    };
  },

  seatHistory: async (seatId, limit = 50) => {
    return await SeatHistory.find({ seatId })
      .populate('memberId', 'fullName mobile')
      .populate('performedBy', 'name')
      .sort({ createdAt: -1 })
      .limit(limit);
  },

  seatUsageStats: async (seatId) => {
    const seat = await Seat.findById(seatId);
    if (!seat) throw new Error('Seat not found');

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayEnd = new Date(today);
    todayEnd.setHours(24, 0, 0, 0);

    const [todayRecords, totalRecords, recentRecords] = await Promise.all([
      Attendance.countDocuments({ seatId, date: { $gte: today, $lt: todayEnd } }),
      Attendance.countDocuments({ seatId }),
      Attendance.find({ seatId }).sort({ date: -1 }).limit(30),
    ]);

    const totalDuration = totalRecords ? recentRecords.reduce((sum, r) => sum + (r.duration || 0), 0) : 0;
    const lastRecord = recentRecords[0];

    return {
      todayUsage: todayRecords,
      totalUsage: totalRecords,
      averageDailyUsage: totalRecords ? Math.round(totalDuration / Math.max(recentRecords.length, 1)) : 0,
      lastCheckIn: lastRecord?.checkInTime || seat.lastCheckIn,
      lastCheckOut: lastRecord?.checkOutTime || seat.lastCheckOut,
    };
  },
};
