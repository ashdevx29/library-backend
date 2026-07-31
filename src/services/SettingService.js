import Setting from '../models/Setting.js';
// rrhrh
const getDoc = async () => {
  let s = await Setting.findOne();
  if (!s) s = await Setting.create({ libraryName: 'Saahityik Library' });
  return s;
};

const GENERAL_FIELDS = ['libraryName', 'address', 'email', 'mobile', 'gstNumber', 'website', 'supportEmail', 'logo', 'favicon'];
const ATTENDANCE_FIELDS = ['lateTime', 'autoCheckout', 'autoCheckoutTime', 'qrExpiry', 'attendanceRadius'];
const MEMBERSHIP_FIELDS = ['renewalGracePeriod', 'autoExpiry'];
const INVOICE_FIELDS = ['invoicePrefix', 'invoiceFooter', 'invoiceSignature'];

export const SettingService = {
  getGeneral: async () => {
    const s = await getDoc();
    const obj = {};
    GENERAL_FIELDS.forEach(f => obj[f] = s[f] ?? null);
    return obj;
  },

  updateGeneral: async (data) => {
    const s = await getDoc();
    GENERAL_FIELDS.forEach(f => { if (data[f] !== undefined) s[f] = data[f]; });
    await s.save();
    return s;
  },

  getAttendance: async () => {
    const s = await getDoc();
    const obj = {};
    ATTENDANCE_FIELDS.forEach(f => obj[f] = s[f] ?? null);
    return obj;
  },

  updateAttendance: async (data) => {
    const s = await getDoc();
    ATTENDANCE_FIELDS.forEach(f => { if (data[f] !== undefined) s[f] = data[f]; });
    await s.save();
    return s;
  },

  getMembership: async () => {
    const s = await getDoc();
    const obj = {};
    MEMBERSHIP_FIELDS.forEach(f => obj[f] = s[f] ?? null);
    return obj;
  },

  updateMembership: async (data) => {
    const s = await getDoc();
    MEMBERSHIP_FIELDS.forEach(f => { if (data[f] !== undefined) s[f] = data[f]; });
    await s.save();
    return s;
  },

  getInvoice: async () => {
    const s = await getDoc();
    const obj = {};
    INVOICE_FIELDS.forEach(f => obj[f] = s[f] ?? null);
    return obj;
  },

  updateInvoice: async (data) => {
    const s = await getDoc();
    INVOICE_FIELDS.forEach(f => { if (data[f] !== undefined) s[f] = data[f]; });
    await s.save();
    return s;
  },

  getSMTP: async () => {
    const s = await getDoc();
    return {
      host: s.smtpHost || '',
      port: s.smtpPort || 587,
      user: s.smtpUser || '',
      pass: s.smtpPass || '',
      from: s.smtpFrom || s.email || '',
      enabled: s.smtpEnabled || false,
    };
  },

  updateSMTP: async (data) => {
    const s = await getDoc();
    ['host', 'port', 'user', 'pass', 'from', 'enabled'].forEach(k => {
      if (data[k] !== undefined) s[`smtp${k.charAt(0).toUpperCase() + k.slice(1)}`] = data[k];
    });
    await s.save();
    return s;
  },
};
