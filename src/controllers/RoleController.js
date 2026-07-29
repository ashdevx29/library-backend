import { RoleService } from '../services/RoleService.js';

export const RoleController = {
  getAll: async (req, res) => {
    try { res.json({ success: true, data: await RoleService.getAll(req.query) }); }
    catch (e) { res.status(400).json({ success: false, message: e.message }); }
  },
  getById: async (req, res) => {
    try { res.json({ success: true, data: await RoleService.getById(req.params.id) }); }
    catch (e) { res.status(400).json({ success: false, message: e.message }); }
  },
  create: async (req, res) => {
    try { res.status(201).json({ success: true, data: await RoleService.create(req.body) }); }
    catch (e) { res.status(400).json({ success: false, message: e.message }); }
  },
  update: async (req, res) => {
    try { res.json({ success: true, data: await RoleService.update(req.params.id, req.body) }); }
    catch (e) { res.status(400).json({ success: false, message: e.message }); }
  },
  delete: async (req, res) => {
    try { res.json({ success: true, data: await RoleService.delete(req.params.id) }); }
    catch (e) { res.status(400).json({ success: false, message: e.message }); }
  },
  getStats: async (req, res) => {
    try { res.json({ success: true, data: await RoleService.getStats() }); }
    catch (e) { res.status(400).json({ success: false, message: e.message }); }
  },
};
