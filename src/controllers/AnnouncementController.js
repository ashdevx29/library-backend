import { AnnouncementService } from '../services/AnnouncementService.js';

export const AnnouncementController = {
  create: async (req, res) => {
    try { res.status(201).json({ success: true, data: await AnnouncementService.create(req.body) }); }
    catch (e) { res.status(400).json({ success: false, message: e.message }); }
  },
  getAll: async (req, res) => {
    try { res.json({ success: true, data: await AnnouncementService.getAll(req.query) }); }
    catch (e) { res.status(400).json({ success: false, message: e.message }); }
  },
  getById: async (req, res) => {
    try { res.json({ success: true, data: await AnnouncementService.getById(req.params.id) }); }
    catch (e) { res.status(400).json({ success: false, message: e.message }); }
  },
  update: async (req, res) => {
    try { res.json({ success: true, data: await AnnouncementService.update(req.params.id, req.body) }); }
    catch (e) { res.status(400).json({ success: false, message: e.message }); }
  },
  delete: async (req, res) => {
    try { res.json({ success: true, data: await AnnouncementService.delete(req.params.id) }); }
    catch (e) { res.status(400).json({ success: false, message: e.message }); }
  },
  getActive: async (req, res) => {
    try { res.json({ success: true, data: await AnnouncementService.getActive() }); }
    catch (e) { res.status(400).json({ success: false, message: e.message }); }
  },
};
