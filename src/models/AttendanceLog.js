import mongoose from 'mongoose';

const attendanceLogSchema = new mongoose.Schema({
  memberId: { type: mongoose.Schema.Types.ObjectId, ref: 'Member', required: true, index: true },
  action: { type: String, enum: ['ClockIn', 'ClockOut'], required: true },
  timestamp: { type: Date, default: Date.now },
  device: { type: String },
  ipAddress: { type: String }
}, { timestamps: true });

const AttendanceLog = mongoose.model('AttendanceLog', attendanceLogSchema);
export default AttendanceLog;
