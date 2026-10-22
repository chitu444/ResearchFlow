import { Router } from 'express';
import { authenticate, authorize } from '../middleware/auth.js';
import { listUsers, updateUser, deleteUser } from '../controllers/userController.js';

const router = Router();

router.use(authenticate);
router.use(authorize('institution_admin'));

router.get('/', listUsers);
router.patch('/:id', updateUser);
router.delete('/:id', deleteUser);

export default router;
