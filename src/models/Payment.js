import mongoose from 'mongoose';

const paymentSchema = new mongoose.Schema({
  memberId: { type: mongoose.Schema.Types.ObjectId, ref: 'Member', required: true, index: true },
  membershipId: { type: mongoose.Schema.Types.ObjectId, ref: 'Membership' },
  amount: { type: Number, required: true },
  paymentMethod: { 
    type: String, 
    enum: ['Cash', 'UPI', 'Bank Transfer'], 
    required: true 
  },
  paymentDate: { type: Date, required: true, index: true },
  transactionId: { type: String },
  status: { type: String, enum: ['Paid', 'Pending', 'Failed'], default: 'Pending' }
}, { timestamps: true });

const Payment = mongoose.model('Payment', paymentSchema);
export default Payment;
