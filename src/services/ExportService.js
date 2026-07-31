import ExcelJS from 'exceljs';
import PDFKit from 'pdfkit';
import Member from '../models/Member.js';
import Payment from '../models/Payment.js';
import Attendance from '../models/Attendance.js';
import Expense from '../models/Expense.js';
import { exportConfigs } from './exportConfigs.js';

const entityModelMap = {
  members: Member,
  payments: Payment,
  attendance: Attendance,
  expenses: Expense,
};
// fe

const buildFilter = (entity, query = {}) => {
  const filter = {};
  if (query.startDate || query.endDate) {
    const dateField = entity === 'attendance' ? 'date' : entity === 'payments' ? 'paymentDate' : entity === 'expenses' ? 'expenseDate' : 'createdAt';
    if (query.startDate) filter[dateField] = { ...filter[dateField], $gte: new Date(query.startDate) };
    if (query.endDate) filter[dateField] = { ...filter[dateField], $lte: new Date(query.endDate) };
  }
  if (query.status) filter.status = query.status;
  if (query.membershipPlan) filter.membershipPlan = query.membershipPlan;
  return filter;
};

const populateMap = {
  members: ['shiftId', 'seatId', 'userId'],
  payments: [{ path: 'memberId', select: 'fullName mobile' }, { path: 'membershipId', select: 'planType' }],
  attendance: [{ path: 'memberId', select: 'fullName mobile' }, { path: 'shiftId', select: 'shiftName' }, { path: 'seatId', select: 'seatNumber' }],
  expenses: [{ path: 'addedBy', select: 'name' }],
};

const resolveValue = (obj, path) => {
  if (!obj || !path) return '';
  if (typeof path === 'function') return path(obj);
  const keys = path.split('.');
  let val = obj;
  for (const k of keys) {
    if (val == null) return '';
    val = val[k];
  }
  return val ?? '';
};

const formatValue = (val, type) => {
  if (val == null) return '';
  if (type === 'date') return val instanceof Date ? val.toLocaleDateString() : String(val);
  if (type === 'datetime') return val instanceof Date ? val.toLocaleString() : String(val);
  if (type === 'currency') {
    const n = Number(val);
    return isNaN(n) ? String(val) : `₹${n.toLocaleString()}`;
  }
  return String(val);
};

export const ExportService = {
  getConfig: (entity) => {
    const config = exportConfigs[entity];
    if (!config) throw new Error(`Unknown entity: ${entity}`);
    return config;
  },

  fetchData: async (entity, query = {}) => {
    const Model = entityModelMap[entity];
    if (!Model) throw new Error(`Unknown entity: ${entity}`);
    const filter = buildFilter(entity, query);
    const pop = populateMap[entity];
    let q = Model.find(filter).populate(pop || []).sort({ createdAt: -1 });
    if (query.limit) q = q.limit(Number(query.limit));
    return q.lean();
  },

  toRows: (entity, data) => {
    const config = exportConfigs[entity];
    if (!config) throw new Error(`Unknown entity: ${entity}`);
    return data.map(item => config.fields.map(f => formatValue(resolveValue(item, f.key), f.type)));
  },

  toExcel: async (entity, query = {}) => {
    const config = ExportService.getConfig(entity);
    const data = await ExportService.fetchData(entity, query);
    const rows = ExportService.toRows(entity, data);

    const wb = new ExcelJS.Workbook();
    const ws = wb.addWorksheet(config.label);
    ws.columns = config.fields.map(f => ({ header: f.label, width: Math.max(f.label.length + 2, 15) }));
    ws.addRows(rows);

    const headerRow = ws.getRow(1);
    headerRow.font = { bold: true, color: { argb: 'FFFFFFFF' } };
    headerRow.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF2563EB' } };
    headerRow.alignment = { horizontal: 'center' };
    ws.eachRow((row) => { row.eachCell((cell) => { cell.border = { top: { style: 'thin' }, left: { style: 'thin' }, bottom: { style: 'thin' }, right: { style: 'thin' } }; }); });

    const buffer = await wb.xlsx.writeBuffer();
    return buffer;
  },

  toCSV: async (entity, query = {}) => {
    const config = ExportService.getConfig(entity);
    const data = await ExportService.fetchData(entity, query);
    const rows = ExportService.toRows(entity, data);

    const header = config.fields.map(f => `"${f.label}"`).join(',');
    const body = rows.map(r => r.map(v => `"${String(v ?? '').replace(/"/g, '""')}"`).join(',')).join('\n');
    return `${header}\n${body}`;
  },

  toPDF: async (entity, query = {}) => {
    const config = ExportService.getConfig(entity);
    const data = await ExportService.fetchData(entity, query);
    const rows = ExportService.toRows(entity, data);

    return new Promise((resolve, reject) => {
      try {
        const doc = new PDFKit({ margin: 30, size: 'A4', layout: rows.length > 20 ? 'landscape' : 'portrait' });
        const chunks = [];
        doc.on('data', c => chunks.push(c));
        doc.on('end', () => resolve(Buffer.concat(chunks)));
        doc.on('error', reject);

        doc.fontSize(16).font('Helvetica-Bold').text(config.label, { align: 'center' });
        doc.moveDown();
        doc.fontSize(8).font('Helvetica').text(`Generated: ${new Date().toLocaleString()}`, { align: 'right' });
        doc.moveDown(0.5);

        const headers = config.fields.map(f => f.label);
        const colWidth = Math.min(110, (doc.page.width - 60) / headers.length);
        const pageHeight = doc.page.height - doc.page.margins.bottom;

        const drawTable = (startY) => {
          let y = startY;

          doc.font('Helvetica-Bold').fontSize(7);
          headers.forEach((h, i) => {
            doc.text(h, 30 + i * colWidth, y, { width: colWidth - 2, align: 'left' });
          });
          y += 14;

          doc.font('Helvetica').fontSize(7);
          for (const row of rows) {
            if (y + 14 > pageHeight) {
              doc.addPage();
              y = 30;
              doc.font('Helvetica-Bold').fontSize(7);
              headers.forEach((h, i) => {
                doc.text(h, 30 + i * colWidth, y, { width: colWidth - 2, align: 'left' });
              });
              y += 14;
              doc.font('Helvetica').fontSize(7);
            }
            row.forEach((val, i) => {
              const str = String(val ?? '');
              doc.text(str.length > 30 ? str.slice(0, 30) + '...' : str, 30 + i * colWidth, y, { width: colWidth - 2, align: 'left' });
            });
            y += 12;
          }
        };

        drawTable(doc.y + 5);
        doc.end();
      } catch (e) {
        reject(e);
      }
    });
  },
};
