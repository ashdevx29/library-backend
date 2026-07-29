import { MemberCardService } from '../services/MemberCardService.js';

export const MemberCardController = {
  generateCard: async (req, res) => {
    try {
      const pdfBuffer = await MemberCardService.generateCard(req.params.id);
      res.set({
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="member-card-${req.params.id}.pdf"`,
        'Content-Length': pdfBuffer.length,
      });
      res.send(pdfBuffer);
    } catch (e) {
      res.status(400).json({ success: false, message: e.message });
    }
  },

  getCardData: async (req, res) => {
    try {
      const data = await MemberCardService.getCardData(req.params.id);
      res.json({ success: true, data });
    } catch (e) {
      res.status(400).json({ success: false, message: e.message });
    }
  },
};
