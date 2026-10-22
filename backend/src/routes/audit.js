import { Router } from 'express';
import { authenticate, authorize } from '../middleware/auth.js';
import { listAuditLogs } from '../controllers/auditController.js';

const router = Router();

router.use(authenticate);
router.use(authorize('institution_admin'));

router.get('/', listAuditLogs);

export default router;
