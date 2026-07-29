import Expense from '../models/Expense.js';

const CATEGORIES = ['Rent', 'Utilities', 'Maintenance', 'Salary', 'Furniture', 'Supplies', 'Internet', 'Cleaning', 'Marketing', 'General'];

export const ExpenseService = {
  createExpense: async (data, userId) => {
    return Expense.create({ ...data, addedBy: userId });
  },

  updateExpense: async (id, data) => {
    const expense = await Expense.findByIdAndUpdate(id, data, { new: true, runValidators: true });
    if (!expense) throw new Error('Expense not found');
    return expense;
  },

  deleteExpense: async (id) => {
    const expense = await Expense.findByIdAndDelete(id);
    if (!expense) throw new Error('Expense not found');
    return true;
  },

  getExpenses: async (filters = {}) => {
    const query = {};
    if (filters.category) query.category = filters.category;
    if (filters.paymentMethod) query.paymentMethod = filters.paymentMethod;
    if (filters.startDate || filters.endDate) {
      query.expenseDate = {};
      if (filters.startDate) query.expenseDate.$gte = new Date(filters.startDate);
      if (filters.endDate) query.expenseDate.$lte = new Date(filters.endDate);
    }
    return Expense.find(query)
      .populate('addedBy', 'name')
      .sort({ expenseDate: -1 });
  },

  getExpenseById: async (id) => {
    const expense = await Expense.findById(id).populate('addedBy', 'name email');
    if (!expense) throw new Error('Expense not found');
    return expense;
  },

  getStats: async () => {
    const today = new Date();
    const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);
    const yearStart = new Date(today.getFullYear(), 0, 1);

    const [total, monthTotal, yearTotal, todayTotal] = await Promise.all([
      Expense.aggregate([{ $group: { _id: null, total: { $sum: '$amount' }, count: { $sum: 1 } } }]),
      Expense.aggregate([{ $match: { expenseDate: { $gte: monthStart } } }, { $group: { _id: null, total: { $sum: '$amount' }, count: { $sum: 1 } } }]),
      Expense.aggregate([{ $match: { expenseDate: { $gte: yearStart } } }, { $group: { _id: null, total: { $sum: '$amount' }, count: { $sum: 1 } } }]),
      Expense.aggregate([{ $match: { expenseDate: { $gte: new Date(today.getFullYear(), today.getMonth(), today.getDate()) } } }, { $group: { _id: null, total: { $sum: '$amount' } } }]),
    ]);

    return {
      totalAll: total[0]?.total || 0,
      totalCount: total[0]?.count || 0,
      monthTotal: monthTotal[0]?.total || 0,
      monthCount: monthTotal[0]?.count || 0,
      yearTotal: yearTotal[0]?.total || 0,
      yearCount: yearTotal[0]?.count || 0,
      todayTotal: todayTotal[0]?.total || 0,
    };
  },

  getDailyReport: async (date) => {
    const target = date ? new Date(date) : new Date();
    target.setHours(0, 0, 0, 0);
    const next = new Date(target);
    next.setDate(next.getDate() + 1);

    const expenses = await Expense.find({ expenseDate: { $gte: target, $lt: next } })
      .populate('addedBy', 'name')
      .sort({ expenseDate: -1 });

    const total = expenses.reduce((s, e) => s + e.amount, 0);
    return { date: target.toISOString().split('T')[0], expenses, total, count: expenses.length };
  },

  getMonthlyReport: async (month, year) => {
    const m = parseInt(month) || new Date().getMonth() + 1;
    const y = parseInt(year) || new Date().getFullYear();
    const start = new Date(y, m - 1, 1);
    const end = new Date(y, m, 0, 23, 59, 59);

    const expenses = await Expense.find({ expenseDate: { $gte: start, $lte: end } })
      .populate('addedBy', 'name')
      .sort({ expenseDate: -1 });

    const total = expenses.reduce((s, e) => s + e.amount, 0);
    const byCategory = {};
    expenses.forEach(e => {
      byCategory[e.category] = (byCategory[e.category] || 0) + e.amount;
    });

    return { month: m, year: y, expenses, total, count: expenses.length, byCategory };
  },

  getYearlyReport: async (year) => {
    const y = parseInt(year) || new Date().getFullYear();
    const start = new Date(y, 0, 1);
    const end = new Date(y, 11, 31, 23, 59, 59);

    const expenses = await Expense.find({ expenseDate: { $gte: start, $lte: end } })
      .populate('addedBy', 'name')
      .sort({ expenseDate: -1 });

    const total = expenses.reduce((s, e) => s + e.amount, 0);
    const byMonth = {};
    for (let i = 1; i <= 12; i++) byMonth[i] = { month: i, total: 0, count: 0 };

    expenses.forEach(e => {
      const m = e.expenseDate.getMonth() + 1;
      byMonth[m].total += e.amount;
      byMonth[m].count++;
    });

    return { year: y, expenses, total, count: expenses.length, byMonth: Object.values(byMonth) };
  },

  categories: () => CATEGORIES,
};
