import mongoose from 'mongoose';

const notificationSchema = new mongoose.Schema({
  title: { type: String, required: true, trim: true },
  message: { type: String, required: true },
  type: { type: String, enum: ['Fee Reminder', 'Membership Expiry', 'Attendance Alert', 'General Notice'], required: true },
  targetRole: { type: String, enum: ['All', 'Student', 'Staff'], default: 'All' },
  targetMembers: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Member' }],
  sentTo: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Member' }],
  status: { type: String, enum: ['Draft', 'Sent'], default: 'Draft' },
  sentAt: { type: Date },
  sentBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
}, { timestamps: true });

notificationSchema.index({ type: 1, status: 1, createdAt: -1 });
notificationSchema.index({ targetMembers: 1, status: 1 });

const Notification = mongoose.model('Notification', notificationSchema);
export default Notification;
