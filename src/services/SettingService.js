import Setting from '../models/Setting.js';

export const SettingService = {
  get: async () => {
    let s = await Setting.findOne();
    if (!s) s = await Setting.create({ libraryName: 'Saahityik Library' });
    return s;
  },

  update: async (data) => {
    let s = await Setting.findOne();
    if (!s) s = await Setting.create(data);
    else { Object.assign(s, data); await s.save(); }
    return s;
  },

  getSMTP: async () => {
    const s = await Setting.findOne();
    return {
      host: s?.smtpHost || '',
      port: s?.smtpPort || 587,
      user: s?.smtpUser || '',
      pass: s?.smtpPass || '',
      from: s?.smtpFrom || s?.email || '',
      enabled: s?.smtpEnabled || false,
    };
  },

  updateSMTP: async (data) => {
    let s = await Setting.findOne();
    if (!s) s = await Setting.create({ libraryName: 'Library' });
    Object.assign(s, {
      smtpHost: data.host, smtpPort: data.port, smtpUser: data.user,
      smtpPass: data.pass, smtpFrom: data.from, smtpEnabled: data.enabled,
    });
    await s.save();
    return s;
  },
};
