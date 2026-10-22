import { Router } from 'express';
import { authenticate, authorize } from '../middleware/auth.js';
import * as c from '../controllers/equipmentController.js';

const router = Router();

router.use(authenticate);

router.get('/', c.list);
router.post('/', authorize('lab_manager', 'institution_admin'), c.create);
router.patch('/:id', authorize('lab_manager', 'institution_admin'), c.update);
router.post('/:id/maintenance', authorize('lab_manager', 'institution_admin'), c.addMaintenance);
router.delete('/:id', authorize('lab_manager', 'institution_admin'), c.remove);

export default router;
