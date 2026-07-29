import mongoose from 'mongoose';

const renewalRequestSchema = new mongoose.Schema({
  memberId: { type: mongoose.Schema.Types.ObjectId, ref: 'Member', required: true, index: true },
  planType: {
    type: String,
    enum: ['Monthly', 'Quarterly', 'HalfYearly', 'Yearly'],
    required: true,
  },
  amount: { type: Number, required: true },
  paymentMethod: { type: String, enum: ['Cash', 'UPI', 'Bank Transfer'], default: 'Cash' },
  status: { type: String, enum: ['Pending', 'Approved', 'Rejected'], default: 'Pending', index: true },
  requestedAt: { type: Date, default: Date.now },
  reviewedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  reviewedAt: { type: Date },
  note: { type: String },
}, { timestamps: true });

const RenewalRequest = mongoose.model('RenewalRequest', renewalRequestSchema);
export default RenewalRequest;
