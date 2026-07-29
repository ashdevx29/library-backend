import { NotificationService } from '../services/NotificationService.js';

export const NotificationController = {
  create: async (req, res) => {
    try { res.status(201).json({ success: true, data: await NotificationService.create(req.body, req.user._id) }); }
    catch (e) { res.status(400).json({ success: false, message: e.message }); }
  },
  getAll: async (req, res) => {
    try { res.json({ success: true, data: await NotificationService.getAll(req.query) }); }
    catch (e) { res.status(400).json({ success: false, message: e.message }); }
  },
  getById: async (req, res) => {
    try { res.json({ success: true, data: await NotificationService.getById(req.params.id) }); }
    catch (e) { res.status(400).json({ success: false, message: e.message }); }
  },
  send: async (req, res) => {
    try { res.json({ success: true, data: await NotificationService.send(req.params.id) }); }
    catch (e) { res.status(400).json({ success: false, message: e.message }); }
  },
  getForMember: async (req, res) => {
    try { res.json({ success: true, data: await NotificationService.getForMember(req.user.memberId) }); }
    catch (e) { res.status(400).json({ success: false, message: e.message }); }
  },
  delete: async (req, res) => {
    try { res.json({ success: true, data: await NotificationService.delete(req.params.id) }); }
    catch (e) { res.status(400).json({ success: false, message: e.message }); }
  },
  update: async (req, res) => {
    try { res.json({ success: true, data: await NotificationService.update(req.params.id, req.body) }); }
    catch (e) { res.status(400).json({ success: false, message: e.message }); }
  },
  getStats: async (req, res) => {
    try { res.json({ success: true, data: await NotificationService.getStats() }); }
    catch (e) { res.status(400).json({ success: false, message: e.message }); }
  },
};
