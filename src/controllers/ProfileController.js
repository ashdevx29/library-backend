import { ProfileService } from '../services/ProfileService.js';

export const ProfileController = {
  getProfile: async (req, res) => {
    try {
      const data = await ProfileService.getProfile(req.user._id);
      res.json({ success: true, data });
    } catch (error) {
      res.status(400).json({ success: false, message: error.message });
    }
  },

  updateProfile: async (req, res) => {
    try {
      const data = await ProfileService.updateProfile(req.user._id, req.body, req.user.role);
      res.json({ success: true, data });
    } catch (error) {
      res.status(400).json({ success: false, message: error.message });
    }
  },

  changePassword: async (req, res) => {
    try {
      const { currentPassword, newPassword } = req.body;
      if (!currentPassword || !newPassword) {
        return res.status(400).json({ success: false, message: 'Both current and new password are required' });
      }
      const data = await ProfileService.changePassword(req.user._id, currentPassword, newPassword, req.user.role);
      res.json({ success: true, data });
    } catch (error) {
      res.status(400).json({ success: false, message: error.message });
    }
  },

  uploadProfileImage: async (req, res) => {
    try {
      if (!req.file) return res.status(400).json({ success: false, message: 'No image provided' });
      const data = await ProfileService.uploadProfileImage(req.user._id, req.file);
      res.json({ success: true, data });
    } catch (error) {
      res.status(400).json({ success: false, message: error.message });
    }
  },
};
