import mongoose from 'mongoose';

const shiftSchema = new mongoose.Schema({
  shiftName: { type: String, required: true, trim: true },
  shiftCode: { type: String, required: true, unique: true, index: true, uppercase: true, trim: true },
  startTime: { type: String, required: true }, // Format HH:mm
  endTime: { type: String, required: true },   // Format HH:mm
  description: { type: String },
  status: { type: String, enum: ['Active', 'Inactive'], default: 'Active' }
}, { timestamps: true });

const Shift = mongoose.model('Shift', shiftSchema);
export default Shift;
