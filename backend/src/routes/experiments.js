import { Router } from 'express';
import { authenticate } from '../middleware/auth.js';
import * as c from '../controllers/experimentController.js';

const router = Router();

router.use(authenticate);

router.get('/', c.list);
router.post('/', c.create);
router.get('/:id', c.getOne);
router.patch('/:id', c.update);
router.delete('/:id', c.deleteExperiment);

router.post('/:id/comments', c.addComment);
router.post('/:id/tasks', c.addTask);
router.patch('/:id/tasks/:taskId', c.updateTask);

export default router;
