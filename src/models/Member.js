import mongoose from 'mongoose';

const memberSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  photo: { type: String },
  fullName: { type: String, required: true },
  mobile: { type: String, required: true, unique: true, index: true },
  email: { type: String, unique: true, sparse: true, index: true },
  address: { type: String, required: true },
  aadhaarNumber: { type: String },
  seatId: { type: mongoose.Schema.Types.ObjectId, ref: 'Seat', index: true },
  shiftId: { type: mongoose.Schema.Types.ObjectId, ref: 'Shift', index: true },
  joiningDate: { type: Date, required: true },
  membershipPlan: { 
    type: String, 
    enum: ['Monthly', 'Quarterly', 'HalfYearly', 'Yearly'],
    required: true
  },
  membershipExpiryDate: { type: Date, required: true },
  attendancePercentage: { type: Number, default: 0 },
  status: { type: String, enum: ['Active', 'Inactive', 'Suspended'], default: 'Active' }
}, { timestamps: true });

const Member = mongoose.model('Member', memberSchema);
export default Member;
