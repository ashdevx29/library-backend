import mongoose from 'mongoose';

const otpSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  otp: { type: String, required: true },
  expiresAt: { type: Date, required: true },
  attemptCount: { type: Number, default: 0 },
  isVerified: { type: Boolean, default: false }
}, { timestamps: true });

const Otp = mongoose.model('Otp', otpSchema);
export default Otp;
