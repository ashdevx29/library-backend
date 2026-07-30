import mongoose from 'mongoose';

const settingSchema = new mongoose.Schema({
  // General
  libraryName: { type: String, required: true },
  address: { type: String },
  email: { type: String },
  mobile: { type: String },
  gstNumber: { type: String },
  website: { type: String },
  supportEmail: { type: String },
  logo: { type: String },
  favicon: { type: String },

  // Attendance
  lateTime: { type: Number, default: 15 },
  autoCheckout: { type: Boolean, default: false },
  autoCheckoutTime: { type: String },
  qrExpiry: { type: Number, default: 5 },
  attendanceRadius: { type: Number, default: 100 },

  // Membership
  renewalGracePeriod: { type: Number, default: 7 },
  autoExpiry: { type: Boolean, default: true },

  // Invoice
  invoicePrefix: { type: String, default: 'INV' },
  invoiceFooter: { type: String },
  invoiceSignature: { type: String },

  // SMTP
  smtpHost: { type: String },
  smtpPort: { type: Number, default: 587 },
  smtpUser: { type: String },
  smtpPass: { type: String },
  smtpFrom: { type: String },
  smtpEnabled: { type: Boolean, default: false },
}, { timestamps: true });

const Setting = mongoose.model('Setting', settingSchema);
export default Setting;
