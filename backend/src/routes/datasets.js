import { Router } from 'express';
import { authenticate } from '../middleware/auth.js';
import { upload } from '../middleware/upload.js';
import * as c from '../controllers/datasetController.js';

const router = Router();

router.use(authenticate);

router.get('/', c.list);
router.post('/', upload.single('file'), c.uploadDataset);
router.get('/:id', c.detail);
router.get('/:id/download', c.download);
router.delete('/:id', c.remove);

export default router;
