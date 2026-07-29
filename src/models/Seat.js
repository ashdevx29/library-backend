import mongoose from 'mongoose';

const seatSchema = new mongoose.Schema({
  seatNumber: { type: String, required: true, index: true },
  floor: { type: String, required: true },
  section: { type: String, required: true },
  seatType: {
    type: String,
    enum: ['Standard', 'Premium', 'Silent Zone', 'Reading Zone', 'Computer Desk'],
    default: 'Standard',
  },
  description: { type: String, default: '' },
  status: {
    type: String,
    enum: ['Available', 'Occupied', 'Reserved', 'Maintenance', 'Inactive'],
    default: 'Available',
    index: true,
  },
  currentOccupant: { type: mongoose.Schema.Types.ObjectId, ref: 'Member' },
  currentShift: { type: mongoose.Schema.Types.ObjectId, ref: 'Shift' },
  lastCheckIn: { type: Date },
  lastCheckOut: { type: Date },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
}, { timestamps: true });

seatSchema.index({ seatNumber: 1, floor: 1 });
seatSchema.index({ status: 1, floor: 1, section: 1 });

const Seat = mongoose.model('Seat', seatSchema);
export default Seat;
