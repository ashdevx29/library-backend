import express from 'express';
import { protect, authorize } from '../middleware/authMiddleware.js';
import { SettingController } from '../controllers/SettingController.js';

const router = express.Router();
router.use(protect);
router.use(authorize('Super Admin', 'Branch Admin', 'Staff'));

router.get('/general', SettingController.getGeneral);
router.put('/general', SettingController.updateGeneral);
router.get('/attendance', SettingController.getAttendance);
router.put('/attendance', SettingController.updateAttendance);
router.get('/membership', SettingController.getMembership);
router.put('/membership', SettingController.updateMembership);
router.get('/invoice', SettingController.getInvoice);
router.put('/invoice', SettingController.updateInvoice);
router.get('/smtp', SettingController.getSMTP);
router.put('/smtp', SettingController.updateSMTP);

export default router;
