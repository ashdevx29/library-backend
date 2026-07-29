import express from 'express';
import { protect } from '../middleware/authMiddleware.js';
import { ProfileController } from '../controllers/ProfileController.js';
import multer from 'multer';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const storage = multer.diskStorage({
  destination: path.join(__dirname, '../../uploads'),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `profile-${req.user._id}-${Date.now()}${ext}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowed = /jpeg|jpg|png|gif|webp/;
    const ext = allowed.test(path.extname(file.originalname).toLowerCase());
    const mime = allowed.test(file.mimetype);
    if (ext && mime) return cb(null, true);
    cb(new Error('Only image files allowed'));
  },
});

const router = express.Router();

router.get('/', protect, ProfileController.getProfile);
router.put('/', protect, ProfileController.updateProfile);
router.put('/change-password', protect, ProfileController.changePassword);
router.post('/upload-image', protect, upload.single('profileImage'), ProfileController.uploadProfileImage);

export default router;
