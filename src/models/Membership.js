import mongoose from 'mongoose';

const membershipSchema = new mongoose.Schema({
  memberId: { type: mongoose.Schema.Types.ObjectId, ref: 'Member', required: true },
  planType: { 
    type: String, 
    enum: ['Monthly', 'Quarterly', 'HalfYearly', 'Yearly'],
    required: true
  },
  startDate: { type: Date, required: true },
  expiryDate: { type: Date, required: true, index: true },
  amount: { type: Number, required: true },
  status: { type: String, enum: ['Active', 'Expired', 'Cancelled'], default: 'Active' },
  approvedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
}, { timestamps: true });

// Auto calculate expiry logic will be handled in the service/controller

const Membership = mongoose.model('Membership', membershipSchema);
export default Membership;
