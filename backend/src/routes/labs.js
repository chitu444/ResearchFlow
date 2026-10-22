import {Router} from 'express';
import {authenticate,authorize} from '../middleware/auth.js';
import * as c from '../controllers/labController.js';
const r=Router();r.use(authenticate);
r.get('/departments',c.departments);r.get('/laboratories',c.laboratories);
r.post('/departments',authorize('institution_admin'),c.createDepartment);r.patch('/departments/:id',authorize('institution_admin'),c.updateDepartment);r.delete('/departments/:id',authorize('institution_admin'),c.deleteDepartment);
r.post('/laboratories',authorize('institution_admin'),c.createLaboratory);r.patch('/laboratories/:id',authorize('institution_admin'),c.updateLaboratory);r.delete('/laboratories/:id',authorize('institution_admin'),c.deleteLaboratory);
export default r;
