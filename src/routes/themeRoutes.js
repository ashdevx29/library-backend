import express from 'express';
import { getTheme, updateTheme, uploadThemeAsset } from '../controllers/ThemeController.js';
import { protect, authorize } from '../middleware/authMiddleware.js';
import { upload } from '../middleware/uploadMiddleware.js';

const router = express.Router();

router.get('/', getTheme);
router.put('/', protect, authorize('Super Admin', 'Branch Admin'), updateTheme);
router.post(
  '/upload',
  protect,
  authorize('Super Admin', 'Branch Admin'),
  upload.single('file'),
  uploadThemeAsset
);

export default router;
