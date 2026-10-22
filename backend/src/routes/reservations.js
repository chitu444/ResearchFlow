import { Router } from 'express';
import { authenticate, authorize } from '../middleware/auth.js';
import * as c from '../controllers/reservationController.js';

const router = Router();

router.use(authenticate);

router.get('/', c.list);
router.post('/', c.create);
router.patch('/:id/review', authorize('lab_manager', 'institution_admin'), c.review);
router.patch('/:id/cancel', c.cancel);

export default router;
