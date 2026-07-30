import { ImportService } from '../services/ImportService.js';

export const ImportController = {
  importData: async (req, res) => {
    try {
      const { entity } = req.params;
      if (!req.file) return res.status(400).json({ success: false, message: 'No file uploaded' });

      const rows = await ImportService.parseFile(req.file.buffer, req.file.mimetype, req.file.originalname);
      const result = await ImportService.importData(entity, rows, req.user._id);

      res.json({
        success: true,
        data: result,
        message: `Imported ${result.imported} ${entity}, skipped ${result.skipped}`,
      });
    } catch (error) {
      res.status(400).json({ success: false, message: error.message });
    }
  },

  getImportableEntities: async (req, res) => {
    try {
      res.json({ success: true, data: ImportService.getImportableEntities() });
    } catch (error) {
      res.status(400).json({ success: false, message: error.message });
    }
  },
};
