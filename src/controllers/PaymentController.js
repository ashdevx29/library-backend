import { PaymentService } from '../services/PaymentService.js';

export const PaymentController = {
  createPayment: async (req, res) => {
    try {
      const data = await PaymentService.createPayment(req.body);
      res.status(201).json({ success: true, data });
    } catch (error) {
      res.status(400).json({ success: false, message: error.message });
    }
  },

  getPayments: async (req, res) => {
    try {
      const data = await PaymentService.getPayments(req.query);
      res.json({ success: true, data });
    } catch (error) {
      res.status(400).json({ success: false, message: error.message });
    }
  },

  getPaymentById: async (req, res) => {
    try {
      const data = await PaymentService.getPaymentById(req.params.id);
      if (!data) return res.status(404).json({ success: false, message: 'Payment not found' });
      res.json({ success: true, data });
    } catch (error) {
      res.status(400).json({ success: false, message: error.message });
    }
  },

  getPendingDues: async (req, res) => {
    try {
      const data = await PaymentService.getPendingDues();
      res.json({ success: true, data });
    } catch (error) {
      res.status(400).json({ success: false, message: error.message });
    }
  },

  markPaid: async (req, res) => {
    try {
      const data = await PaymentService.markPaid(req.params.id);
      res.json({ success: true, data, message: 'Marked as paid' });
    } catch (error) {
      res.status(400).json({ success: false, message: error.message });
    }
  },

  markFailed: async (req, res) => {
    try {
      const data = await PaymentService.markFailed(req.params.id);
      res.json({ success: true, data, message: 'Marked as failed' });
    } catch (error) {
      res.status(400).json({ success: false, message: error.message });
    }
  },

  getPaymentStats: async (req, res) => {
    try {
      const data = await PaymentService.getPaymentStats();
      res.json({ success: true, data });
    } catch (error) {
      res.status(400).json({ success: false, message: error.message });
    }
  },

  getUserPayments: async (req, res) => {
    try {
      const data = await PaymentService.getUserPayments(req.user._id);
      res.json({ success: true, data });
    } catch (error) {
      res.status(400).json({ success: false, message: error.message });
    }
  },

  getUserRenewals: async (req, res) => {
    try {
      const data = await PaymentService.getUserRenewals(req.user._id);
      res.json({ success: true, data });
    } catch (error) {
      res.status(400).json({ success: false, message: error.message });
    }
  },

  downloadReceipt: async (req, res) => {
    try {
      const pdfBuffer = await PaymentService.generateReceipt(req.params.id);
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename=receipt-${req.params.id.slice(-8)}.pdf`);
      res.send(pdfBuffer);
    } catch (error) {
      res.status(400).json({ success: false, message: error.message });
    }
  },

  downloadInvoice: async (req, res) => {
    try {
      const pdfBuffer = await PaymentService.generateInvoice(req.params.id);
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename=invoice-${req.params.id.slice(-8)}.pdf`);
      res.send(pdfBuffer);
    } catch (error) {
      res.status(400).json({ success: false, message: error.message });
    }
  },
};
