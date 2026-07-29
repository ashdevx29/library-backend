import mongoose from 'mongoose';

const attendanceSchema = new mongoose.Schema({
  memberId: { type: mongoose.Schema.Types.ObjectId, ref: 'Member', required: true },
  date: { type: Date, required: true, index: true },
  checkInTime: { type: Date, required: true },
  checkOutTime: { type: Date },
  duration: { type: Number }, // Duration in minutes
  status: { type: String, enum: ['Present', 'Absent'], required: true },
  shiftId: { type: mongoose.Schema.Types.ObjectId, ref: 'Shift', required: true },
  seatId: { type: mongoose.Schema.Types.ObjectId, ref: 'Seat', required: true }
}, { timestamps: true });

const Attendance = mongoose.model('Attendance', attendanceSchema);
export default Attendance;
