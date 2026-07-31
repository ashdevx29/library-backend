import { MembershipService } from '../services/MembershipService.js';
// fff
export const MembershipController = {
  // User
  requestRenewal: async (req, res) => {
    try {
      const { planType, amount, paymentMethod } = req.body;
      if (!planType) return res.status(400).json({ success: false, message: 'Plan type required' });
      const data = await MembershipService.requestRenewal(req.user._id, planType, amount, paymentMethod);
      res.status(201).json({ success: true, data });
    } catch (error) {
      res.status(400).json({ success: false, message: error.message });
    }
  },

  getMyMembership: async (req, res) => {
    try {
      const data = await MembershipService.getMyMembership(req.user._id);
      res.json({ success: true, data });
    } catch (error) {
      res.status(400).json({ success: false, message: error.message });
    }
  },

  // Admin
  getPendingRenewals: async (req, res) => {
    try {
      const data = await MembershipService.getPendingRenewals();
      res.json({ success: true, data });
    } catch (error) {
      res.status(400).json({ success: false, message: error.message });
    }
  },

  getAllRenewals: async (req, res) => {
    try {
      const { status } = req.query;
      const data = await MembershipService.getAllRenewals(status);
      res.json({ success: true, data });
    } catch (error) {
      res.status(400).json({ success: false, message: error.message });
    }
  },

  approveRenewal: async (req, res) => {
    try {
      const data = await MembershipService.approveRenewal(req.params.id, req.user._id);
      res.json({ success: true, data, message: 'Renewal approved' });
    } catch (error) {
      res.status(400).json({ success: false, message: error.message });
    }
  },

  rejectRenewal: async (req, res) => {
    try {
      const { note } = req.body;
      const data = await MembershipService.rejectRenewal(req.params.id, req.user._id, note);
      res.json({ success: true, data, message: 'Renewal rejected' });
    } catch (error) {
      res.status(400).json({ success: false, message: error.message });
    }
  },

  getPayments: async (req, res) => {
    try {
      const data = await MembershipService.getPayments(req.query);
      res.json({ success: true, data });
    } catch (error) {
      res.status(400).json({ success: false, message: error.message });
    }
  },

  getPaymentStats: async (req, res) => {
    try {
      const data = await MembershipService.getPaymentStats();
      res.json({ success: true, data });
    } catch (error) {
      res.status(400).json({ success: false, message: error.message });
    }
  },

  getExpiredMembers: async (req, res) => {
    try {
      const { filter } = req.query;
      const data = await MembershipService.getExpiredMembers(filter);
      res.json({ success: true, data });
    } catch (error) {
      res.status(400).json({ success: false, message: error.message });
    }
  },

  getPlanStats: async (req, res) => {
    try {
      const data = await MembershipService.getPlanStats();
      res.json({ success: true, data });
    } catch (error) {
      res.status(400).json({ success: false, message: error.message });
    }
  },
};
