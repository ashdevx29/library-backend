import mongoose from 'mongoose';
// efret
const blacklistedTokenSchema = new mongoose.Schema({
  tokenId: { type: String, required: true, index: true },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  type: { type: String, enum: ['access', 'refresh'], required: true },
  expiresAt: { type: Date, required: true, index: true },
}, { timestamps: true });

blacklistedTokenSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

const BlacklistedToken = mongoose.model('BlacklistedToken', blacklistedTokenSchema);
export default BlacklistedToken;
