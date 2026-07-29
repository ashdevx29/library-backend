import { BackupService } from '../services/BackupService.js';

export const BackupController = {
  createBackup: async (req, res) => {
    try { res.json({ success: true, data: await BackupService.createBackup() }); }
    catch (e) { res.status(400).json({ success: false, message: e.message }); }
  },
  getBackups: async (req, res) => {
    try { res.json({ success: true, data: await BackupService.getBackups() }); }
    catch (e) { res.status(400).json({ success: false, message: e.message }); }
  },
  restoreBackup: async (req, res) => {
    try { res.json({ success: true, data: await BackupService.restoreBackup(req.params.filename) }); }
    catch (e) { res.status(400).json({ success: false, message: e.message }); }
  },
  deleteBackup: async (req, res) => {
    try { res.json({ success: true, data: await BackupService.deleteBackup(req.params.filename) }); }
    catch (e) { res.status(400).json({ success: false, message: e.message }); }
  },
};
