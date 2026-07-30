import { SettingService } from '../services/SettingService.js';

const handle = (fn) => async (req, res) => {
  try { res.json({ success: true, data: await fn(req) }); }
  catch (e) { res.status(400).json({ success: false, message: e.message }); }
};

export const SettingController = {
  getGeneral: handle(() => SettingService.getGeneral()),
  updateGeneral: handle((req) => SettingService.updateGeneral(req.body)),
  getAttendance: handle(() => SettingService.getAttendance()),
  updateAttendance: handle((req) => SettingService.updateAttendance(req.body)),
  getMembership: handle(() => SettingService.getMembership()),
  updateMembership: handle((req) => SettingService.updateMembership(req.body)),
  getInvoice: handle(() => SettingService.getInvoice()),
  updateInvoice: handle((req) => SettingService.updateInvoice(req.body)),
  getSMTP: handle(() => SettingService.getSMTP()),
  updateSMTP: handle((req) => SettingService.updateSMTP(req.body)),
};
