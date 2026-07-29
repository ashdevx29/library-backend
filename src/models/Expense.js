import mongoose from 'mongoose';

const expenseSchema = new mongoose.Schema({
  title: { type: String, required: true, trim: true },
  category: { type: String, default: 'General' },
  amount: { type: Number, required: true },
  expenseDate: { type: Date, required: true, index: true },
  description: { type: String },
  paymentMethod: { type: String, enum: ['Cash', 'UPI', 'Bank Transfer'], default: 'Cash' },
  addedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }
}, { timestamps: true });

const Expense = mongoose.model('Expense', expenseSchema);
export default Expense;
