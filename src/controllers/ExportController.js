import { ExportService } from '../services/ExportService.js';
import { exportConfigs } from '../services/exportConfigs.js';

export const ExportController = {
  exportData: async (req, res) => {
    try {
      const { entity } = req.params;
      const { format } = req.query;

      if (!['xlsx', 'csv', 'pdf'].includes(format)) {
        return res.status(400).json({ success: false, message: 'Invalid format. Use xlsx, csv, or pdf.' });
      }

      const ext = format === 'xlsx' ? 'xlsx' : format;
      const contentType =
        format === 'xlsx' ? 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' :
        format === 'csv' ? 'text/csv' : 'application/pdf';

      res.setHeader('Content-Type', contentType);
      res.setHeader('Content-Disposition', `attachment; filename=${entity}-${Date.now()}.${ext}`);

      if (format === 'xlsx') {
        const buf = await ExportService.toExcel(entity, req.query);
        res.send(Buffer.from(buf));
      } else if (format === 'csv') {
        const str = await ExportService.toCSV(entity, req.query);
        res.send(str);
      } else {
        const buf = await ExportService.toPDF(entity, req.query);
        res.send(buf);
      }
    } catch (error) {
      res.status(400).json({ success: false, message: error.message });
    }
  },

  getExportableEntities: async (req, res) => {
    try {
      const entities = Object.entries(exportConfigs).reduce((acc, [key, val]) => {
        acc[key] = { label: val.label, fields: val.fields.map(f => ({ key: f.key, label: f.label, type: f.type })) };
        return acc;
      }, {});
      res.json({ success: true, data: entities });
    } catch (error) {
      res.status(400).json({ success: false, message: error.message });
    }
  },
};
