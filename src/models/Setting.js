import mongoose from 'mongoose';

const settingSchema = new mongoose.Schema({
  libraryName: { type: String, required: true },
  address: { type: String },
  email: { type: String },
  mobile: { type: String },
  gstNumber: { type: String },
  website: { type: String },
  supportEmail: { type: String }
}, { timestamps: true });

const Setting = mongoose.model('Setting', settingSchema);
export default Setting;
