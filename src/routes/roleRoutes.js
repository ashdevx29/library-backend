import express from 'express';
import { protect } from '../middleware/authMiddleware.js';
import { RoleController } from '../controllers/RoleController.js';

const router = express.Router();
router.get('/stats', protect, RoleController.getStats);
router.get('/', protect, RoleController.getAll);
router.get('/:id', protect, RoleController.getById);
router.post('/', protect, RoleController.create);
router.put('/:id', protect, RoleController.update);
router.delete('/:id', protect, RoleController.delete);

export default router;
