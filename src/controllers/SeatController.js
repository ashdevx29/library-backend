import { SeatService } from '../services/SeatService.js';

const send = (fn) => async (req, res) => {
  try { res.json({ success: true, data: await fn(req) }); }
  catch (e) { res.status(400).json({ success: false, message: e.message }); }
};

export const createSeat = send(async (req) => {
  const { seatNumber, floor, section, seatType, description, status } = req.body;
  if (!seatNumber || !floor || !section) throw new Error('seatNumber, floor and section are required');
  return SeatService.createSeat({ seatNumber, floor, section, seatType, description, status }, req.user._id);
});

export const getAllSeats = send(async (req) => SeatService.getAllSeats(req.query));

export const getSeatGrid = send(async () => SeatService.getSeatGrid());

export const getAvailableSeats = send(async (req) => SeatService.getAvailableSeats(req.query.shift));

export const getSeatById = send(async (req) => SeatService.getSeatById(req.params.id));

export const updateSeat = send(async (req) => SeatService.updateSeat(req.params.id, req.body, req.user._id));

export const deleteSeat = send(async (req) => { await SeatService.deleteSeat(req.params.id); return 'deleted'; });

export const updateSeatStatus = send(async (req) => SeatService.updateStatus(req.params.id, req.body.status, req.user._id));

export const assignSeat = send(async (req) => {
  const { memberId, shiftId } = req.body;
  if (!memberId || !shiftId) throw new Error('memberId and shiftId are required');
  return SeatService.assignSeat(req.params.id, memberId, shiftId, req.user._id);
});

export const unassignSeat = send(async (req) => SeatService.unassignSeat(req.params.id, req.user._id));

export const transferSeat = send(async (req) => {
  const { toSeatId, memberId, shiftId } = req.body;
  if (!toSeatId || !memberId || !shiftId) throw new Error('toSeatId, memberId and shiftId are required');
  return SeatService.transferSeat(req.params.id, toSeatId, memberId, shiftId, req.user._id);
});

export const seatStats = send(async () => SeatService.seatStats());

export const seatHistory = send(async (req) => SeatService.seatHistory(req.params.id, Number(req.query.limit) || 50));

export const seatUsageStats = send(async (req) => SeatService.seatUsageStats(req.params.id));
