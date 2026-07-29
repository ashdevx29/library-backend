import mongoose from 'mongoose';

const branchSchema = new mongoose.Schema({
  branchName: { type: String, required: true },
  branchCode: { type: String, required: true, unique: true },
  address: { type: String, required: true },
  email: { type: String, required: true },
  mobile: { type: String, required: true },
  status: { type: String, enum: ['Active', 'Inactive'], default: 'Active' }
}, { timestamps: true });

const Branch = mongoose.model('Branch', branchSchema);
export default Branch;
