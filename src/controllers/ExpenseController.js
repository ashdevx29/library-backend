import { ExpenseService } from '../services/ExpenseService.js';

export const ExpenseController = {
  create: async (req, res) => {
    try {
      const data = await ExpenseService.createExpense(req.body, req.user._id);
      res.status(201).json({ success: true, data });
    } catch (error) {
      res.status(400).json({ success: false, message: error.message });
    }
  },

  update: async (req, res) => {
    try {
      const data = await ExpenseService.updateExpense(req.params.id, req.body);
      res.json({ success: true, data });
    } catch (error) {
      res.status(400).json({ success: false, message: error.message });
    }
  },

  delete: async (req, res) => {
    try {
      await ExpenseService.deleteExpense(req.params.id);
      res.json({ success: true, message: 'Deleted' });
    } catch (error) {
      res.status(400).json({ success: false, message: error.message });
    }
  },

  getAll: async (req, res) => {
    try {
      const data = await ExpenseService.getExpenses(req.query);
      res.json({ success: true, data });
    } catch (error) {
      res.status(400).json({ success: false, message: error.message });
    }
  },

  getById: async (req, res) => {
    try {
      const data = await ExpenseService.getExpenseById(req.params.id);
      res.json({ success: true, data });
    } catch (error) {
      res.status(400).json({ success: false, message: error.message });
    }
  },

  getStats: async (req, res) => {
    try {
      const data = await ExpenseService.getStats();
      res.json({ success: true, data });
    } catch (error) {
      res.status(400).json({ success: false, message: error.message });
    }
  },

  getDailyReport: async (req, res) => {
    try {
      const data = await ExpenseService.getDailyReport(req.query.date);
      res.json({ success: true, data });
    } catch (error) {
      res.status(400).json({ success: false, message: error.message });
    }
  },

  getMonthlyReport: async (req, res) => {
    try {
      const { month, year } = req.query;
      const data = await ExpenseService.getMonthlyReport(month, year);
      res.json({ success: true, data });
    } catch (error) {
      res.status(400).json({ success: false, message: error.message });
    }
  },

  getYearlyReport: async (req, res) => {
    try {
      const data = await ExpenseService.getYearlyReport(req.query.year);
      res.json({ success: true, data });
    } catch (error) {
      res.status(400).json({ success: false, message: error.message });
    }
  },

  getCategories: async (req, res) => {
    res.json({ success: true, data: ExpenseService.categories() });
  },
};
