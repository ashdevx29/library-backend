import mongoose from 'mongoose';
import crypto from 'crypto';
// rtet
const otpSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  otpHash: { type: String, required: true },
  expiresAt: { type: Date, required: true, index: { expireAfterSeconds: 0 } },
  attemptCount: { type: Number, default: 0 },
  isVerified: { type: Boolean, default: false },
  ipAddress: { type: String },
}, { timestamps: true });

otpSchema.statics.hashOtp = (otp) => crypto.createHash('sha256').update(otp).digest('hex');
otpSchema.statics.generateOtp = () => Math.floor(100000 + Math.random() * 900000).toString();

const Otp = mongoose.model('Otp', otpSchema);
export default Otp;
