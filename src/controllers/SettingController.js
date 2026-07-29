import { SettingService } from '../services/SettingService.js';

export const SettingController = {
  get: async (req, res) => {
    try { res.json({ success: true, data: await SettingService.get() }); }
    catch (e) { res.status(400).json({ success: false, message: e.message }); }
  },
  update: async (req, res) => {
    try { res.json({ success: true, data: await SettingService.update(req.body) }); }
    catch (e) { res.status(400).json({ success: false, message: e.message }); }
  },
  getSMTP: async (req, res) => {
    try { res.json({ success: true, data: await SettingService.getSMTP() }); }
    catch (e) { res.status(400).json({ success: false, message: e.message }); }
  },
  updateSMTP: async (req, res) => {
    try { res.json({ success: true, data: await SettingService.updateSMTP(req.body) }); }
    catch (e) { res.status(400).json({ success: false, message: e.message }); }
  },
};
