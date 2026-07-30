import ExcelJS from 'exceljs';
import Member from '../models/Member.js';
import User from '../models/User.js';
import { exportConfigs } from './exportConfigs.js';
import { MemberService } from './MemberService.js';
import { PaymentService } from './PaymentService.js';
import { ExpenseService } from './ExpenseService.js';

const importHandlers = {
  members: async (rows, userId) => {
    const results = { imported: 0, skipped: 0, errors: [] };
    for (let i = 0; i < rows.length; i++) {
      try {
        const row = rows[i];
        const mobile = String(row.Mobile || row.mobile || '').trim();
        if (!mobile) { results.skipped++; results.errors.push({ row: i + 1, reason: 'Missing mobile' }); continue; }

        const existing = await Member.findOne({ mobile });
        if (existing) { results.skipped++; results.errors.push({ row: i + 1, reason: `Mobile ${mobile} already exists` }); continue; }

        const fullName = row.Name || row.fullName || row.FullName || '';
        if (!fullName) { results.skipped++; results.errors.push({ row: i + 1, reason: 'Missing name' }); continue; }

        const membershipPlan = (row.Plan || row.membershipPlan || row.MembershipPlan || 'Monthly').charAt(0).toUpperCase() + (row.Plan || row.membershipPlan || row.MembershipPlan || 'Monthly').slice(1).toLowerCase();
        const validPlans = ['Monthly', 'Quarterly', 'HalfYearly', 'Yearly'];
        const plan = validPlans.includes(membershipPlan) ? membershipPlan : 'Monthly';

        await MemberService.createMember({
          fullName,
          mobile,
          email: row.Email || row.email || '',
          address: row.Address || row.address || '',
          aadhaarNumber: row.Aadhaar || row.aadhaarNumber || '',
          membershipPlan: plan,
          joiningDate: row.Joining || row.joiningDate || new Date().toISOString().split('T')[0],
          membershipExpiryDate: row.Expiry || row.membershipExpiryDate || '',
          status: row.Status || row.status || 'Active',
        }, userId);
        results.imported++;
      } catch (e) {
        results.skipped++;
        results.errors.push({ row: i + 1, reason: e.message });
      }
    }
    return results;
  },

  expenses: async (rows, userId) => {
    const results = { imported: 0, skipped: 0, errors: [] };
    for (let i = 0; i < rows.length; i++) {
      try {
        const row = rows[i];
        const title = row.Title || row.title || '';
        const amount = Number(row.Amount || row.amount || 0);
        if (!title || !amount) { results.skipped++; results.errors.push({ row: i + 1, reason: 'Missing title or amount' }); continue; }

        await ExpenseService.createExpense({
          title,
          amount,
          category: row.Category || row.category || 'General',
          expenseDate: row.Date || row.expenseDate || new Date().toISOString().split('T')[0],
          description: row.Description || row.description || '',
          paymentMethod: (row.Method || row.paymentMethod || 'Cash').charAt(0).toUpperCase() + (row.Method || row.paymentMethod || 'Cash').slice(1).toLowerCase(),
        }, userId);
        results.imported++;
      } catch (e) {
        results.skipped++;
        results.errors.push({ row: i + 1, reason: e.message });
      }
    }
    return results;
  },

  payments: async (rows) => {
    const results = { imported: 0, skipped: 0, errors: [] };
    for (let i = 0; i < rows.length; i++) {
      try {
        const row = rows[i];
        const mobile = String(row.Mobile || row.mobile || '').trim();
        const member = mobile ? await Member.findOne({ mobile }) : null;
        if (!member) { results.skipped++; results.errors.push({ row: i + 1, reason: `Member not found for mobile ${mobile}` }); continue; }

        const amount = Number(row.Amount || row.amount || 0);
        if (!amount) { results.skipped++; results.errors.push({ row: i + 1, reason: 'Missing amount' }); continue; }

        await PaymentService.createPayment({
          memberId: member._id,
          amount,
          paymentMethod: (row.Method || row.paymentMethod || 'Cash').charAt(0).toUpperCase() + (row.Method || row.paymentMethod || 'Cash').slice(1).toLowerCase(),
          paymentDate: row.Date || row.paymentDate || new Date().toISOString().split('T')[0],
          transactionId: row.TransactionId || row.transactionId || '',
          status: (row.Status || row.status || 'Paid').charAt(0).toUpperCase() + (row.Status || row.status || 'Paid').slice(1).toLowerCase(),
        });
        results.imported++;
      } catch (e) {
        results.skipped++;
        results.errors.push({ row: i + 1, reason: e.message });
      }
    }
    return results;
  },
};

export const ImportService = {
  getImportableEntities: () => Object.keys(importHandlers),

  parseFile: async (buffer, mimeType, fileName) => {
    const ext = fileName.split('.').pop().toLowerCase();

    if (ext === 'csv') {
      const text = buffer.toString('utf-8');
      const lines = text.split('\n').filter(l => l.trim());
      if (lines.length < 2) throw new Error('CSV file must have a header row and at least one data row');
      const headers = lines[0].split(',').map(h => h.replace(/^"|"$/g, '').trim());
      const rows = lines.slice(1).map(line => {
        const vals = line.split(',').map(v => v.replace(/^"|"$/g, '').trim());
        return headers.reduce((obj, h, i) => { obj[h] = vals[i] || ''; return obj; }, {});
      });
      return rows;
    }

    if (['xlsx', 'xls'].includes(ext)) {
      const wb = new ExcelJS.Workbook();
      await wb.xlsx.load(buffer);
      const ws = wb.worksheets[0];
      if (!ws) throw new Error('Excel file has no worksheets');

      const headers = [];
      const rows = [];
      ws.eachRow((row, rowNumber) => {
        const vals = row.values.slice(1);
        if (rowNumber === 1) {
          headers.push(...vals.map(v => String(v ?? '').trim()));
        } else {
          const obj = headers.reduce((acc, h, i) => { acc[h] = vals[i] != null ? String(vals[i]).trim() : ''; return acc; }, {});
          rows.push(obj);
        }
      });
      if (rows.length === 0) throw new Error('Excel file has no data rows');
      return rows;
    }

    throw new Error('Unsupported file format. Use CSV or Excel files.');
  },

  importData: async (entity, rows, userId) => {
    const handler = importHandlers[entity];
    if (!handler) throw new Error(`Import not supported for entity: ${entity}`);
    return handler(rows, userId);
  },
};
