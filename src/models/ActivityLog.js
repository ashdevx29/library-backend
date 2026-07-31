import mongoose from 'mongoose';
// ertet
const activityLogSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  action: { type: String, required: true, index: true },
  module: { type: String, required: true, index: true },
  description: { type: String },
  ipAddress: { type: String },
  userAgent: { type: String },
  metadata: { type: mongoose.Schema.Types.Mixed },
  timestamp: { type: Date, default: Date.now, index: true },
});

activityLogSchema.index({ module: 1, action: 1 });
activityLogSchema.index({ timestamp: -1 });

const ActivityLog = mongoose.model('ActivityLog', activityLogSchema);
export default ActivityLog;
