import mongoose from 'mongoose';

const seatHistorySchema = new mongoose.Schema({
  seatId: { type: mongoose.Schema.Types.ObjectId, ref: 'Seat', required: true, index: true },
  memberId: { type: mongoose.Schema.Types.ObjectId, ref: 'Member' },
  action: {
    type: String,
    enum: ['assign', 'unassign', 'transfer', 'checkin', 'checkout', 'status_change'],
    required: true,
  },
  fromSeat: { type: mongoose.Schema.Types.ObjectId, ref: 'Seat' },
  toSeat: { type: mongoose.Schema.Types.ObjectId, ref: 'Seat' },
  shiftId: { type: mongoose.Schema.Types.ObjectId, ref: 'Shift' },
  oldStatus: { type: String },
  newStatus: { type: String },
  duration: { type: Number },
  performedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  notes: { type: String },
}, { timestamps: true });

seatHistorySchema.index({ seatId: 1, createdAt: -1 });
seatHistorySchema.index({ memberId: 1, createdAt: -1 });

const SeatHistory = mongoose.model('SeatHistory', seatHistorySchema);
export default SeatHistory;
